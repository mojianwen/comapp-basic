import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import { ApiError } from './errorHandler.js'

export interface AuthUser {
  uid: number
  username: string
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthUser
    }
  }
}

/** JWT 鉴权：校验 Authorization: Bearer <token>，通过后挂载 req.auth */
export function auth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  if (!token) {
    return next(new ApiError('未登录或凭证缺失', 401, 401))
  }
  try {
    req.auth = jwt.verify(token, config.jwtSecret) as AuthUser
    next()
  } catch {
    next(new ApiError('登录已过期，请重新登录', 401, 401))
  }
}
