import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/digital-rage-room/',
  plugins: [react()],
  server: {
    allowedHosts: ['5173-bppqttbl2.apps.run.brev.nvidia.com']
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
  },
})
