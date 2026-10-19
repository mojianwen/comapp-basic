<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { TooltipTrigger } from 'reka-ui'
import { cn } from '../../lib/utils'

const props = defineProps<{
  asChild?: boolean
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <TooltipTrigger :as-child="asChild ?? false" :class="cn('outline-none', props.class)">
    <slot />
  </TooltipTrigger>
</template>
