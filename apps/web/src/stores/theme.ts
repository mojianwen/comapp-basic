import { ref, watchEffect } from 'vue'

const isDark = ref(false)
let inited = false

export function useTheme() {
  return { isDark, toggle: () => (isDark.value = !isDark.value) }
}

/** 应用挂载时调用一次：读 localStorage / 系统偏好并应用 */
export function initTheme() {
  if (inited) return
  inited = true
  const saved = localStorage.getItem('theme')
  isDark.value = saved
    ? saved === 'dark'
    : window.matchMedia('(prefers-color-scheme: dark)').matches
  watchEffect(() => {
    document.documentElement.classList.toggle('dark', isDark.value)
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  })
}
