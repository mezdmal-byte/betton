import { defineConfig } from '@playwright/test'
const port=Number(process.env.BETTON_RELEASE_PORT ?? 8877)
if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('BETTON_RELEASE_PORT must be an unprivileged local port')
const baseURL=`http://127.0.0.1:${port}`
export default defineConfig({
  testDir:'./release-tests', workers:1, retries:0, timeout:90000,
  reporter:'list', use:{baseURL,browserName:'chromium',trace:'off',video:'off',actionTimeout:10000},
  projects:[{name:'mobile-light',use:{viewport:{width:390,height:844},colorScheme:'light'}},{name:'mobile-dark',use:{viewport:{width:430,height:932},colorScheme:'dark'}}],
  webServer:{command:`python ../scripts/recovery_preview.py --port ${port} --state-dir ../.ux-preview/ci-integration-browser-${port}`,url:baseURL+'/sandbox/session',reuseExistingServer:false,timeout:180000},
})
