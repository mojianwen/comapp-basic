import { computed } from 'vue'
import { hasAnyPermission, hasPermission, useAuth } from '../stores/auth'

/**
 * 权限组合式函数：与 v-permission 指令同源（stores/auth）
 * 用法：
 *   const { has, hasAny, permissions } = usePermission()
 *   has('monitor:view') // boolean（响应式）
 */
export function usePermission() {
  const auth = useAuth()
  return {
    has: (code: string) => hasPermission(code),
    hasAny: (codes: string[]) => hasAnyPermission(codes),
    permissions: computed(() => auth.user?.permissions ?? []),
  }
}
