import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir:'./core-tests',workers:1,retries:0,timeout:30000,reporter:'list',
  use:{baseURL:'http://127.0.0.1:8891',browserName:'chromium',viewport:{width:390,height:844},trace:'off',video:'off'},
  webServer:{command:'node node_modules/vite/bin/vite.js --config vite.core.config.ts',url:'http://127.0.0.1:8891/prototypes/core/',reuseExistingServer:true},
})
