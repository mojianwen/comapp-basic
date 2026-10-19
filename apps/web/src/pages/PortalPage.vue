<script setup lang="ts">
import { useRouter } from 'vue-router'
import {
  ArrowRight,
  Bell,
  Camera,
  FileBarChart,
  Megaphone,
  MonitorCog,
  Settings,
  ShieldCheck,
} from 'lucide-vue-next'
import { Button, toast } from '@mo/components'
import { PageSection } from '@mo/layouts'
import { useAuth } from '../stores/auth'

const router = useRouter()
const auth = useAuth()

const today = new Date().toLocaleDateString('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  weekday: 'long',
})

interface AppEntry {
  title: string
  desc: string
  icon: typeof MonitorCog
  path?: string
}

const apps: AppEntry[] = [
  { title: '数据监测', desc: '实时值 · 报警 · 趋势', icon: MonitorCog, path: '/monitor' },
  { title: '隐患上报', desc: '随手拍 · 快速处置', icon: Camera },
  { title: '报表中心', desc: '日报 · 周报 · 台账', icon: FileBarChart },
  { title: '系统管理', desc: '用户 · 角色 · 参数', icon: Settings, path: '/system' },
]

const notices = [
  { tag: '公告', title: '平台 v0.1 基础框架上线：导航 / 门户 / 登录全面就绪', date: '2026-10-18' },
  {
    tag: '更新',
    title: '监测组件库新增 Toast、Tooltip、Pagination、空状态组件',
    date: '2026-10-17',
  },
  { tag: '公告', title: '井下设备例检计划表已更新，请各采区查收', date: '2026-10-16' },
] as const

const shortcuts = ['安全规程', '应急预案', '值班表', '操作手册'] as const

function openApp(app: AppEntry) {
  if (app.path) {
    router.push(app.path)
  } else {
    toast({
      variant: 'default',
      title: `「${app.title}」演示入口`,
      description: '该模块为占位，随业务需求接入',
    })
  }
}
</script>

<template>
  <!-- 欢迎横幅（参考 SaaS 后台：渐变底 + 白字 + 操作按钮 + 统计徽章） -->
  <div
    class="relative overflow-hidden rounded-xl bg-gradient-to-r from-primary to-emerald-600 p-6 text-white dark:from-cyan-800 dark:to-emerald-700"
  >
    <div class="flex flex-wrap items-center justify-between gap-4">
      <div>
        <h1 class="text-xl font-semibold">欢迎回来，{{ auth.user?.name ?? '朋友' }}！</h1>
        <p class="mt-1 text-sm text-white/80">{{ today }} · 祝安全生产</p>
        <div class="mt-4 flex flex-wrap gap-2">
          <Button
            class="border-0 bg-white/15 text-white hover:bg-white/25"
            @click="router.push('/monitor')"
          >
            <MonitorCog class="h-4 w-4" />
            进入数据监测
          </Button>
          <Button
            class="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white"
            variant="outline"
            @click="router.push('/system')"
          >
            <Settings class="h-4 w-4" />
            系统管理
          </Button>
        </div>
      </div>
      <div class="flex flex-col items-end gap-2">
        <span class="rounded-full bg-white/15 px-3 py-1 text-xs backdrop-blur">
          {{ auth.user?.role ?? '游客' }}
        </span>
        <div class="flex gap-2">
          <div class="rounded-lg bg-white/10 px-3 py-2 text-center backdrop-blur">
            <p class="text-lg font-semibold tabular-nums">12</p>
            <p class="text-xs text-white/80">在线监测点</p>
          </div>
          <div class="rounded-lg bg-white/10 px-3 py-2 text-center backdrop-blur">
            <p class="text-lg font-semibold tabular-nums">2</p>
            <p class="text-xs text-white/80">待处理预警</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 应用入口 -->
  <PageSection title="应用入口" description="各业务模块统一入口，点击直达。">
    <template #icon>
      <ShieldCheck class="h-5 w-5 text-primary" />
    </template>

    <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <button
        v-for="app in apps"
        :key="app.title"
        class="group flex flex-col items-start gap-2 rounded-lg border border-border bg-muted/30 p-4 text-left transition-colors hover:border-primary/50 hover:bg-primary/5"
        @click="openApp(app)"
      >
        <div
          class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground"
        >
          <component :is="app.icon" class="h-5 w-5" />
        </div>
        <div>
          <p class="flex items-center gap-1 text-sm font-medium">
            {{ app.title }}
            <ArrowRight class="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
          </p>
          <p class="mt-0.5 text-xs text-muted-foreground">{{ app.desc }}</p>
        </div>
      </button>
    </div>
  </PageSection>

  <!-- 通知公告 -->
  <PageSection title="通知公告" description="平台动态与矿山安全提醒。">
    <template #icon>
      <Megaphone class="h-5 w-5 text-primary" />
    </template>
    <template #actions>
      <Button
        variant="ghost"
        size="sm"
        @click="toast({ variant: 'default', title: '公告中心为演示占位' })"
      >
        查看全部
        <Bell class="h-3.5 w-3.5" />
      </Button>
    </template>

    <div class="space-y-2">
      <div
        v-for="(n, idx) in notices"
        :key="idx"
        class="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2.5 transition-colors hover:bg-muted/40"
      >
        <div class="flex items-center gap-2">
          <span
            class="inline-flex rounded-full border px-2 py-0.5 text-xs"
            :class="
              n.tag === '公告'
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-emerald-600/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
            "
          >
            {{ n.tag }}
          </span>
          <span class="text-sm">{{ n.title }}</span>
        </div>
        <span class="text-xs tabular-nums text-muted-foreground">{{ n.date }}</span>
      </div>
    </div>
  </PageSection>

  <!-- 快捷链接 -->
  <PageSection title="快捷链接" description="常用资料一键直达。">
    <template #icon>
      <Bell class="h-5 w-5 text-primary" />
    </template>

    <div class="flex flex-wrap gap-2">
      <Button
        v-for="s in shortcuts"
        :key="s"
        variant="outline"
        size="sm"
        @click="toast({ variant: 'default', title: `「${s}」为演示链接` })"
      >
        {{ s }}
      </Button>
    </div>
  </PageSection>
</template>
