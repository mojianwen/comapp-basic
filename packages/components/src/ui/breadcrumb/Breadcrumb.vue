<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next'
import type { HTMLAttributes } from 'vue'
import { cn } from '../../lib/utils'

/**
 * 面包屑：items 依次渲染；最后一项为当前页（无链接、高亮），其余项有 to 则渲染 RouterLink
 */
export interface Crumb {
  label: string
  to?: string
}

const props = defineProps<{
  items: Crumb[]
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <nav
    aria-label="面包屑"
    :class="cn('flex flex-wrap items-center gap-1 text-sm text-muted-foreground', props.class)"
  >
    <template v-for="(item, i) in props.items" :key="i">
      <ChevronRight v-if="i > 0" class="h-3.5 w-3.5 shrink-0 opacity-50" />
      <RouterLink
        v-if="item.to && i < props.items.length - 1"
        :to="item.to"
        class="rounded px-1 py-0.5 transition-colors hover:bg-muted hover:text-foreground"
      >
        {{ item.label }}
      </RouterLink>
      <span v-else class="px-1 py-0.5 font-medium text-foreground" aria-current="page">{{
        item.label
      }}</span>
    </template>
  </nav>
</template>
