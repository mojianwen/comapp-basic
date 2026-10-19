<script setup lang="ts">
import { useRoute } from 'vue-router'
import { Wrench } from 'lucide-vue-next'
import { EmptyState } from '@mo/components'

const route = useRoute()
</script>

<template>
  <EmptyState
    :title="`「${route.meta.title}」页面建设中`"
    description="该模块已完成路由与菜单接入，内容随业务需求逐步补充。"
  >
    <template #icon>
      <div class="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Wrench class="h-6 w-6 text-muted-foreground" />
      </div>
    </template>
  </EmptyState>
</template>
