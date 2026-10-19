<script setup lang="ts">
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
  DialogTrigger,
} from 'reka-ui'
import { X } from 'lucide-vue-next'
import type { HTMLAttributes } from 'vue'
import { cn } from '../../lib/utils'

/**
 * 侧滑抽屉（Sheet）：基于 Reka Dialog 实现，从左/右滑出
 * 通过 #trigger 插槽放唤起按钮，默认插槽放内容
 */
const props = defineProps<{
  side?: 'left' | 'right'
  title: string
  description?: string
  class?: HTMLAttributes['class']
}>()

const open = defineModel<boolean>('open', { default: false })
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogTrigger v-if="$slots.trigger" as-child>
      <slot name="trigger" />
    </DialogTrigger>
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 z-50 bg-black/50" />
      <DialogContent
        :class="
          cn(
            'fixed inset-y-0 z-50 flex w-80 max-w-[85vw] flex-col gap-4 border-border bg-background p-6 shadow-lg focus:outline-none',
            props.side === 'left' ? 'left-0 border-r' : 'right-0 border-l',
            props.class,
          )
        "
      >
        <div class="space-y-1.5">
          <DialogTitle class="text-lg font-semibold">{{ props.title }}</DialogTitle>
          <DialogDescription v-if="props.description" class="text-sm text-muted-foreground">
            {{ props.description }}
          </DialogDescription>
        </div>
        <slot />
        <DialogClose
          class="absolute right-4 top-4 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="关闭"
        >
          <X class="h-4 w-4" />
        </DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
