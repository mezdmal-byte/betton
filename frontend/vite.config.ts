import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_DEV_PROXY_TARGET || 'http://127.0.0.1:8000'

  return {
    base: '/v2/',
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
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
