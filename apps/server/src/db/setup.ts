import pg from 'pg'
import { config } from '../config.js'
import { migrate } from './migrate.js'
import { pool, query } from './pool.js'
import { seed } from './seed.js'

/** 一次性初始化：建库（如缺）→ 建表 → 种子数据。命令：npm run setup -w @mo/server */
async function createDatabaseIfMissing() {
  const admin = new pg.Client({
    connectionString: config.databaseUrl.replace(/\/[^/]+$/, '/postgres'),
  })
  await admin.connect()
  try {
    const { rows } = await admin.query("SELECT 1 FROM pg_database WHERE datname = 'moadmin'")
    if (rows.length === 0) {
      await admin.query("CREATE DATABASE moadmin ENCODING 'UTF8'")
      console.log('[setup] 数据库 moadmin 已创建')
    } else {
      console.log('[setup] 数据库 moadmin 已存在')
    }
  } finally {
    await admin.end()
  }
}

async function main() {
  await createDatabaseIfMissing()
  console.log('[setup] 建表...')
  await migrate((sql, params) => query(sql, params))
  console.log('[setup] 建表完成')
  await seed()
  await pool.end()
}

main().catch((e) => {
  console.error('[setup] 失败：', e)
  process.exit(1)
})
