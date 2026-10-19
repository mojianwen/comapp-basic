/**
 * 请求层（fetch 封装）
 *
 * 特性：
 * - 统一前缀：VITE_API_BASE（默认 /api），通过 .env 配置
 * - 请求拦截：自动注入 Authorization: Bearer <token>（从本地认证存储读取）
 * - 响应拦截：统一解析 { code, data, message } 结构，code !== 0 视为业务错误抛 ApiError
 * - 超时控制：默认 15s，AbortController 实现
 * - 401 处理：清除本地认证并跳转登录页（带 redirect）
 * - Mock：url 以 /mock/ 开头时路由到本地 mock.ts，接真实后端后移除该分支即可
 *
 * 业务用法：
 *   const data = await request<MonitorSummary>('/monitor/summary')
 *   try { ... } catch (e) { if (e instanceof ApiError) toast({ title: e.message }) }
 */
import { ApiError } from './ApiError'
import { mockRequest } from './mock'

const BASE_URL = (import.meta.env.VITE_API_BASE as string | undefined) ?? '/api'
const AUTH_KEY = 'mo-auth'

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  /** 请求体（自动 JSON 序列化） */
  data?: unknown
  headers?: Record<string, string>
  /** 超时毫秒数，默认 15000 */
  timeout?: number
  /** 外部取消信号 */
  signal?: AbortSignal
}

function getToken(): string | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    return raw ? ((JSON.parse(raw) as { token?: string }).token ?? null) : null
  } catch {
    return null
  }
}

function handleUnauthorized() {
  localStorage.removeItem(AUTH_KEY)
  const redirect = encodeURIComponent(location.hash.slice(1) || '/')
  location.hash = `#/login?redirect=${redirect}`
}

export async function request<T = unknown>(url: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', data, headers = {}, timeout = 15000, signal } = options

  // ===== Mock 分支（接真实后端后删除）=====
  if (url.startsWith('/mock/')) {
    return mockRequest<T>(url, data)
  }

  // ===== 真实请求 =====
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  signal?.addEventListener('abort', () => controller.abort(), { once: true })

  let res: Response
  try {
    const token = getToken()
    res = await fetch(BASE_URL + url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: data === undefined ? undefined : JSON.stringify(data),
      signal: controller.signal,
    })
  } catch {
    throw new ApiError('网络异常或请求超时，请检查网络后重试', 'NETWORK_ERROR')
  } finally {
    clearTimeout(timer)
  }

  // 401：登录过期
  if (res.status === 401) {
    handleUnauthorized()
    throw new ApiError('登录已过期，请重新登录', 401, 401)
  }

  // 其他 HTTP 错误
  if (!res.ok) {
    throw new ApiError(`请求失败（HTTP ${res.status}）`, res.status, res.status)
  }

  // 统一解析 { code, data, message }
  const json: unknown = await res.json().catch(() => {
    throw new ApiError('响应数据解析失败', 'PARSE_ERROR')
  })

  if (json && typeof json === 'object' && 'code' in json) {
    const body = json as { code: number | string; data?: T; message?: string }
    if (body.code !== 0) {
      throw new ApiError(body.message || '业务处理失败', body.code, res.status)
    }
    return body.data as T
  }

  // 非包裹结构直接返回
  return json as T
}
