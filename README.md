# MoAdmin Web UI 框架

基于 **Vue 3.5 + Vite 6 + TypeScript + Tailwind CSS v4 + Reka UI** 的企业级后台前端框架，采用 shadcn-vue 组织范式与 npm workspaces 单仓结构。设计目标：令牌与组件跨项目复用，业务项目只写页面。

## 目录结构

```
comapp-basic/
├── packages/
│   ├── tokens/        # 设计令牌：颜色/圆角/阴影/动效（明暗双主题 CSS 变量）
│   ├── components/    # 组件库 @mo/components（26 组 UI 组件 + cn 工具）
│   └── layouts/       # 布局 @mo/layouts（BasicLayout 响应式侧栏 / PageSection）
├── apps/
│   ├── web/           # 示例应用：登录/门户/组件示例/系统管理 + 权限/请求层实现参考
│   └── server/        # 后端 API @mo/server（Express 5 + PostgreSQL，JWT + RBAC，端口 3000）
├── scripts/
│   ├── e2e.mjs        # E2E 回归脚本（playwright-core + 本机 Chrome）
│   ├── smoke.mjs      # API 冒烟测试（21 断言，需先建库并启动 server）
│   ├── start.bat      # 一键启动（先清残留 watcher，API 3000 新窗口 + Vite 5219 前台）
│   ├── stop.bat       # 一键停止（按进程签名，连 npm/tsx/vite watcher 父进程一起收）
│   └── devctl.ps1     # 起停公用逻辑：识别本仓库 dev 进程（-StaleOnly 只清残留 / 默认全停）
├── eslint.config.js   # ESLint 10 flat config（vue essential + ts）
├── vitest.config.ts   # Vitest 配置（jsdom）
└── package.json       # workspaces + 统一命令
```

## 常用命令

| 命令                        | 说明                                                              |
| --------------------------- | ----------------------------------------------------------------- |
| `npm run dev`               | 启动开发服务器（http://localhost:5219）                           |
| `npm run start`（或双击 `scripts/start.bat`） | 启动 API(3000，新窗口) + 前端(5219)，端口占用自动跳过，重复执行安全 |
| `npm run stop`（或双击 `scripts/stop.bat`）   | 停止服务：按「仓库路径 + vite/tsx」识别进程并树杀，watcher 父进程一并清理，不留僵尸 |
| `npm run build:single`      | 构建单文件 HTML（`apps/web/dist-single/index.html`，可直接分发） |
| `npm test`                  | Vitest 单元测试（22 例）                                          |
| `npm run e2e`               | E2E 全流程回归（23 断言，需先启动 API + dev server）              |
| `npm run lint` / `lint:fix` | ESLint 检查 / 自动修复                                            |
| `npm run format`            | Prettier 格式化                                                   |

演示账号：`demo` / `123456`（内置管理员，真实接口登录；拥有除审计日志外的全部权限）。

## 后端 API（apps/server）

技术栈：**Express 5 + pg 直写 SQL + JWT + bcryptjs**，PostgreSQL 库 `moadmin`（本机 5432，postgres/123456）。所有业务路由挂 `/api` 前缀，响应统一 `{ code, data, message }`（code=0 成功）。

首次初始化（建库 → 建表 → 种子数据）：

```bash
npm run setup --workspace @mo/server   # 等价 tsx src/db/setup.ts，幂等可重跑
npm run dev --workspace @mo/server     # 启动 API（tsx watch，端口 3000，健康检查 GET /health）
```

RBAC 六表：`sys_user` / `sys_role` / `sys_menu`（parent_id 树形，1目录/2菜单/3按钮）/ `sys_user_role` / `sys_role_menu`。种子数据含 20 条菜单（权限码 user:* / role:* / menu:* 等）、角色 admin（内置）/ inspector（演示）。

删除保护三规则（前后端一致）：

| 对象 | 规则 |
| ---- | ---- |
| 内置用户/角色（is_builtin=1） | 不可删除、不可停用 |
| 角色仍有用户绑定 | 拒绝删除（RULE_BIND） |
| 菜单有子节点或被角色绑定 | 拒绝删除（RULE_HAS_CHILD / RULE_BIND） |

权限校验：后端 `requirePermission(code)` 中间件实时查库；前端权限由 `/auth/login` 返回 `permissions[]`，三层应用见下节。

## 系统管理内置页面（/system）

用户管理 / 角色管理 / 菜单管理三页，走真实接口（`/api` 代理到 3000）：

- **用户管理**：分页搜索、新增/编辑（角色多选）、启停用、删除确认；`user:create / user:edit / user:delete / user:assign`
- **角色管理**：CRUD + 树形勾选分配菜单（父级联动全选子孙、半选态），回显 `getRoleMenus`；`role:create / role:edit / role:delete / role:assign`
- **菜单管理**：三型树形表格（展开/缩进/类型徽标）、新增子级默认类型联动（目录→菜单→按钮）、编辑时父级下拉排除自身及子孙防成环；`menu:create / menu:edit / menu:delete`

新增系统页面可直接复制这三页的骨架（PageSection + Table + Dialog + v-permission + ApiError toast）。

## 三层架构用法

### 1. 令牌层（@mo/tokens）

所有颜色/圆角/阴影以 CSS 变量定义在 `tokens.css`（`:root` 浅色 + `.dark` 深色），组件只引用语义变量（`bg-background`、`text-muted-foreground` 等）。改主题 = 改变量，不改组件。

### 2. 组件层（@mo/components）

23 组组件：button / input / textarea / label / checkbox / radio / switch / select / dropdown-menu / dialog / **sheet（侧滑抽屉）** / tree / tabs / pagination / empty / tooltip / toast / table / **form（校验体系）** / badge / avatar / card / alert / progress / skeleton / breadcrumb。

```vue
<script setup>
import { Form, FormItem, Input, Button } from '@mo/components'
// FormItem 包裹任意输入组件，rules 声明式校验
</script>
<template>
  <Form :model="form" :rules="rules" ref="formRef">
    <FormItem prop="name" label="名称">
      <Input v-model="form.name" />
    </FormItem>
  </Form>
</template>
```

规则支持 `required / min / max / pattern / validator`（validator 可异步）。校验时机：字段失焦实时复检 + `formRef.validate()` 全量校验。

### 3. 布局层（@mo/layouts）

`BasicLayout`：桌面端固定侧栏（分组菜单 + 折叠），窄屏（<1024px）自动变抽屉 + 移动端顶栏。应用通过插槽注入：

- `#logo` / `#logo-text`：品牌区
- `#sidebar-top`：公司信息卡
- `#sidebar-footer`（插槽参数 `{ collapsed }`）：主题切换、用户菜单

菜单配置在 `apps/web/src/config/menus.ts`，新增页面在此登记即可。

## 权限方案（三层共用权限码）

用户信息携带 `permissions: string[]`，三层控制：

1. **菜单级**：菜单项配 `permission` 字段，MainLayout 自动过滤
2. **路由级**：路由 `meta.permission`，全局守卫无权限跳 403
3. **按钮级**：`v-permission="'system:manage'"` 指令（静态移除）或 `usePermission()`（响应式）

权限码由登录接口返回（真实接口来自 `/auth/login`，mock 保留给组件演示页 `/components`）。

## 请求层约定

`apps/web/src/api/request.ts`：fetch 封装，统一 `{ code, data, message }` 响应结构、Bearer token 注入、15s 超时、401 自动跳登录。业务错误统一抛 `ApiError`（code + HTTP status）。

**Mock 机制**：url 以 `/mock/` 开头走本地处理器；接真实后端时删除 `request.ts` 中的 mock 分支与 `mock.ts`，业务代码零改动。API 前缀通过 `VITE_API_BASE` 环境变量配置（默认 `/api`）。

## 错误页

`/403`、`/500`、`/:pathMatch(.*)* → 404`（挂在主布局下，保留侧边导航），文案通过路由 props 传入。全局未捕获异常由 `main.ts` 的 `app.config.errorHandler` 兜底（console + Toast）。

## 新页面接入清单

1. `apps/web/src/pages/` 新建页面组件
2. `apps/web/src/router/index.ts` 登记路由（需要权限时加 `meta.permission`）
3. `apps/web/src/config/menus.ts` 登记菜单（需要权限时加 `permission` 字段）
4. 页面骨架用 `PageSection` 包裹，保持 20px 间距体系

## 质量保障

- **单元测试**：覆盖 cn 工具（含 tailwind-merge 冲突）、表单校验核心（含异步 validator）、Toast 状态机、Form/FormItem 挂载集成
- **API 冒烟**：`scripts/smoke.mjs` 覆盖登录/权限码/CRUD/删除保护/绑定回写 21 断言（凭据在脚本内，可用 SMOKE_USER/SMOKE_PASS 环境变量覆盖）
- **E2E 回归**：`scripts/e2e.mjs` 覆盖登录/导航/系统管理三页(真实API)/表单/请求层/权限/退出全流程 23 断言，任何改动后 `npm run e2e` 一键回归
- **规范**：ESLint（正确性）+ Prettier（格式），提交前 `npm run lint && npm test`

## 待办（等确认后排期）

- 动态菜单二期（菜单表驱动路由注册，当前为静态路由 + 数据库权限校验）
- Upload 组件（需后端文件接口配套）
- DatePicker（Reka Popover + 日历）
- Storybook 组件文档站 / 组件包独立构建与发包（P3）
