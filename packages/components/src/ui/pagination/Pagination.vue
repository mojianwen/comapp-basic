<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { Button } from '../button'
import { cn } from '../../lib/utils'

const props = withDefaults(
  defineProps<{
    page: number
    totalPages: number
    /** 当前页码两侧显示的页码数 */
    siblingCount?: number
    class?: HTMLAttributes['class']
  }>(),
  { siblingCount: 1 },
)

const emit = defineEmits<{ 'update:page': [page: number] }>()

type Item = number | 'ellipsis-l' | 'ellipsis-r'

const items = computed<Item[]>(() => {
  const { page, totalPages, siblingCount } = props
  // 页数少时全部展示
  if (totalPages <= 5 + siblingCount * 2) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  const left = Math.max(2, page - siblingCount)
  const right = Math.min(totalPages - 1, page + siblingCount)
  const out: Item[] = [1]
  if (left > 2) out.push('ellipsis-l')
  for (let i = left; i <= right; i++) out.push(i)
  if (right < totalPages - 1) out.push('ellipsis-r')
  out.push(totalPages)
  return out
})
</script>

<template>
  <nav :class="cn('flex items-center gap-1', props.class)" aria-label="分页导航">
    <Button
      variant="outline"
      size="icon"
      class="h-8 w-8"
      aria-label="上一页"
      :disabled="page <= 1"
      @click="emit('update:page', page - 1)"
    >
      <ChevronLeft class="h-4 w-4" />
    </Button>

    <template v-for="(it, idx) in items" :key="`${it}-${idx}`">
      <span
        v-if="typeof it === 'string'"
        class="flex h-8 w-8 items-center justify-center text-sm text-muted-foreground"
        aria-hidden="true"
      >
        …
      </span>
      <Button
        v-else
        :variant="it === page ? 'default' : 'ghost'"
        size="sm"
        class="h-8 w-8 px-0"
        :class="it === page ? '' : 'text-muted-foreground'"
        :aria-current="it === page ? 'page' : undefined"
        @click="emit('update:page', it)"
      >
        {{ it }}
      </Button>
    </template>

    <Button
      variant="outline"
      size="icon"
      class="h-8 w-8"
      aria-label="下一页"
      :disabled="page >= totalPages"
      @click="emit('update:page', page + 1)"
    >
      <ChevronRight class="h-4 w-4" />
    </Button>
  </nav>
</template>
