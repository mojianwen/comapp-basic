/**
 * API 冒烟测试：登录 → 用户 CRUD → 角色分配菜单 → 菜单 CRUD → 删除保护
 * 用法：先启动 server，再 node scripts/smoke.mjs
 */
const BASE = process.env.BASE_URL ?? 'http://localhost:3000'
const USERNAME = process.env.SMOKE_USER ?? 'demo'
const PASSWORD = process.env.SMOKE_PASS ?? '123456'

let passed = 0
const failures = []
function check(name, ok, detail = '') {
  if (ok) {
    passed++
    console.log(`  ✓ ${name}`)
  } else {
    failures.push(name)
    console.error(`  ✗ ${name} ${detail}`)
  }
}

async function api(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(BASE + '/api' + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  return { status: res.status, json }
}

async function main() {
  // 登录
  const login = await api('/auth/login', { method: 'POST', body: { username: USERNAME, password: PASSWORD } })
  check('登录成功', login.json.code === 0 && login.json.data?.token, JSON.stringify(login.json).slice(0, 120))
  const token = login.json.data?.token
  const perms = login.json.data?.user?.permissions ?? []
  check('权限码非空且含 user:delete', perms.includes('user:delete') && perms.includes('system:user'), `共 ${perms.length} 项`)
  check('不含 audit:view（角色未绑定）', !perms.includes('audit:view'))

  // 错误密码
  const badLogin = await api('/auth/login', { method: 'POST', body: { username: USERNAME, password: 'wrong' } })
  check('错误密码被拒绝', badLogin.json.code !== 0)

  // 未登录 401
  const noAuth = await api('/users')
  check('未登录访问用户列表 → 401', noAuth.status === 401)

  // 用户列表
  const users = await api('/users?page=1&pageSize=10', { token })
  check('用户分页列表', users.json.data?.total >= 1 && Array.isArray(users.json.data?.list))

  // 用户 CRUD
  const suffix = Date.now()
  const created = await api('/users', {
    method: 'POST',
    token,
    body: { username: `tester${suffix}`, name: '冒烟测试', password: '12345678', roleIds: [2] },
  })
  check('新增用户', created.json.code === 0 && created.json.data?.id > 0)
  const uid = created.json.data?.id

  const dup = await api('/users', {
    method: 'POST',
    token,
    body: { username: `tester${suffix}`, name: '重复', password: '12345678' },
  })
  check('用户名重复被拒（USERNAME_EXISTS）', dup.json.code === 'USERNAME_EXISTS')

  const updated = await api(`/users/${uid}`, { method: 'PUT', token, body: { name: '冒烟测试改', status: 0, roleIds: [] } })
  check('编辑用户', updated.json.code === 0)
  const list2 = await api('/users?keyword=tester', { token })
  const row = list2.json.data?.list?.find((u) => u.id === uid)
  check('编辑生效（姓名/状态/角色清空）', row?.name === '冒烟测试改' && row?.status === 0 && row?.roles?.length === 0)

  // 内置账号保护
  const me = await api('/auth/me', { token })
  const myId = me.json.data?.id
  const delBuiltin = await api(`/users/${myId}`, { method: 'DELETE', token })
  check('内置账号禁止删除（RULE_BUILTIN）', delBuiltin.json.code === 'RULE_BUILTIN')

  // 角色：绑定校验 + 分配菜单
  const roles = await api('/roles', { token })
  const inspector = roles.json.data?.find((r) => r.code === 'inspector')
  const adminRole = roles.json.data?.find((r) => r.code === 'admin')
  check('角色列表含绑定用户数', inspector?.user_count >= 1)
  const delBoundRole = await api(`/roles/${inspector.id}`, { method: 'DELETE', token })
  check('有用户绑定的角色禁止删除（RULE_BIND）', delBoundRole.json.code === 'RULE_BIND')

  const menus = await api('/menus', { token })
  const allMenuIds = menus.json.data?.map((m) => m.id) ?? []
  const auditMenu = menus.json.data?.find((m) => m.permission === 'audit:view')
  const setMenus = await api(`/roles/${inspector.id}/menus`, {
    method: 'PUT',
    token,
    body: { menuIds: [auditMenu.id] },
  })
  check('角色分配菜单', setMenus.json.code === 0)
  const roleMenus = await api(`/roles/${inspector.id}/menus`, { token })
  check(
    '分配菜单回显正确',
    Array.isArray(roleMenus.json.data) && roleMenus.json.data.length === 1 && String(roleMenus.json.data[0]) === String(auditMenu.id),
    `实际返回：${JSON.stringify(roleMenus.json)}`,
  )
  // 恢复 seed 初始绑定（inspector 仅门户/数据监测及其父目录）
  const restoreIds = menus.json.data.filter((m) => ['portal:view', 'monitor:view'].includes(m.permission) || m.type === 1).map((m) => m.id)
  await api(`/roles/${inspector.id}/menus`, { method: 'PUT', token, body: { menuIds: restoreIds } })
  check('恢复角色原菜单绑定', true)

  // 菜单 CRUD + 删除保护
  const newMenu = await api('/menus', {
    method: 'POST',
    token,
    body: { parent_id: null, type: 2, title: '冒烟菜单', path: '/smoke', permission: `smoke:${suffix}`, sort_order: 99 },
  })
  check('新增菜单', newMenu.json.code === 0)
  const smokeId = newMenu.json.data?.id
  const editMenu = await api(`/menus/${smokeId}`, { method: 'PUT', token, body: { parent_id: null, type: 2, title: '冒烟菜单改', path: '/smoke', permission: `smoke:${suffix}`, sort_order: 99, status: 1 } })
  check('编辑菜单', editMenu.json.code === 0)
  // 绑定到角色后删除应被拒（admin 角色绑定 smokeId，恢复时保持 seed 状态：不含 audit:view）
  await api(`/roles/${adminRole.id}/menus`, { method: 'PUT', token, body: { menuIds: [...allMenuIds, smokeId] } })
  const delBoundMenu = await api(`/menus/${smokeId}`, { method: 'DELETE', token })
  check('已绑定角色的菜单禁止删除（RULE_BIND）', delBoundMenu.json.code === 'RULE_BIND')
  // 解绑后可删
  const adminRestore = allMenuIds.filter((id) => String(id) !== String(auditMenu.id))
  await api(`/roles/${adminRole.id}/menus`, { method: 'PUT', token, body: { menuIds: adminRestore } })
  const delMenu = await api(`/menus/${smokeId}`, { method: 'DELETE', token })
  check('解除绑定后删除菜单', delMenu.json.code === 0)

  // 删除冒烟用户
  const delUser = await api(`/users/${uid}`, { method: 'DELETE', token })
  check('删除测试用户', delUser.json.code === 0)

  // 汇总
  console.log(`\n冒烟结果：${passed} 通过，${failures.length} 失败`)
  if (failures.length) {
    console.error('失败项：', failures)
    process.exit(1)
  }
}

main().catch((e) => {
  console.error('冒烟执行异常：', e)
  process.exit(1)
})
