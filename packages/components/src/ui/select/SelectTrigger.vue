<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { SelectTrigger } from 'reka-ui'
import { ChevronDown } from 'lucide-vue-next'
import { cn } from '../../lib/utils'

const props = defineProps<{ class?: HTMLAttributes['class'] }>()
</script>

<template>
  <SelectTrigger
    :class="
      cn(
        'flex h-9 w-full items-center justify-between gap-2 whitespace-nowrap rounded-md border border-input bg-muted/40 px-3 py-2 text-sm shadow-sm',
        'data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring',
        'disabled:cursor-not-allowed disabled:opacity-50 [&>span]:truncate [&>span]:text-foreground',
        props.class,
      )
    "
  >
    <slot />
    <ChevronDown class="h-4 w-4 shrink-0 opacity-50" />
  </SelectTrigger>
</template>
