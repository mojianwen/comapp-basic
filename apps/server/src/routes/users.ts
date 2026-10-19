import bcrypt from 'bcryptjs'
import { Router } from 'express'
import { query, withTx } from '../db/pool.js'
import { auth } from '../middlewares/auth.js'
import { ApiError, ok } from '../middlewares/errorHandler.js'
import { requirePermission } from '../middlewares/rbac.js'

export const usersRouter = Router()
usersRouter.use(auth)

/** 分页列表：keyword 模糊匹配用户名/姓名，可按 status 过滤；附带角色列表 */
usersRouter.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1))
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize ?? 10)))
    const keyword = String(req.query.keyword ?? '').trim()
    const status = req.query.status === '' || req.query.status === undefined ? null : Number(req.query.status)

    const where: string[] = []
    const params: unknown[] = []
    if (keyword) {
      params.push(`%${keyword}%`)
      where.push(`(u.username ILIKE $${params.length} OR u.name ILIKE $${params.length})`)
    }
    if (status !== null) {
      params.push(status)
      where.push(`u.status = $${params.length}`)
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

    const rows = await query(
      `SELECT u.id, u.username, u.name, u.email, u.phone, u.status, u.is_builtin, u.created_at,
              COALESCE(json_agg(json_build_object('id', r.id, 'name', r.name))
                       FILTER (WHERE r.id IS NOT NULL), '[]') AS roles
       FROM sys_user u
       LEFT JOIN sys_user_role ur ON ur.user_id = u.id
       LEFT JOIN sys_role r ON r.id = ur.role_id
       ${whereSql}
       GROUP BY u.id
       ORDER BY u.id
       LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`,
      params,
    )
    const [{ count }] = await query<{ count: string }>(
      `SELECT count(*)::text AS count FROM sys_user u ${whereSql}`,
      params,
    )
    ok(res, { list: rows, total: Number(count) })
  } catch (e) {
    next(e)
  }
})

/** 新增用户（含角色绑定），事务保证一致性 */
usersRouter.post('/', requirePermission('user:create'), async (req, res, next) => {
  try {
    const { username, name, password, email, phone, status = 1, roleIds = [] } = req.body ?? {}
    if (!username?.trim() || !name?.trim() || !password) {
      throw new ApiError('用户名、姓名、密码为必填项', 'BAD_REQUEST', 400)
    }
    if (String(password).length < 6) {
      throw new ApiError('密码至少 6 位', 'BAD_REQUEST', 400)
    }
    const hash = bcrypt.hashSync(String(password), 10)
    const id = await withTx(async (tx) => {
      const dup = await tx.query('SELECT 1 FROM sys_user WHERE username = $1', [username.trim()])
      if (dup.rowCount) {
        throw new ApiError(`用户名「${username.trim()}」已存在`, 'USERNAME_EXISTS')
      }
      const { rows } = await tx.query<{ id: number }>(
        `INSERT INTO sys_user (username, password_hash, name, email, phone, status)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [username.trim(), hash, name.trim(), email ?? null, phone ?? null, status],
      )
      for (const roleId of roleIds as number[]) {
        await tx.query('INSERT INTO sys_user_role (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [
          rows[0].id,
          roleId,
        ])
      }
      return rows[0].id
    })
    ok(res, { id })
  } catch (e) {
    next(e)
  }
})

/** 编辑用户（不含密码；重写角色绑定） */
usersRouter.put('/:id', requirePermission('user:edit'), async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const { name, email, phone, status, roleIds } = req.body ?? {}
    await withTx(async (tx) => {
      const { rowCount } = await tx.query(
        `UPDATE sys_user SET name = COALESCE($2, name), email = $3, phone = $4,
                status = COALESCE($5, status), updated_at = now()
         WHERE id = $1`,
        [id, name ?? null, email ?? null, phone ?? null, status ?? null],
      )
      if (!rowCount) throw new ApiError('用户不存在', 'NOT_FOUND', 404)
      if (Array.isArray(roleIds)) {
        await tx.query('DELETE FROM sys_user_role WHERE user_id = $1', [id])
        for (const roleId of roleIds) {
          await tx.query(
            'INSERT INTO sys_user_role (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [id, roleId],
          )
        }
      }
    })
    ok(res)
  } catch (e) {
    next(e)
  }
})

/** 删除用户：内置账号保护 */
usersRouter.delete('/:id', requirePermission('user:delete'), async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const users = await query<{ is_builtin: number }>('SELECT is_builtin FROM sys_user WHERE id = $1', [id])
    if (!users[0]) throw new ApiError('用户不存在', 'NOT_FOUND', 404)
    if (users[0].is_builtin) {
      throw new ApiError('内置账号不允许删除', 'RULE_BUILTIN')
    }
    await query('DELETE FROM sys_user WHERE id = $1', [id])
    ok(res)
  } catch (e) {
    next(e)
  }
})

/** 启用 / 停用 */
usersRouter.put('/:id/status', requirePermission('user:edit'), async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const status = Number(req.body?.status)
    if (status !== 0 && status !== 1) {
      throw new ApiError('status 仅支持 0/1', 'BAD_REQUEST', 400)
    }
    const users = await query<{ is_builtin: number }>('SELECT is_builtin FROM sys_user WHERE id = $1', [id])
    if (!users[0]) throw new ApiError('用户不存在', 'NOT_FOUND', 404)
    if (users[0].is_builtin && status === 0) {
      throw new ApiError('内置账号不允许停用', 'RULE_BUILTIN')
    }
    await query('UPDATE sys_user SET status = $2, updated_at = now() WHERE id = $1', [id, status])
    ok(res)
  } catch (e) {
    next(e)
  }
})
