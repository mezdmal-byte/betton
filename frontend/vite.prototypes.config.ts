import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
export default defineConfig({base:'/', plugins:[react()], server:{host:'127.0.0.1',port:8886,strictPort:true},
  build:{outDir:'../.ux-preview/onboarding-build',emptyOutDir:true,rollupOptions:{input:resolve(import.meta.dirname,'prototypes/onboarding/index.html')}}})
