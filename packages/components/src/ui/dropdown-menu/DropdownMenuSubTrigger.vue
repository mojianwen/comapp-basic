<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { DropdownMenuSubTrigger } from 'reka-ui'
import { ChevronRight } from 'lucide-vue-next'
import { cn } from '../../lib/utils'

const props = defineProps<{ class?: HTMLAttributes['class'] }>()
</script>

<template>
  <DropdownMenuSubTrigger
    :class="
      cn(
        'flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
        'focus:bg-muted data-[state=open]:bg-muted',
        props.class,
      )
    "
  >
    <slot />
    <ChevronRight class="ml-auto h-4 w-4" />
  </DropdownMenuSubTrigger>
</template>
