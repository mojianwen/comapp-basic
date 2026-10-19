import { Router } from 'express'
import { query, withTx } from '../db/pool.js'
import { auth } from '../middlewares/auth.js'
import { ApiError, ok } from '../middlewares/errorHandler.js'
import { requirePermission } from '../middlewares/rbac.js'

export const rolesRouter = Router()
rolesRouter.use(auth)

/** 全量角色列表（下拉/表格共用，附带绑定用户数） */
rolesRouter.get('/', async (_req, res, next) => {
  try {
    const rows = await query(
      `SELECT r.id, r.code, r.name, r.description, r.status, r.is_builtin,
              (SELECT count(*) FROM sys_user_role ur WHERE ur.role_id = r.id)::int AS user_count
       FROM sys_role r ORDER BY r.is_builtin DESC, r.id`,
    )
    ok(res, rows)
  } catch (e) {
    next(e)
  }
})

/** 角色已绑定的菜单 id 列表（分配菜单回显用） */
rolesRouter.get('/:id/menus', async (req, res, next) => {
  try {
    const rows = await query<{ menu_id: number }>(
      'SELECT menu_id FROM sys_role_menu WHERE role_id = $1',
      [Number(req.params.id)],
    )
    ok(res, rows.map((r) => r.menu_id))
  } catch (e) {
    next(e)
  }
})

/** 新增角色 */
rolesRouter.post('/', requirePermission('role:create'), async (req, res, next) => {
  try {
    const { code, name, description } = req.body ?? {}
    if (!code?.trim() || !name?.trim()) {
      throw new ApiError('角色编码与名称为必填项', 'BAD_REQUEST', 400)
    }
    const dup = await query('SELECT 1 FROM sys_role WHERE code = $1', [code.trim()])
    if (dup.length) {
      throw new ApiError(`角色编码「${code.trim()}」已存在`, 'CODE_EXISTS')
    }
    const rows = await query<{ id: number }>(
      'INSERT INTO sys_role (code, name, description) VALUES ($1, $2, $3) RETURNING id',
      [code.trim(), name.trim(), description ?? null],
    )
    ok(res, { id: rows[0].id })
  } catch (e) {
    next(e)
  }
})

/** 编辑角色：内置角色不允许修改编码 */
rolesRouter.put('/:id', requirePermission('role:edit'), async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const { name, description, status } = req.body ?? {}
    const found = await query<{ code: string; is_builtin: number }>(
      'SELECT code, is_builtin FROM sys_role WHERE id = $1',
      [id],
    )
    if (!found[0]) throw new ApiError('角色不存在', 'NOT_FOUND', 404)
    await query(
      `UPDATE sys_role SET name = COALESCE($2, name), description = COALESCE($3, description),
              status = COALESCE($4, status), updated_at = now()
       WHERE id = $1`,
      [id, name ?? null, description ?? null, status ?? null],
    )
    ok(res)
  } catch (e) {
    next(e)
  }
})

/** 删除角色：内置角色保护 + 有用户绑定保护 */
rolesRouter.delete('/:id', requirePermission('role:delete'), async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const found = await query<{ code: string; is_builtin: number }>(
      'SELECT code, is_builtin FROM sys_role WHERE id = $1',
      [id],
    )
    if (!found[0]) throw new ApiError('角色不存在', 'NOT_FOUND', 404)
    if (found[0].is_builtin) {
      throw new ApiError('内置角色不允许删除', 'RULE_BUILTIN')
    }
    const bound = await query('SELECT 1 FROM sys_user_role WHERE role_id = $1 LIMIT 1', [id])
    if (bound.length) {
      throw new ApiError('该角色已绑定用户，请先解除绑定', 'RULE_BIND')
    }
    await query('DELETE FROM sys_role WHERE id = $1', [id])
    ok(res)
  } catch (e) {
    next(e)
  }
})

/** 分配菜单：重写 role_menu 绑定 */
rolesRouter.put('/:id/menus', requirePermission('role:assign'), async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const { menuIds } = req.body ?? {}
    if (!Array.isArray(menuIds)) {
      throw new ApiError('menuIds 必须为数组', 'BAD_REQUEST', 400)
    }
    const found = await query('SELECT 1 FROM sys_role WHERE id = $1', [id])
    if (!found.length) throw new ApiError('角色不存在', 'NOT_FOUND', 404)
    await withTx(async (tx) => {
      await tx.query('DELETE FROM sys_role_menu WHERE role_id = $1', [id])
      for (const menuId of menuIds) {
        await tx.query(
          'INSERT INTO sys_role_menu (role_id, menu_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [id, menuId],
        )
      }
    })
    ok(res)
  } catch (e) {
    next(e)
  }
})
