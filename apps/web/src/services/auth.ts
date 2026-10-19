/**
 * 认证服务（真实后端 /api/auth/login）
 * 返回结构与 mock 版一致，stores/auth 无需改动；/mock/ 分支仍保留给组件演示页
 */
import { request } from '../api/request'

export interface UserInfo {
  id?: number
  name: string
  role: string
  /** 权限码列表：菜单过滤 / 路由守卫 / 按钮级 v-permission 共用 */
  permissions?: string[]
}

export interface LoginResult {
  token: string
  user: UserInfo
}

export async function loginApi(account: string, password: string): Promise<LoginResult> {
  return request<LoginResult>('/auth/login', {
    method: 'POST',
    data: { username: account.trim(), password },
  })
}
