<script setup lang="ts">
import { computed, inject, ref, watch } from 'vue'
import type { HTMLAttributes } from 'vue'
import { cn } from '../../lib/utils'
import { FORM_KEY } from './form'

/**
 * 表单字段：包裹任意输入组件（Input/Textarea/RadioGroup/Select...）
 * - prop 对应 model 中的字段名
 * - 校验时机：字段失焦后实时校验 + Form.validate() 全量校验
 * - 错误文案显示在字段下方（text-destructive）
 */
const props = defineProps<{
  prop?: string
  label?: string
  /** 强制显示必填星号（不传时按 rules 自动判断） */
  required?: boolean
  class?: HTMLAttributes['class']
}>()

const ctx = inject(FORM_KEY, null)
const error = ref<string | null>(null)
const touched = ref(false)

async function check() {
  if (!ctx || !props.prop) return
  const result = await ctx.validateField(props.prop)
  error.value = result === true ? null : result
}

// 字段值变化：已触碰过则实时复检（输入修正后错误即时消失）
watch(
  () => (ctx && props.prop ? ctx.model[props.prop] : undefined),
  () => {
    if (touched.value) check()
  },
)

// Form.validate() 提交尝试：全字段校验
watch(
  () => ctx?.attempt.value,
  () => {
    touched.value = true
    check()
  },
)

const isRequired = computed(() => {
  if (props.required) return true
  return !!props.prop && !!(ctx?.rules[props.prop] ?? []).some((r) => r.required)
})

function onBlur() {
  touched.value = true
  check()
}
</script>

<template>
  <div :class="cn('space-y-1.5', props.class)" @blur.capture="onBlur">
    <label v-if="label" class="flex items-center gap-1 text-sm font-medium">
      <span v-if="isRequired" class="text-destructive">*</span>
      {{ label }}
    </label>
    <slot />
    <p v-if="error" class="text-xs text-destructive" role="alert">{{ error }}</p>
  </div>
</template>
