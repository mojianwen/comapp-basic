<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { SelectValue } from 'reka-ui'
import { cn } from '../../lib/utils'

const props = defineProps<{
  placeholder?: string
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <SelectValue :placeholder="placeholder" :class="cn(props.class)" />
</template>
