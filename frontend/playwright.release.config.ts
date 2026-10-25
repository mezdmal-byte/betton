import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir:'./release-tests', workers:1, retries:0, timeout:90000,
  reporter:'list', use:{baseURL:'http://127.0.0.1:8877',browserName:'chromium',trace:'off',video:'off',actionTimeout:10000},
  projects:[{name:'mobile-light',use:{viewport:{width:390,height:844},colorScheme:'light'}},{name:'mobile-dark',use:{viewport:{width:430,height:932},colorScheme:'dark'}}],
  webServer:{command:'python ../scripts/ux_v3_preview.py --state-dir ../.ux-preview/ci-integration-browser',url:'http://127.0.0.1:8877/sandbox/session',reuseExistingServer:false,timeout:180000},
})
