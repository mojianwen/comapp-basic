<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { SelectContent, SelectPortal } from 'reka-ui'
import { cn } from '../../lib/utils'

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class']
    position?: 'popper' | 'item-aligned'
    sideOffset?: number
  }>(),
  { position: 'popper', sideOffset: 4 },
)
</script>

<template>
  <SelectPortal>
    <SelectContent
      :position="position"
      :side-offset="sideOffset"
      :class="
        cn(
          'relative z-50 max-h-96 min-w-32 overflow-hidden rounded-md border border-border bg-card text-foreground shadow-lg',
          props.class,
        )
      "
    >
      <slot />
    </SelectContent>
  </SelectPortal>
</template>
