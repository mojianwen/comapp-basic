<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { DropdownMenuContent, DropdownMenuPortal } from 'reka-ui'
import { cn } from '../../lib/utils'

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes['class']
    sideOffset?: number
    align?: 'start' | 'center' | 'end'
  }>(),
  { sideOffset: 4, align: 'start' },
)
</script>

<template>
  <DropdownMenuPortal>
    <DropdownMenuContent
      :side-offset="sideOffset"
      :align="align"
      :class="
        cn(
          'z-50 min-w-32 overflow-hidden rounded-md border border-border bg-card p-1 text-foreground shadow-lg',
          props.class,
        )
      "
    >
      <slot />
    </DropdownMenuContent>
  </DropdownMenuPortal>
</template>
