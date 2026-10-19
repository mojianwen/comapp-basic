import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// 单文件构建配置：所有 JS/CSS 内联进一个 HTML，供静态预览直接打开
export default defineConfig({
  plugins: [vue(), tailwindcss(), viteSingleFile()],
  base: './',
  build: {
    outDir: 'dist-single',
    emptyOutDir: true,
  },
})
