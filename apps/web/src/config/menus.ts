import type { Component } from 'vue'
import { FileClock, Home, ListTree, MonitorCog, Shapes, ShieldCheck, Users } from 'lucide-vue-next'

export interface AppMenuItem {
  title: string
  path: string
  icon: Component
  /** 权限码：不传 = 所有登录用户可见；传了则按用户 permissions 过滤 */
  permission?: string
}

export interface AppMenuGroup {
  label?: string
  items: AppMenuItem[]
}

/** 侧边栏分组菜单配置（来自路由规划，新增页面在此登记即可） */
export const menuGroups: AppMenuGroup[] = [
  {
    items: [{ title: '门户主页', path: '/', icon: Home }],
  },
  {
    label: '业务中心',
    items: [
      { title: '数据监测', path: '/monitor', icon: MonitorCog, permission: 'monitor:view' },
      { title: '组件示例', path: '/components', icon: Shapes },
    ],
  },
  {
    label: '系统管理',
    items: [
      { title: '用户管理', path: '/system/users', icon: Users, permission: 'system:user' },
      { title: '角色管理', path: '/system/roles', icon: ShieldCheck, permission: 'system:role' },
      { title: '菜单管理', path: '/system/menus', icon: ListTree, permission: 'system:menu' },
      // 演示：当前管理员未授予 'audit:view'，该菜单会被自动过滤隐藏
      { title: '审计日志', path: '/audit', icon: FileClock, permission: 'audit:view' },
    ],
  },
]
