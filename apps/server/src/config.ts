/** 服务配置（本地开发默认值，生产用环境变量覆盖） */
export const config = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl:
    process.env.DATABASE_URL ?? 'postgresql://postgres:123456@localhost:5432/moadmin',
  jwtSecret: process.env.JWT_SECRET ?? 'mo-admin-dev-secret',
  /** token 有效期（秒）：12h */
  jwtExpiresIn: 60 * 60 * 12,
}
