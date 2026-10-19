<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { DialogTrigger } from 'reka-ui'
import { cn } from '../../lib/utils'

const props = defineProps<{
  asChild?: boolean
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <DialogTrigger :as-child="asChild ?? false" :class="cn('outline-none', props.class)">
    <slot />
  </DialogTrigger>
</template>
