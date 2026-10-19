<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Compass, RefreshCw, ShieldX } from 'lucide-vue-next'
import { Button } from '@mo/components'

/**
 * 通用错误页：403 无权限 / 404 未找到 / 500 服务异常
 * 通过路由 props 传入 code/title/description，挂在 MainLayout 下使用（保留侧边导航）
 */
const props = defineProps<{
  code: string
  title: string
  description: string
}>()

const router = useRouter()

const icon = computed(() => (props.code === '403' ? ShieldX : Compass))
</script>

<template>
  <div class="flex min-h-[70vh] items-center justify-center">
    <div class="flex max-w-md flex-col items-center gap-4 text-center">
      <div class="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <component :is="icon" class="h-8 w-8 text-destructive" />
      </div>

      <div>
        <p class="text-5xl font-bold tabular-nums text-primary">{{ code }}</p>
        <h1 class="mt-3 text-lg font-semibold">{{ title }}</h1>
        <p class="mt-2 text-sm text-muted-foreground">{{ description }}</p>
      </div>

      <div class="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Button variant="outline" @click="router.back()">
          <RefreshCw class="h-4 w-4" />
          返回上一页
        </Button>
        <Button @click="router.push('/')">回到门户主页</Button>
      </div>
    </div>
  </div>
</template>
