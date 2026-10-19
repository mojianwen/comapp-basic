import { createApp } from 'vue'
import { toast } from '@mo/components'
import App from './App.vue'
import router from './router'
import { vPermission } from './plugins/vPermission'
import './index.css'

const app = createApp(App).use(router)

// 按钮级权限指令
app.directive('permission', vPermission)

// 全局异常兜底：未捕获错误统一记录 + Toast 提示（页面级 try/catch 之外的保险丝）
app.config.errorHandler = (err) => {
  console.error('[全局异常]', err)
  toast({
    variant: 'error',
    title: '页面异常',
    description: err instanceof Error ? err.message : String(err),
  })
}

app.mount('#app')
