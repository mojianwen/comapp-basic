<script setup lang="ts">
import type { Component } from 'vue'
import { computed, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { PanelLeft, PanelLeftClose, PanelLeftOpen } from 'lucide-vue-next'
import { cn } from '@mo/components/lib/utils'

/**
 * 基础布局（参考后台管理范式）：
 * - 桌面端（≥1024px）：左侧固定侧栏（可折叠），内容区通栏铺满
 * - 移动端（<1024px）：侧栏变抽屉（遮罩点击关闭），内容区顶部显示移动端顶栏
 * - 侧栏结构：Logo / 公司信息卡（插槽）/ 分组菜单 / 底部操作区（插槽）
 */
export interface MenuItem {
  title: string
  path: string
  icon?: Component
  /** 权限码（由应用层过滤后传入，布局层只负责渲染） */
  permission?: string
}

export interface MenuGroup {
  label?: string
  items: MenuItem[]
}

defineProps<{
  menuGroups: MenuGroup[]
}>()

const route = useRoute()
const collapsed = ref(false)

// ===== 响应式：窄屏抽屉模式 =====
const mql = window.matchMedia('(max-width: 1023px)')
const isMobile = ref(mql.matches)
const drawerOpen = ref(false)

function onMqChange(e: MediaQueryListEvent) {
  isMobile.value = e.matches
  if (!e.matches) drawerOpen.value = false
}
mql.addEventListener('change', onMqChange)
onUnmounted(() => mql.removeEventListener('change', onMqChange))

watch(
  () => route.path,
  () => {
    if (isMobile.value) drawerOpen.value = false
  },
)

function isActive(path: string) {
  return route.path === path || (path !== '/' && route.path.startsWith(path))
}

const asideCls = computed(() =>
  cn(
    'fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-border bg-[#E8F6FF] transition-all dark:bg-card',
    'lg:translate-x-0',
    isMobile.value
      ? drawerOpen.value
        ? 'translate-x-0 shadow-xl'
        : '-translate-x-full'
      : collapsed.value
        ? 'lg:w-16'
        : 'lg:w-60',
  ),
)

// 内容区：桌面端 ml-60/ml-16（侧栏宽 + 20px 间距 p-5）；移动端 ml-0 顶栏替代
const mainCls = computed(() =>
  cn(
    'min-h-screen min-w-0 flex-1 space-y-5 p-5 transition-all',
    isMobile.value ? 'ml-0 pt-0' : collapsed.value ? 'ml-16' : 'ml-60',
  ),
)
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <!-- ===== 移动端抽屉遮罩 ===== -->
    <div
      v-if="isMobile && drawerOpen"
      class="fixed inset-0 z-30 bg-black/40"
      aria-hidden="true"
      @click="drawerOpen = false"
    />

    <!-- ===== 侧边栏 ===== -->
    <aside :class="asideCls">
      <!-- 顶部区域：Logo + 公司卡合并，分隔线左右各留 5px -->
      <div class="shrink-0">
        <div class="flex h-14 items-center justify-center gap-2 font-semibold">
          <slot name="logo" />
          <span class="truncate"><slot name="logo-text" /></span>
        </div>
        <div class="px-3 pb-3" :class="collapsed && !isMobile ? 'hidden' : ''">
          <slot name="sidebar-top" />
        </div>
      </div>

      <!-- 分组菜单 -->
      <nav class="flex-1 space-y-4 overflow-y-auto px-3 py-3" aria-label="主导航">
        <div v-for="(group, gi) in menuGroups" :key="gi">
          <p
            v-if="group.label && !(collapsed && !isMobile)"
            class="mb-1 px-2 text-xs font-medium text-muted-foreground/70"
          >
            {{ group.label }}
          </p>
          <div class="space-y-1">
            <RouterLink
              v-for="m in group.items"
              :key="m.path"
              :to="m.path"
              :title="collapsed && !isMobile ? m.title : undefined"
              :class="
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all active:scale-[0.98]',
                  isActive(m.path)
                    ? 'bg-white font-medium text-primary shadow-sm dark:bg-muted'
                    : 'text-slate-700 hover:bg-background/70 hover:text-foreground dark:text-slate-300',
                )
              "
              :aria-current="isActive(m.path) ? 'page' : undefined"
            >
              <component :is="m.icon" v-if="m.icon" class="h-4 w-4 shrink-0" />
              <span v-if="!collapsed || isMobile" class="truncate">{{ m.title }}</span>
            </RouterLink>
          </div>
        </div>
      </nav>

      <!-- 底部操作区：分隔线左右各留 5px，应用注入（主题切换 / 用户菜单）与折叠按钮同行 -->
      <div class="shrink-0">
        <div class="mx-[5px] h-px bg-slate-400/70 dark:bg-slate-600" />
        <div
          class="flex items-center px-2 py-3"
          :class="collapsed && !isMobile ? 'flex-col gap-2' : 'justify-between gap-1'"
        >
          <div
            class="flex min-w-0 items-center"
            :class="collapsed && !isMobile ? 'flex-col gap-2' : 'flex-1 gap-1'"
          >
            <slot name="sidebar-footer" :collapsed="collapsed && !isMobile" />
          </div>
          <button
            v-if="!isMobile"
            class="flex h-9 shrink-0 items-center justify-center gap-1 rounded-md px-1.5 text-muted-foreground transition-colors hover:bg-background/70 hover:text-foreground"
            :class="collapsed ? 'w-9' : ''"
            :aria-label="collapsed ? '展开' : '折叠'"
            :title="collapsed ? '展开' : '折叠'"
            @click="collapsed = !collapsed"
          >
            <PanelLeftOpen v-if="collapsed" class="h-4 w-4" />
            <template v-else>
              <PanelLeftClose class="h-4 w-4" />
              <span class="text-xs">折叠</span>
            </template>
          </button>
        </div>
      </div>
    </aside>

    <!-- ===== 内容区：通栏铺满（移动端顶部带导航条） ===== -->
    <main :class="mainCls">
      <!-- 移动端顶栏 -->
      <div
        v-if="isMobile"
        class="sticky top-0 z-20 -mx-5 -mt-5 mb-5 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur"
      >
        <button
          class="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          :aria-label="drawerOpen ? '关闭导航' : '打开导航'"
          @click="drawerOpen = !drawerOpen"
        >
          <PanelLeft class="h-5 w-5" />
        </button>
        <span class="truncate font-semibold"><slot name="logo-text" /></span>
      </div>

      <slot />
    </main>
  </div>
</template>
