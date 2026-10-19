/**
 * 统一 API 错误类型
 * - code：业务错误码（后端返回）或前端约定错误码（如 NETWORK_ERROR / PARSE_ERROR）
 * - status：HTTP 状态码（仅真实 HTTP 请求失败时存在）
 */
export class ApiError extends Error {
  code: number | string
  status?: number

  constructor(message: string, code: number | string = -1, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}
