<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Archive } from 'lucide-vue-next'
import { cn } from '../../lib/utils'

const props = defineProps<{
  title: string
  description?: string
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div
    :class="
      cn(
        'flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 px-6 py-12 text-center',
        props.class,
      )
    "
  >
    <div class="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
      <slot name="icon">
        <Archive class="h-6 w-6 text-muted-foreground" />
      </slot>
    </div>
    <p class="text-sm font-medium">{{ title }}</p>
    <p v-if="description" class="max-w-sm text-xs text-muted-foreground">{{ description }}</p>
    <div v-if="$slots.action" class="mt-2">
      <slot name="action" />
    </div>
  </div>
</template>
