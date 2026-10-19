import type { Directive } from 'vue'
import { hasAnyPermission, hasPermission } from '../stores/auth'

/**
 * 按钮级权限指令（静态判定：挂载时检查一次，无权限直接移除元素）
 * 用法：
 *   <Button v-permission="'system:manage'">...</Button>
 *   <Button v-permission="['a:b', 'c:d']">...</Button>
 * 注意：适合登录后权限不变的元素；权限需动态变化时请用 usePermission() + v-if
 */
export const vPermission: Directive<HTMLElement, string | string[]> = {
  mounted(el, binding) {
    const value = binding.value
    const ok = Array.isArray(value) ? hasAnyPermission(value) : hasPermission(value)
    if (!ok) {
      el.remove()
    }
  },
}
