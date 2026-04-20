import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@ibc/ui': resolve(__dirname, 'libs/shared/ui/src'),
      '@ibc/tokens': resolve(__dirname, 'libs/shared/tokens/src'),
      '@ibc/schema-forms': resolve(__dirname, 'libs/shared/schema-forms/src'),
    },
  },
})
