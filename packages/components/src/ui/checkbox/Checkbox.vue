<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { CheckboxIndicator, CheckboxRoot } from 'reka-ui'
import { Check } from 'lucide-vue-next'
import { cn } from '../../lib/utils'

const props = defineProps<{ class?: HTMLAttributes['class'] }>()

const model = defineModel<boolean>({ default: false })
</script>

<template>
  <CheckboxRoot
    :checked="model"
    @update:checked="model = Boolean($event)"
    :class="
      cn(
        'peer h-4 w-4 shrink-0 cursor-pointer rounded-sm border border-primary shadow-sm transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
        props.class,
      )
    "
  >
    <CheckboxIndicator class="flex items-center justify-center text-current">
      <Check class="h-3 w-3" />
    </CheckboxIndicator>
  </CheckboxRoot>
</template>
