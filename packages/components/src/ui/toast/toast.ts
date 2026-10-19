import { reactive } from 'vue'

export type ToastVariant = 'default' | 'success' | 'error' | 'warning'

export interface ToastItem {
  id: number
  title: string
  description?: string
  variant?: ToastVariant
}

const state = reactive<{ items: ToastItem[] }>({ items: [] })
let seq = 0

export function useToasts() {
  return state
}

export function dismissToast(id: number) {
  const i = state.items.findIndex((t) => t.id === id)
  if (i > -1) state.items.splice(i, 1)
}

/** 弹一条 Toast，默认 4 秒自动消失 */
export function toast(t: Omit<ToastItem, 'id'>, duration = 4000) {
  const id = ++seq
  state.items.push({ id, ...t })
  if (duration > 0) setTimeout(() => dismissToast(id), duration)
  return id
}
