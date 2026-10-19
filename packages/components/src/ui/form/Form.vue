<script setup lang="ts">
import { provide, ref } from 'vue'
import type { HTMLAttributes } from 'vue'
import { cn } from '../../lib/utils'
import { FORM_KEY, validateValue, type FormContext, type Rules } from './form'

/**
 * 表单容器：传入响应式 model 与 rules，向 FormItem 提供校验上下文
 * 通过 ref 调用 validate()（返回是否全部通过）或 validateField(prop)
 */
const props = defineProps<{
  model: Record<string, unknown>
  rules?: Rules
  class?: HTMLAttributes['class']
}>()

const attempt = ref(0)

async function validateField(prop: string): Promise<true | string> {
  const rules = props.rules?.[prop] ?? []
  return validateValue(props.model[prop], rules, props.model)
}

/** 全量校验：触发所有 FormItem 显示错误，返回是否通过 */
async function validate(): Promise<boolean> {
  attempt.value++
  const fields = Object.keys(props.rules ?? {})
  const results = await Promise.all(fields.map((p) => validateField(p)))
  return results.every((r) => r === true)
}

provide<FormContext>(FORM_KEY, {
  model: props.model,
  rules: props.rules ?? {},
  validateField,
  attempt,
})

defineExpose({ validate, validateField })
</script>

<template>
  <form :class="cn('space-y-4', props.class)" novalidate @submit.prevent>
    <slot />
  </form>
</template>
