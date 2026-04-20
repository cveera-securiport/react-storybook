import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  resolve: {
    alias: {
      '@ibc/ui': resolve(__dirname, '../../libs/shared/ui/src'),
      '@ibc/tokens': resolve(__dirname, '../../libs/shared/tokens/src'),
      '@ibc/schema-forms': resolve(__dirname, '../../libs/shared/schema-forms/src'),
    },
  },
  server: {
    port: 5173,
    host: 'localhost',
  },
  build: {
    outDir: '../../dist/apps/demo',
    emptyOutDir: true,
    reportCompressedSize: true,
  },
})
