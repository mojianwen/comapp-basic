import cors from 'cors'
import express from 'express'
import { config } from './config.js'
import { authRouter } from './routes/auth.js'
import { menusRouter } from './routes/menus.js'
import { rolesRouter } from './routes/roles.js'
import { usersRouter } from './routes/users.js'
import { errorHandler } from './middlewares/errorHandler.js'

const app = express()
app.use(cors())
app.use(express.json())

// 所有业务路由挂载在 /api 前缀（与前端 vite proxy / 响应契约对齐）
const api = express.Router()
api.use('/auth', authRouter)
api.use('/users', usersRouter)
api.use('/roles', rolesRouter)
api.use('/menus', menusRouter)
app.use('/api', api)

app.get('/health', (_req, res) => res.json({ status: 'ok' }))

app.use(errorHandler)

app.listen(config.port, () => {
  console.log(`[server] MoAdmin API listening on http://localhost:${config.port}`)
})
