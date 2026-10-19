import type { InjectionKey, Ref } from 'vue'

/**
 * 轻量表单校验（零依赖）
 * 规则支持：required / min / max / pattern / validator（同步或异步）
 * API 仿 antd 风格：Form 传 model + rules，FormItem 传 prop 定位字段
 */

/** 校验规则；validator 返回 true 表示通过，返回 string 表示错误文案 */
export interface FormRule {
  required?: boolean
  /** 字符串最小长度 / 数值最小值 */
  min?: number
  /** 字符串最大长度 / 数值最大值 */
  max?: number
  /** 正则校验 */
  pattern?: RegExp
  /** 覆盖默认错误文案 */
  message?: string
  /** 自定义校验器，支持返回 Promise（异步校验） */
  validator?: (
    value: unknown,
    model: Record<string, unknown>,
  ) => true | string | Promise<true | string>
}

export type Rules = Record<string, FormRule[]>

export interface FormContext {
  model: Record<string, unknown>
  rules: Rules
  validateField: (prop: string) => Promise<true | string>
  /** 提交尝试计数：Form.validate() 时自增，FormItem 监听后触发整字段校验 */
  attempt: Ref<number>
}

export const FORM_KEY: InjectionKey<FormContext> = Symbol('mo-form')

function isEmpty(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  )
}

/** 按规则逐条校验，返回 true（通过）或错误文案 */
export async function validateValue(
  value: unknown,
  rules: FormRule[],
  model: Record<string, unknown>,
): Promise<true | string> {
  for (const rule of rules) {
    if (rule.required && isEmpty(value)) {
      return rule.message ?? '该字段为必填项'
    }
    if (!isEmpty(value)) {
      if (rule.min !== undefined) {
        if (typeof value === 'number' && value < rule.min) {
          return rule.message ?? `不能小于 ${rule.min}`
        }
        if (typeof value === 'string' && [...value].length < rule.min) {
          return rule.message ?? `长度不能少于 ${rule.min} 个字符`
        }
      }
      if (rule.max !== undefined) {
        if (typeof value === 'number' && value > rule.max) {
          return rule.message ?? `不能大于 ${rule.max}`
        }
        if (typeof value === 'string' && [...value].length > rule.max) {
          return rule.message ?? `长度不能超过 ${rule.max} 个字符`
        }
      }
      if (rule.pattern && !rule.pattern.test(String(value))) {
        return rule.message ?? '格式不正确'
      }
    }
    if (rule.validator) {
      const result = await rule.validator(value, model)
      if (result !== true) {
        return typeof result === 'string' ? result : (rule.message ?? '校验未通过')
      }
    }
  }
  return true
}
