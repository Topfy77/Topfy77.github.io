import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/project_Bus/', // 👈 ต้องตรงกับชื่อ repo บน GitHub
})
