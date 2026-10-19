import bcrypt from 'bcryptjs'
import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config.js'
import { query } from '../db/pool.js'
import { ApiError, ok } from '../middlewares/errorHandler.js'
import { auth } from '../middlewares/auth.js'
import { loadPermissions } from '../services/permissionService.js'

export const authRouter = Router()

/** 登录：校验密码 → 签发 JWT → 返回用户信息与权限码集合 */
authRouter.post('/login', async (req, res, next) => {
  try {
    const { username, password } = (req.body ?? {}) as { username?: string; password?: string }
    if (!username?.trim() || !password) {
      throw new ApiError('请输入账号和密码', 'BAD_REQUEST', 400)
    }
    const users = await query<{
      id: number
      username: string
      password_hash: string
      name: string
      status: number
    }>('SELECT id, username, password_hash, name, status FROM sys_user WHERE username = $1', [
      username.trim(),
    ])
    const user = users[0]
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      throw new ApiError('账号或密码错误', 'AUTH_FAILED')
    }
    if (user.status !== 1) {
      throw new ApiError('账号已被停用，请联系管理员', 'USER_DISABLED')
    }
    const permissions = await loadPermissions(user.id)
    const primaryRole = await query<{ name: string }>(
      `SELECT r.name FROM sys_user_role ur JOIN sys_role r ON r.id = ur.role_id
       WHERE ur.user_id = $1 ORDER BY r.is_builtin DESC, r.id LIMIT 1`,
      [user.id],
    )
    const token = jwt.sign({ uid: user.id, username: user.username }, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn,
    })
    ok(res, {
      token,
      user: {
        id: user.id,
        name: user.name,
        role: primaryRole[0]?.name ?? '用户',
        permissions,
      },
    })
  } catch (e) {
    next(e)
  }
})

/** 当前登录用户信息（含实时权限码，用于权限变更后的刷新） */
authRouter.get('/me', auth, async (req, res, next) => {
  try {
    const uid = req.auth!.uid
    const users = await query<{ id: number; username: string; name: string; status: number }>(
      'SELECT id, username, name, status FROM sys_user WHERE id = $1',
      [uid],
    )
    const user = users[0]
    if (!user || user.status !== 1) {
      throw new ApiError('账号不存在或已停用', 'USER_DISABLED', 401)
    }
    const permissions = await loadPermissions(uid)
    const primaryRole = await query<{ name: string }>(
      `SELECT r.name FROM sys_user_role ur JOIN sys_role r ON r.id = ur.role_id
       WHERE ur.user_id = $1 ORDER BY r.is_builtin DESC, r.id LIMIT 1`,
      [uid],
    )
    ok(res, {
      id: user.id,
      name: user.name,
      role: primaryRole[0]?.name ?? '用户',
      permissions,
    })
  } catch (e) {
    next(e)
  }
})
