<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { TooltipContent, TooltipPortal } from 'reka-ui'
import { cn } from '../../lib/utils'

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class']
    sideOffset?: number
    side?: 'top' | 'right' | 'bottom' | 'left'
  }>(),
  { sideOffset: 6, side: 'top' },
)
</script>

<template>
  <TooltipPortal>
    <TooltipContent
      :side="side"
      :side-offset="sideOffset"
      :class="
        cn(
          'z-50 max-w-64 rounded-md border border-border bg-foreground px-3 py-1.5 text-xs text-background shadow-pop',
          props.class,
        )
      "
    >
      <slot />
    </TooltipContent>
  </TooltipPortal>
</template>
