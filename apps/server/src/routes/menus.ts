import { Router } from 'express'
import { pool, query } from '../db/pool.js'
import { auth } from '../middlewares/auth.js'
import { ApiError, ok } from '../middlewares/errorHandler.js'
import { requirePermission } from '../middlewares/rbac.js'

export const menusRouter = Router()
menusRouter.use(auth)

interface MenuRow {
  id: number
  parent_id: number | null
  type: number
  title: string
  path: string | null
  icon: string | null
  permission: string | null
  sort_order: number
  status: number
}

/** 全量菜单（平铺，前端组树） */
menusRouter.get('/', async (_req, res, next) => {
  try {
    const rows = await query<MenuRow>(
      'SELECT id, parent_id, type, title, path, icon, permission, sort_order, status FROM sys_menu ORDER BY sort_order, id',
    )
    ok(res, rows)
  } catch (e) {
    next(e)
  }
})

function validateMenu(body: Record<string, unknown>) {
  const type = Number(body.type)
  if (![1, 2, 3].includes(type)) {
    throw new ApiError('type 仅支持 1 目录 / 2 菜单 / 3 按钮', 'BAD_REQUEST', 400)
  }
  if (!String(body.title ?? '').trim()) {
    throw new ApiError('标题为必填项', 'BAD_REQUEST', 400)
  }
  if (type === 2 && !String(body.path ?? '').trim()) {
    throw new ApiError('菜单型必须填写路由路径', 'BAD_REQUEST', 400)
  }
  return { type }
}

/** 新增菜单 */
menusRouter.post('/', requirePermission('menu:create'), async (req, res, next) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>
    const { type } = validateMenu(body)
    const permission = body.permission ? String(body.permission).trim() : null
    if (permission) {
      const dup = await query('SELECT 1 FROM sys_menu WHERE permission = $1', [permission])
      if (dup.length) throw new ApiError(`权限码「${permission}」已存在`, 'PERMISSION_EXISTS')
    }
    const rows = await query<{ id: number }>(
      `INSERT INTO sys_menu (parent_id, type, title, path, icon, permission, sort_order, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [
        body.parent_id ? Number(body.parent_id) : null,
        type,
        String(body.title).trim(),
        body.path ? String(body.path).trim() : null,
        body.icon ? String(body.icon) : null,
        permission,
        body.sort_order !== undefined ? Number(body.sort_order) : 0,
        body.status !== undefined ? Number(body.status) : 1,
      ],
    )
    ok(res, { id: rows[0].id })
  } catch (e) {
    next(e)
  }
})

/** 编辑菜单 */
menusRouter.put('/:id', requirePermission('menu:edit'), async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const body = (req.body ?? {}) as Record<string, unknown>
    const { type } = validateMenu(body)
    if (body.parent_id && Number(body.parent_id) === id) {
      throw new ApiError('父级不能是自己', 'BAD_REQUEST', 400)
    }
    const permission = body.permission ? String(body.permission).trim() : null
    if (permission) {
      const dup = await query('SELECT 1 FROM sys_menu WHERE permission = $1 AND id <> $2', [permission, id])
      if (dup.length) throw new ApiError(`权限码「${permission}」已存在`, 'PERMISSION_EXISTS')
    }
    const { rowCount } = await pool.query(
      `UPDATE sys_menu SET parent_id = $2, type = $3, title = $4, path = $5, icon = $6,
              permission = $7, sort_order = $8, status = $9, updated_at = now()
       WHERE id = $1`,
      [
        id,
        body.parent_id ? Number(body.parent_id) : null,
        type,
        String(body.title).trim(),
        body.path ? String(body.path).trim() : null,
        body.icon ? String(body.icon) : null,
        permission,
        body.sort_order !== undefined ? Number(body.sort_order) : 0,
        body.status !== undefined ? Number(body.status) : 1,
      ],
    )
    if (!rowCount) throw new ApiError('菜单不存在', 'NOT_FOUND', 404)
    ok(res)
  } catch (e) {
    next(e)
  }
})

/** 删除菜单：有子节点或已被角色绑定则拒绝 */
menusRouter.delete('/:id', requirePermission('menu:delete'), async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    const children = await query('SELECT 1 FROM sys_menu WHERE parent_id = $1 LIMIT 1', [id])
    if (children.length) {
      throw new ApiError('存在子菜单，请先删除子节点', 'RULE_HAS_CHILD')
    }
    const bound = await query('SELECT 1 FROM sys_role_menu WHERE menu_id = $1 LIMIT 1', [id])
    if (bound.length) {
      throw new ApiError('该菜单已绑定角色，请先解除绑定', 'RULE_BIND')
    }
    const { rowCount } = await pool.query('DELETE FROM sys_menu WHERE id = $1', [id])
    if (!rowCount) throw new ApiError('菜单不存在', 'NOT_FOUND', 404)
    ok(res)
  } catch (e) {
    next(e)
  }
})
