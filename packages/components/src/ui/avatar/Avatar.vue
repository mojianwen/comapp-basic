<script setup lang="ts">
import { AvatarFallback, AvatarImage, AvatarRoot } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { cn } from '../../lib/utils'

/**
 * 头像：有图显示图片，无图/加载失败显示文字兜底（默认取名称末字）
 */
const props = defineProps<{
  src?: string
  alt?: string
  /** 图片不可用时的文字兜底（如姓名） */
  fallback?: string
  class?: HTMLAttributes['class']
}>()

const fallbackText = props.fallback?.trim() || props.alt?.trim() || '?'
</script>

<template>
  <AvatarRoot
    :class="
      cn(
        'relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full border border-border bg-muted',
        props.class,
      )
    "
  >
    <AvatarImage v-if="src" :src="src" :alt="alt" class="h-full w-full object-cover" />
    <AvatarFallback
      class="flex h-full w-full items-center justify-center text-sm font-medium text-muted-foreground"
    >
      {{ fallbackText }}
    </AvatarFallback>
  </AvatarRoot>
</template>
