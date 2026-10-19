import bcrypt from 'bcryptjs'
import { query, withTx } from './pool.js'

/**
 * 种子数据（幂等）：
 * - 菜单树：仅当菜单表为空时写入
 * - 角色 / 用户 / 绑定：ON CONFLICT DO NOTHING
 * 登录账号：demo / 123456（内置管理员，拥有除 audit:view 外的全部权限）
 */

interface MenuSeed {
  key: string
  parent?: string
  type: 1 | 2 | 3
  title: string
  path?: string
  icon?: string
  permission?: string
  sort: number
}

const MENUS: MenuSeed[] = [
  { key: 'portal', type: 2, title: '门户主页', path: '/', icon: 'Home', permission: 'portal:view', sort: 1 },
  { key: 'biz', type: 1, title: '业务中心', sort: 2 },
  { key: 'monitor', parent: 'biz', type: 2, title: '数据监测', path: '/monitor', icon: 'MonitorCog', permission: 'monitor:view', sort: 1 },
  { key: 'components', parent: 'biz', type: 2, title: '组件示例', path: '/components', icon: 'Shapes', sort: 2 },
  { key: 'system', type: 1, title: '系统管理', sort: 3 },
  { key: 'user', parent: 'system', type: 2, title: '用户管理', path: '/system/users', icon: 'Users', permission: 'system:user', sort: 1 },
  { key: 'user:create', parent: 'user', type: 3, title: '用户新增', permission: 'user:create', sort: 1 },
  { key: 'user:edit', parent: 'user', type: 3, title: '用户编辑', permission: 'user:edit', sort: 2 },
  { key: 'user:delete', parent: 'user', type: 3, title: '用户删除', permission: 'user:delete', sort: 3 },
  { key: 'user:assign', parent: 'user', type: 3, title: '分配角色', permission: 'user:assign', sort: 4 },
  { key: 'role', parent: 'system', type: 2, title: '角色管理', path: '/system/roles', icon: 'ShieldCheck', permission: 'system:role', sort: 2 },
  { key: 'role:create', parent: 'role', type: 3, title: '角色新增', permission: 'role:create', sort: 1 },
  { key: 'role:edit', parent: 'role', type: 3, title: '角色编辑', permission: 'role:edit', sort: 2 },
  { key: 'role:delete', parent: 'role', type: 3, title: '角色删除', permission: 'role:delete', sort: 3 },
  { key: 'role:assign', parent: 'role', type: 3, title: '分配菜单', permission: 'role:assign', sort: 4 },
  { key: 'menu', parent: 'system', type: 2, title: '菜单管理', path: '/system/menus', icon: 'ListTree', permission: 'system:menu', sort: 3 },
  { key: 'menu:create', parent: 'menu', type: 3, title: '菜单新增', permission: 'menu:create', sort: 1 },
  { key: 'menu:edit', parent: 'menu', type: 3, title: '菜单编辑', permission: 'menu:edit', sort: 2 },
  { key: 'menu:delete', parent: 'menu', type: 3, title: '菜单删除', permission: 'menu:delete', sort: 3 },
  { key: 'audit', type: 2, title: '审计日志', path: '/audit', icon: 'FileClock', permission: 'audit:view', sort: 4 },
]

export async function seed() {
  // ===== 菜单树：表空时才写入（幂等） =====
  const [{ count: menuCount }] = await query<{ count: string }>('SELECT count(*)::text AS count FROM sys_menu')
  if (menuCount === '0') {
    await withTx(async (tx) => {
      const ids = new Map<string, number>()
      for (const m of MENUS) {
        const parentId = m.parent ? ids.get(m.parent) : null
        if (m.parent && !parentId) throw new Error(`菜单父节点缺失：${m.parent}`)
        const { rows } = await tx.query<{ id: number }>(
          `INSERT INTO sys_menu (parent_id, type, title, path, icon, permission, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
          [parentId, m.type, m.title, m.path ?? null, m.icon ?? null, m.permission ?? null, m.sort],
        )
        ids.set(m.key, rows[0].id)
      }
    })
    console.log('[seed] 菜单树已写入：', MENUS.length, '条')
  } else {
    console.log('[seed] 菜单已存在，跳过')
  }

  // ===== 角色（内置管理员 + 演示只读角色） =====
  await query(
    `INSERT INTO sys_role (code, name, description, status, is_builtin)
     VALUES ('admin', '系统管理员', '内置管理员角色，拥有全部权限', 1, 1)
     ON CONFLICT (code) DO NOTHING`,
  )
  await query(
    `INSERT INTO sys_role (code, name, description, status, is_builtin)
     VALUES ('inspector', '安全员', '演示角色：仅门户与数据监测', 1, 0)
     ON CONFLICT (code) DO NOTHING`,
  )

  // ===== 内置用户 demo / 123456 =====
  const hash = bcrypt.hashSync('123456', 10)
  await query(
    `INSERT INTO sys_user (username, password_hash, name, email, status, is_builtin)
     VALUES ('demo', $1, '老莫', 'mo@mine.com', 1, 1)
     ON CONFLICT (username) DO NOTHING`,
    [hash],
  )

  // ===== 绑定：demo → admin；admin 角色 → 全部菜单；inspector → 门户/数据监测 =====
  await withTx(async (tx) => {
    await tx.query(
      `INSERT INTO sys_user_role (user_id, role_id)
       SELECT u.id, r.id FROM sys_user u, sys_role r
       WHERE u.username = 'demo' AND r.code = 'admin'
       ON CONFLICT DO NOTHING`,
    )
    await tx.query(
      `INSERT INTO sys_user_role (user_id, role_id)
       SELECT u.id, r.id FROM sys_user u, sys_role r
       WHERE u.username = 'demo' AND r.code = 'inspector'
       ON CONFLICT DO NOTHING`,
    )
    await tx.query(
      `INSERT INTO sys_role_menu (role_id, menu_id)
       SELECT r.id, m.id FROM sys_role r, sys_menu m
       WHERE r.code = 'admin' AND m.permission IS DISTINCT FROM 'audit:view'
       ON CONFLICT DO NOTHING`,
    )
    // admin 角色故意不绑 audit:view（保留前端 403 / 菜单过滤演示），此处幂等纠偏
    await tx.query(
      `DELETE FROM sys_role_menu
       WHERE role_id = (SELECT id FROM sys_role WHERE code = 'admin')
         AND menu_id = (SELECT id FROM sys_menu WHERE permission = 'audit:view')`,
    )
    // 演示角色只绑定「门户主页 / 数据监测」及其父目录；故意不绑 audit:view
    await tx.query(
      `INSERT INTO sys_role_menu (role_id, menu_id)
       SELECT r.id, m.id FROM sys_role r, sys_menu m
       WHERE r.code = 'inspector' AND m.permission IN ('portal:view', 'monitor:view')
         OR r.code = 'inspector' AND m.type = 1
       ON CONFLICT DO NOTHING`,
    )
  })
  console.log('[seed] 角色 / 用户 / 绑定已就绪')
}
