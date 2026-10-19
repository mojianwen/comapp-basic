/**
 * 本地 Mock 接口
 * - url 以 /mock/ 开头时由 request() 路由到此处，模拟网络延迟与业务返回
 * - 接真实后端后：删除本文件及 request.ts 中的 mock 分支即可，业务代码零改动
 */
import { ApiError } from './ApiError'

const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms))

type MockHandler = (data: unknown) => unknown

const handlers: Record<string, MockHandler> = {
  // 登录
  '/mock/login': (data) => {
    const { username, password } = (data ?? {}) as { username?: string; password?: string }
    if (username === 'demo' && password === '123456') {
      return {
        token: `mock-token-${Date.now()}`,
        user: {
          name: '老莫',
          role: '系统管理员',
          permissions: ['portal:view', 'monitor:view', 'system:manage'],
          // 注意：故意不授予 'audit:view' 与 'danger:action'，用于权限方案演示
        },
      }
    }
    throw new ApiError('账号或密码错误（演示账号：demo / 123456）', 'AUTH_FAILED')
  },

  // 监测汇总（请求层演示：成功）
  '/mock/monitor-summary': () => ({
    online: 12,
    warning: 2,
    alarm: 2,
    updatedAt: new Date().toLocaleString('zh-CN'),
  }),

  // 业务错误演示：HTTP 200，但 code !== 0
  '/mock/biz-error': () => {
    throw new ApiError('模拟业务错误：数据校验未通过（code=BIZ_RULE）', 'BIZ_RULE')
  },

  // HTTP 500 演示
  '/mock/crash': () => {
    throw new ApiError('模拟服务器异常（HTTP 500）', 500, 500)
  },
}

export async function mockRequest<T>(url: string, data: unknown): Promise<T> {
  await delay()
  const handler = handlers[url]
  if (!handler) {
    throw new ApiError(`Mock 接口未实现：${url}`, 404, 404)
  }
  return handler(data) as T
}
