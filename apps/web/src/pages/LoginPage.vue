<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Activity, Eye, EyeOff, ShieldCheck, Waves, Zap } from 'lucide-vue-next'
import { Button, Checkbox, Input, Label, toast } from '@mo/components'
import { login } from '../stores/auth'

const router = useRouter()
const route = useRoute()

const account = ref('')
const password = ref('')
const remember = ref(true)
const showPwd = ref(false)
const loading = ref(false)
const errorMsg = ref('')

async function onSubmit() {
  if (!account.value.trim()) {
    errorMsg.value = '请输入账号'
    return
  }
  if (!password.value) {
    errorMsg.value = '请输入密码'
    return
  }
  loading.value = true
  errorMsg.value = ''
  try {
    const res = await login(account.value, password.value)
    toast({ variant: 'success', title: '登录成功', description: `欢迎回来，${res.user.name}` })
    router.push(String(route.query.redirect || '/'))
  } catch (e) {
    errorMsg.value = e instanceof Error ? e.message : '登录失败，请重试'
    toast({ variant: 'error', title: '登录失败', description: errorMsg.value })
  } finally {
    loading.value = false
  }
}

function onForgot() {
  toast({
    variant: 'default',
    title: '请联系管理员重置密码',
    description: '演示环境：demo / 123456',
  })
}
</script>

<template>
  <div class="flex min-h-screen bg-background text-foreground">
    <!-- 品牌区（桌面端显示） -->
    <div
      class="relative hidden flex-1 flex-col justify-between overflow-hidden bg-card p-10 lg:flex"
    >
      <!-- 装饰：青色光晕 -->
      <div
        class="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl"
      />
      <div
        class="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-primary/5 blur-3xl"
      />

      <div class="relative flex items-center gap-2 font-semibold">
        <Activity class="h-6 w-6 text-primary" />
        <span>MoAdmin</span>
      </div>

      <div class="relative">
        <h1 class="text-3xl font-bold leading-snug">矿山综合管控平台</h1>
        <p class="mt-3 max-w-md text-muted-foreground">
          安全监测 · 数据融通 · 一图统管——把分散的矿山数据变成可决策的信息。
        </p>
        <ul class="mt-8 space-y-3 text-sm text-muted-foreground">
          <li class="flex items-center gap-2">
            <ShieldCheck class="h-4 w-4 shrink-0 text-primary" />
            实时监测与报警联动，异常情况秒级触达
          </li>
          <li class="flex items-center gap-2">
            <Zap class="h-4 w-4 shrink-0 text-primary" />
            监测 / 地测 / 机电数据一站式归集
          </li>
          <li class="flex items-center gap-2">
            <Waves class="h-4 w-4 shrink-0 text-primary" />
            大屏 · 桌面 · 移动端统一体验
          </li>
        </ul>
      </div>

      <p class="relative text-xs text-muted-foreground">© 2026 天河道云 · 内部演示环境</p>
    </div>

    <!-- 登录表单区 -->
    <div class="flex flex-1 items-center justify-center p-6">
      <div class="w-full max-w-sm">
        <div class="mb-8 flex items-center gap-2 font-semibold lg:hidden">
          <Activity class="h-5 w-5 text-primary" />
          <span>MoAdmin</span>
        </div>

        <h2 class="text-2xl font-semibold">登录</h2>
        <p class="mt-1 text-sm text-muted-foreground">使用平台账号访问综合管控平台</p>

        <form class="mt-8 space-y-4" novalidate @submit.prevent="onSubmit">
          <div class="space-y-1.5">
            <Label>账号</Label>
            <Input v-model="account" placeholder="请输入账号" autocomplete="username" />
          </div>

          <div class="space-y-1.5">
            <Label>密码</Label>
            <div class="relative">
              <Input
                v-model="password"
                :type="showPwd ? 'text' : 'password'"
                placeholder="请输入密码"
                autocomplete="current-password"
                class="pr-10"
              />
              <button
                type="button"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                :aria-label="showPwd ? '隐藏密码' : '显示密码'"
                @click="showPwd = !showPwd"
              >
                <EyeOff v-if="showPwd" class="h-4 w-4" />
                <Eye v-else class="h-4 w-4" />
              </button>
            </div>
          </div>

          <div class="flex items-center justify-between">
            <label class="flex cursor-pointer items-center gap-2 text-sm">
              <Checkbox v-model="remember" />
              <span>记住我</span>
            </label>
            <button type="button" class="text-sm text-primary hover:underline" @click="onForgot">
              忘记密码？
            </button>
          </div>

          <p v-if="errorMsg" class="text-xs text-destructive">{{ errorMsg }}</p>

          <Button type="submit" class="w-full" :disabled="loading">
            {{ loading ? '登录中…' : '登 录' }}
          </Button>
        </form>

        <p
          class="mt-6 rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground"
        >
          演示账号：demo · 密码：123456（接真实后端后此提示移除）
        </p>
      </div>
    </div>
  </div>
</template>
