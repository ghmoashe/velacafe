import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('src/i18nData.ts')) {
            return 'i18n'
          }
          if (id.includes('node_modules/@supabase/')) {
            return 'supabase'
          }
        },
      },
    },
  },
})
