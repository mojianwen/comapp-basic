<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '../../lib/utils'

const props = defineProps<{ class?: HTMLAttributes['class'] }>()
</script>

<template>
  <th
    :class="
      cn(
        'h-11 border-b border-border bg-muted/60 px-3 text-left align-middle text-xs font-semibold tracking-wide text-foreground/80',
        'first:rounded-tl-lg last:rounded-tr-lg',
        props.class,
      )
    "
  >
    <slot />
  </th>
</template>
