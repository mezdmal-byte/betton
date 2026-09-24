import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_DEV_PROXY_TARGET || 'http://127.0.0.1:8000'
  const basePath = env.VITE_BASE_PATH || '/v2/'

  return {
    base: basePath,
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      rollupOptions: {
        input: {
          app: fileURLToPath(new URL('./index.html', import.meta.url)),
          figmaLive: fileURLToPath(new URL('./prototypes/figma-live.html', import.meta.url)),
        },
      },
    },
    server: {
      proxy: {
        '/auth': proxyTarget,
        '/markets': proxyTarget,
        '/users': proxyTarget,
        '/health': proxyTarget,
        '/creators': proxyTarget,
        '/orders': proxyTarget,
        '/moderation': proxyTarget,
      },
    },
  }
})
