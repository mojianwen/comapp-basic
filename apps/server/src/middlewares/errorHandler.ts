import type { NextFunction, Request, Response } from 'express'

/** 业务错误：code 为字符串错误码或数字状态码，message 为用户可读文案 */
export class ApiError extends Error {
  code: number | string
  status: number

  constructor(message: string, code: number | string = 'ERROR', status = 200) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

/** 统一响应结构 { code, data, message }；非 2xx 直接走 HTTP 状态码 */
export function ok(res: Response, data: unknown = null) {
  res.json({ code: 0, data, message: 'ok' })
}

/** 统一错误兜底：ApiError → 业务码；其他 → 500 */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ code: err.code, data: null, message: err.message })
  }
  console.error('[server] 未捕获异常：', err)
  res.status(500).json({ code: 500, data: null, message: '服务器内部错误' })
}
