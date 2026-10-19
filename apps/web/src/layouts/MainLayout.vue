<script setup lang="ts">
import { useRouter } from 'vue-router'
import { DropdownMenuRoot } from 'reka-ui'
import {
  Activity,
  Building2,
  ChevronsUpDown,
  CircleUserRound,
  LogOut,
  Palette,
} from 'lucide-vue-next'
import { BasicLayout } from '@mo/layouts'
import {
  Button,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  toast,
} from '@mo/components'
import { menuGroups } from '../config/menus'
import { hasPermission, logout, useAuth } from '../stores/auth'
import { useTheme } from '../stores/theme'

const router = useRouter()
const auth = useAuth()
const { isDark, toggle } = useTheme()

/** 按权限过滤菜单：无权限项隐藏，空分组丢弃 */
const visibleMenuGroups = menuGroups
  .map((g) => ({
    ...g,
    items: g.items.filter((i) => !i.permission || hasPermission(i.permission)),
  }))
  .filter((g) => g.items.length > 0)

function handleLogout() {
  logout()
  toast({ variant: 'default', title: '已退出登录' })
  router.push({ name: 'login' })
}
</script>

<template>
  <BasicLayout :menu-groups="visibleMenuGroups">
    <template #logo>
      <Activity class="h-5 w-5 shrink-0 text-primary" />
    </template>
    <template #logo-text>
      <span class="text-lg text-[#008B94] dark:text-cyan-300">综合管控平台</span>
    </template>

    <!-- 公司信息（与 Logo 同属一个区域，背景胶囊与菜单选中态呼应） -->
    <template #sidebar-top>
      <div class="flex items-center gap-3 rounded-lg bg-white p-2 shadow-sm dark:bg-card">
        <div
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"
        >
          <Building2 class="h-4.5 w-4.5" />
        </div>
        <div class="min-w-0">
          <p class="truncate text-sm font-medium">天河道云科技</p>
          <p class="truncate text-xs text-muted-foreground">
            {{ auth.user?.role ?? '未登录' }} · 综合管控
          </p>
        </div>
      </div>
    </template>

    <RouterView />

    <!-- 底部操作区：主题切换 + 用户菜单（折叠时仅显示图标） -->
    <template #sidebar-footer="{ collapsed }">
      <div class="flex items-center gap-2" :class="collapsed ? 'flex-col' : ''">
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="ghost"
              :size="collapsed ? 'icon' : 'sm'"
              class="shrink-0 gap-1 px-1.5"
              :aria-label="isDark ? '切换到浅色模式' : '切换到深色模式'"
              @click="toggle"
            >
              <Palette class="h-4 w-4 shrink-0" />
              <span v-if="!collapsed" class="text-xs">背景</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{{ isDark ? '切换到浅色模式' : '切换到深色模式' }}</TooltipContent>
        </Tooltip>

        <DropdownMenuRoot>
          <DropdownMenuTrigger as-child>
            <Button
              variant="ghost"
              :size="collapsed ? 'icon' : 'sm'"
              class="min-w-0 gap-1 px-1.5"
              :aria-label="`用户菜单：${auth.user?.name ?? '未登录'}`"
            >
              <CircleUserRound class="h-4 w-4 shrink-0" />
              <template v-if="!collapsed">
                <span class="flex min-w-0 items-center gap-0.5">
                  <span class="truncate">{{ auth.user?.name ?? '未登录' }}</span>
                  <ChevronsUpDown class="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </span>
              </template>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" class="w-40">
            <DropdownMenuItem disabled>{{ auth.user?.role ?? '游客' }}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem class="text-destructive" @click="handleLogout">
              <LogOut class="h-4 w-4" />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenuRoot>
      </div>
    </template>
  </BasicLayout>
</template>
