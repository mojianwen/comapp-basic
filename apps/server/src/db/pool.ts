import pg from 'pg'
import { config } from '../config.js'

export const pool = new pg.Pool({ connectionString: config.databaseUrl, max: 10 })

/** 执行一条查询，返回行数组 */
export function query<T = Record<string, unknown>>(sql: string, params: unknown[] = []) {
  return pool.query<T>(sql, params).then((r) => r.rows)
}

/** 事务辅助：回调内使用传入的 client，异常自动回滚 */
export async function withTx<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (e) {
    await client.query('ROLLBACK')
    throw e
  } finally {
    client.release()
  }
}
