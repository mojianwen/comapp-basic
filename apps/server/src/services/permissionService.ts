import { query } from '../db/pool.js'

/** 查询用户权限码集合：用户 → 角色 → 菜单.permission（角色与菜单均需启用），去重 */
export async function loadPermissions(userId: number): Promise<string[]> {
  const rows = await query<{ permission: string }>(
    `SELECT DISTINCT m.permission
     FROM sys_user_role ur
     JOIN sys_role r ON r.id = ur.role_id AND r.status = 1
     JOIN sys_role_menu rm ON rm.role_id = ur.role_id
     JOIN sys_menu m ON m.id = rm.menu_id AND m.status = 1
     WHERE ur.user_id = $1 AND m.permission IS NOT NULL`,
    [userId],
  )
  return rows.map((r) => r.permission)
}
