/**
 * 建表脚本（幂等：可重复执行）
 * 6 张表：sys_user / sys_role / sys_menu / sys_user_role / sys_role_menu
 */

export async function migrate(run: (sql: string, params?: unknown[]) => Promise<unknown>) {
  await run(`
    CREATE TABLE IF NOT EXISTS sys_user (
      id            BIGSERIAL PRIMARY KEY,
      username      VARCHAR(50)  NOT NULL UNIQUE,
      password_hash VARCHAR(100) NOT NULL,
      name          VARCHAR(50)  NOT NULL,
      email         VARCHAR(100),
      phone         VARCHAR(20),
      status        SMALLINT     NOT NULL DEFAULT 1,
      is_builtin    SMALLINT     NOT NULL DEFAULT 0,
      created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
      updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
    )
  `)

  await run(`
    CREATE TABLE IF NOT EXISTS sys_role (
      id          BIGSERIAL PRIMARY KEY,
      code        VARCHAR(50)  NOT NULL UNIQUE,
      name        VARCHAR(50)  NOT NULL,
      description VARCHAR(200),
      status      SMALLINT     NOT NULL DEFAULT 1,
      is_builtin  SMALLINT     NOT NULL DEFAULT 0,
      created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
      updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
    )
  `)

  await run(`
    CREATE TABLE IF NOT EXISTS sys_menu (
      id         BIGSERIAL PRIMARY KEY,
      parent_id  BIGINT REFERENCES sys_menu(id) ON DELETE CASCADE,
      type       SMALLINT     NOT NULL,
      title      VARCHAR(50)  NOT NULL,
      path       VARCHAR(200),
      icon       VARCHAR(50),
      permission VARCHAR(100) UNIQUE,
      sort_order INT          NOT NULL DEFAULT 0,
      status     SMALLINT     NOT NULL DEFAULT 1,
      created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
      CONSTRAINT menu_type_check CHECK (type IN (1, 2, 3))
    )
  `)

  await run(`
    CREATE TABLE IF NOT EXISTS sys_user_role (
      user_id BIGINT NOT NULL REFERENCES sys_user(id) ON DELETE CASCADE,
      role_id BIGINT NOT NULL REFERENCES sys_role(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, role_id)
    )
  `)

  await run(`
    CREATE TABLE IF NOT EXISTS sys_role_menu (
      role_id BIGINT NOT NULL REFERENCES sys_role(id) ON DELETE CASCADE,
      menu_id BIGINT NOT NULL REFERENCES sys_menu(id) ON DELETE CASCADE,
      PRIMARY KEY (role_id, menu_id)
    )
  `)

  await run(`CREATE INDEX IF NOT EXISTS idx_user_role_role ON sys_user_role(role_id)`)
  await run(`CREATE INDEX IF NOT EXISTS idx_role_menu_menu ON sys_role_menu(menu_id)`)
  await run(`CREATE INDEX IF NOT EXISTS idx_menu_parent ON sys_menu(parent_id)`)
  await run(`CREATE INDEX IF NOT EXISTS idx_user_status ON sys_user(status)`)
}
