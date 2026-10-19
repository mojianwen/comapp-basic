/** 系统管理模块 API（用户 / 角色 / 菜单），走真实后端 /api 前缀 */
import { request } from './request'

/* ===== 类型 ===== */
export interface UserRoleRef {
  id: number
  name: string
}

export interface UserRow {
  id: number
  username: string
  name: string
  email: string | null
  phone: string | null
  status: number
  is_builtin: number
  created_at: string
  roles: UserRoleRef[]
}

export interface UserPayload {
  username?: string
  name?: string
  password?: string
  email?: string | null
  phone?: string | null
  status?: number
  roleIds?: number[]
}

export interface RoleRow {
  id: number
  code: string
  name: string
  description: string | null
  status: number
  is_builtin: number
  user_count: number
}

export interface RolePayload {
  code?: string
  name?: string
  description?: string | null
  status?: number
}

export type MenuType = 1 | 2 | 3 // 1 目录 2 菜单 3 按钮

export interface MenuRow {
  id: number
  parent_id: number | null
  type: MenuType
  title: string
  path: string | null
  icon: string | null
  permission: string | null
  sort_order: number
  status: number
}

export interface MenuPayload {
  parent_id?: number | null
  type: MenuType
  title: string
  path?: string | null
  icon?: string | null
  permission?: string | null
  sort_order?: number
  status?: number
}

export interface Paged<T> {
  list: T[]
  total: number
}

/* ===== 用户 ===== */
export function listUsers(params: { page?: number; pageSize?: number; keyword?: string; status?: number | '' }) {
  const query = new URLSearchParams()
  if (params.page) query.set('page', String(params.page))
  if (params.pageSize) query.set('pageSize', String(params.pageSize))
  if (params.keyword) query.set('keyword', params.keyword)
  if (params.status !== '' && params.status !== undefined) query.set('status', String(params.status))
  return request<Paged<UserRow>>(`/users?${query.toString()}`)
}

export function createUser(payload: UserPayload) {
  return request<{ id: number }>('/users', { method: 'POST', data: payload })
}

export function updateUser(id: number, payload: UserPayload) {
  return request(`/users/${id}`, { method: 'PUT', data: payload })
}

export function deleteUser(id: number) {
  return request(`/users/${id}`, { method: 'DELETE' })
}

export function updateUserStatus(id: number, status: number) {
  return request(`/users/${id}/status`, { method: 'PUT', data: { status } })
}

/* ===== 角色 ===== */
export function listRoles() {
  return request<RoleRow[]>('/roles')
}

export function createRole(payload: RolePayload) {
  return request<{ id: number }>('/roles', { method: 'POST', data: payload })
}

export function updateRole(id: number, payload: RolePayload) {
  return request(`/roles/${id}`, { method: 'PUT', data: payload })
}

export function deleteRole(id: number) {
  return request(`/roles/${id}`, { method: 'DELETE' })
}

export function getRoleMenus(id: number) {
  return request<number[]>(`/roles/${id}/menus`)
}

export function assignRoleMenus(id: number, menuIds: number[]) {
  return request(`/roles/${id}/menus`, { method: 'PUT', data: { menuIds } })
}

/* ===== 菜单 ===== */
export function listMenus() {
  return request<MenuRow[]>('/menus')
}

export function createMenu(payload: MenuPayload) {
  return request<{ id: number }>('/menus', { method: 'POST', data: payload })
}

export function updateMenu(id: number, payload: MenuPayload) {
  return request(`/menus/${id}`, { method: 'PUT', data: payload })
}

export function deleteMenu(id: number) {
  return request(`/menus/${id}`, { method: 'DELETE' })
}
