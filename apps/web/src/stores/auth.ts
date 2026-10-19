import { computed, reactive, watchEffect } from 'vue'
import { loginApi, type UserInfo } from '../services/auth'

const STORAGE_KEY = 'mo-auth'

interface AuthState {
  token: string
  user: UserInfo | null
}

function load(): AuthState {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') ?? { token: '', user: null }
  } catch {
    return { token: '', user: null }
  }
}

const state = reactive<AuthState>(load())

/** 登录态持久化（记住我=false 时只存 sessionStorage 由登录页决定，这里统一 localStorage，简化演示） */
watchEffect(() => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: state.token, user: state.user }))
})

export function useAuth() {
  return state
}

export const isLoggedIn = computed(() => Boolean(state.token))

export async function login(account: string, password: string) {
  const res = await loginApi(account, password)
  state.token = res.token
  state.user = res.user
  return res
}

export function logout() {
  state.token = ''
  state.user = null
}

/** 是否持有某权限码（未登录一律 false） */
export function hasPermission(code: string): boolean {
  return state.user?.permissions?.includes(code) ?? false
}

/** 是否持有任意一个权限码 */
export function hasAnyPermission(codes: string[]): boolean {
  return codes.some((c) => hasPermission(c))
}
