<script setup lang="ts">
import { ProgressIndicator, ProgressRoot } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { cn } from '../../lib/utils'

const props = defineProps<{
  /** 进度 0~100 */
  modelValue?: number
  max?: number
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <ProgressRoot
    :model-value="props.modelValue"
    :max="props.max ?? 100"
    :class="cn('relative h-2 w-full overflow-hidden rounded-full bg-muted', props.class)"
  >
    <ProgressIndicator
      class="h-full rounded-full bg-primary transition-all duration-500"
      :style="{ width: `${Math.min(100, Math.max(0, props.modelValue ?? 0))}%` }"
    />
  </ProgressRoot>
</template>
