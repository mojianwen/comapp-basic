<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { DropdownMenuPortal, DropdownMenuSubContent } from 'reka-ui'
import { cn } from '../../lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
  sideOffset?: number
}>()
</script>

<template>
  <DropdownMenuPortal>
    <DropdownMenuSubContent
      :side-offset="sideOffset ?? 4"
      :class="
        cn(
          'z-50 min-w-32 overflow-hidden rounded-md border border-border bg-card p-1 text-foreground shadow-lg',
          props.class,
        )
      "
    >
      <slot />
    </DropdownMenuSubContent>
  </DropdownMenuPortal>
</template>
