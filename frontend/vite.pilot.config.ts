import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Independent entry, output and port. Intentionally no API proxy or Telegram SDK.
export default defineConfig({
  base: '/',
  plugins: [react()],
  server: { host: '127.0.0.1', port: 4173, strictPort: true },
  preview: { host: '127.0.0.1', port: 4174, strictPort: true },
  build: {
    outDir: 'dist-theme-pilot',
    rollupOptions: {
      input: fileURLToPath(new URL('./prototypes/figma-theme-pilot.html', import.meta.url)),
    },
  },
})
