import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
export default defineConfig({
  plugins:[react()], base:'/',
  server:{host:'127.0.0.1',port:8891,strictPort:true},
  build:{outDir:'../.ux-preview/core-build',emptyOutDir:true,rollupOptions:{input:resolve(__dirname,'prototypes/core/index.html')}},
})
