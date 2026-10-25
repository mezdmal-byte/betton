import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './simulation-tests', workers: 1, retries: 0, timeout: 210000,
  reporter: 'list', use: { baseURL: 'http://127.0.0.1:8877', browserName: 'chromium',
    viewport: { width: 390, height: 844 }, colorScheme: 'light', actionTimeout: 12000 },
  webServer: process.env.BETTON_SIM_EXISTING ? undefined : {
    command: '../.venv/Scripts/python.exe -X utf8 ../scripts/ux_v3_preview.py --full-demo --state-dir ../.ux-preview/browser-simulation',
    url: 'http://127.0.0.1:8877/ready', reuseExistingServer: false, timeout: 90000,
  },
})
