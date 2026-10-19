import { createRouter, createWebHashHistory } from 'vue-router'
import MainLayout from '../layouts/MainLayout.vue'
import { hasPermission, isLoggedIn } from '../stores/auth'

/**
 * 路由规划：
 * /login            登录页（公开，独立布局）
 * /                 基础布局（侧边栏骨架）
 *   ├─ /            门户主页
 *   ├─ /monitor     数据监测（占位）
 *   ├─ /components  组件示例
 *   └─ /system      系统管理（占位）
 * meta.title 用于顶栏面包屑
 */
const router = createRouter({
  // hash 模式：单文件构建（file:// / 静态托管）无需服务端重写即可运行
  history: createWebHashHistory(),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../pages/LoginPage.vue'),
      meta: { public: true, title: '登录' },
    },
    {
      path: '/',
      component: MainLayout,
      children: [
        {
          path: '',
          name: 'portal',
          component: () => import('../pages/PortalPage.vue'),
          meta: { title: '门户主页' },
        },
        {
          path: 'monitor',
          name: 'monitor',
          component: () => import('../pages/PlaceholderPage.vue'),
          meta: { title: '数据监测' },
        },
        {
          path: 'components',
          name: 'components',
          component: () => import('../pages/ComponentDemoPage.vue'),
          meta: { title: '组件示例' },
        },
        {
          path: 'system',
          redirect: '/system/users',
        },
        {
          path: 'system/users',
          name: 'system-users',
          component: () => import('../pages/system/UsersPage.vue'),
          meta: { title: '用户管理', permission: 'system:user' },
        },
        {
          path: 'system/roles',
          name: 'system-roles',
          component: () => import('../pages/system/RolesPage.vue'),
          meta: { title: '角色管理', permission: 'system:role' },
        },
        {
          path: 'system/menus',
          name: 'system-menus',
          component: () => import('../pages/system/MenusPage.vue'),
          meta: { title: '菜单管理', permission: 'system:menu' },
        },
        {
          path: 'audit',
          name: 'audit',
          component: () => import('../pages/PlaceholderPage.vue'),
          meta: { title: '审计日志', permission: 'audit:view' },
        },
        // ===== 错误页（保留侧边导航） =====
        {
          path: '403',
          name: 'forbidden',
          component: () => import('../pages/ErrorPage.vue'),
          props: {
            code: '403',
            title: '没有访问权限',
            description: '您的账号无权访问该页面，请联系系统管理员开通权限。',
          },
          meta: { title: '403' },
        },
        {
          path: '500',
          name: 'server-error',
          component: () => import('../pages/ErrorPage.vue'),
          props: {
            code: '500',
            title: '服务开小差了',
            description: '服务器暂时无法处理请求，请稍后重试或联系运维人员。',
          },
          meta: { title: '500' },
        },
        {
          path: ':pathMatch(.*)*',
          name: 'not-found',
          component: () => import('../pages/ErrorPage.vue'),
          props: {
            code: '404',
            title: '页面不存在',
            description: '您访问的页面不存在或已被移除，请检查地址是否正确。',
          },
          meta: { title: '404' },
        },
      ],
    },
  ],
})

// 全局守卫：未登录 → 登录页；已登录访问登录页 → 门户主页；无权限 → 403
router.beforeEach((to) => {
  if (!to.meta.public && !isLoggedIn.value) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  if (to.name === 'login' && isLoggedIn.value) {
    return { name: 'portal' }
  }
  const permission = to.meta.permission as string | undefined
  if (permission && !hasPermission(permission)) {
    return { name: 'forbidden' }
  }
})

export default router
