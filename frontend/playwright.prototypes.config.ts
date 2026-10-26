import { defineConfig } from '@playwright/test'
export default defineConfig({testDir:'./prototype-tests',workers:2,retries:0,timeout:30000,reporter:'list',
  outputDir:'../.ux-preview/onboarding-test-results',use:{baseURL:'http://127.0.0.1:8886',browserName:'chromium',actionTimeout:6000},
  webServer:process.env.BETTON_PROTOTYPE_EXISTING?undefined:{command:'node node_modules/vite/bin/vite.js --config vite.prototypes.config.ts',url:'http://127.0.0.1:8886/prototypes/onboarding/index.html',reuseExistingServer:false,timeout:30000}})
