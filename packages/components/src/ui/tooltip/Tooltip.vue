<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { TooltipProvider, TooltipRoot } from 'reka-ui'
import { cn } from '../../lib/utils'

const props = defineProps<{
  delayDuration?: number
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <TooltipProvider :delay-duration="delayDuration ?? 200">
    <TooltipRoot :class="cn('outline-none', props.class)">
      <slot />
    </TooltipRoot>
  </TooltipProvider>
</template>
