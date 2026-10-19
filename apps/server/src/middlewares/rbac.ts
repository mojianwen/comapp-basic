import type { NextFunction, Request, Response } from 'express'
import { ApiError } from './errorHandler.js'
import { loadPermissions } from '../services/permissionService.js'

/**
 * 权限码校验中间件工厂：requirePermission('user:delete')
 * 每次请求实时查库（角色绑定变更即时生效）
 */
export function requirePermission(code: string) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.auth) {
        throw new ApiError('未登录', 401, 401)
      }
      const permissions = await loadPermissions(req.auth.uid)
      if (!permissions.includes(code)) {
        throw new ApiError(`没有操作权限（需要 ${code}）`, 'FORBIDDEN', 403)
      }
      next()
    } catch (e) {
      next(e)
    }
  }
}
