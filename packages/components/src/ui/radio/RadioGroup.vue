<script setup lang="ts">
import { RadioGroupItem, RadioGroupRoot } from 'reka-ui'
import type { HTMLAttributes } from 'vue'
import { cn } from '../../lib/utils'

/**
 * 单选组（Reka UI RadioGroup 封装）
 * options: [{ label, value }]，横向排列，选中态用加粗描边圆点表示
 */
export interface RadioOption {
  label: string
  value: string
}

const props = defineProps<{
  options: RadioOption[]
  class?: HTMLAttributes['class']
  disabled?: boolean
}>()

const model = defineModel<string>()
</script>

<template>
  <RadioGroupRoot
    v-model="model"
    :disabled="props.disabled"
    :class="cn('flex flex-wrap items-center gap-x-5 gap-y-2', props.class)"
  >
    <label
      v-for="opt in props.options"
      :key="opt.value"
      class="flex cursor-pointer items-center gap-2 text-sm"
    >
      <RadioGroupItem
        :value="opt.value"
        :class="
          cn(
            'aspect-square h-4 w-4 rounded-full border border-input bg-background shadow-sm transition-all',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'data-[state=checked]:border-[5px] data-[state=checked]:border-primary',
          )
        "
      />
      {{ opt.label }}
    </label>
  </RadioGroupRoot>
</template>
