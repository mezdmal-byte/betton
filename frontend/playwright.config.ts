import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  timeout: 60_000,
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.02,
      scale: 'css',
    },
  },
  use: {
    baseURL: 'http://127.0.0.1:6006',
    browserName: 'chromium',
    colorScheme: 'light',
    deviceScaleFactor: 1,
    viewport: { width: 430, height: 932 },
    trace: 'off',
    video: 'off',
  },
  webServer: {
    command: 'npm run storybook -- --ci --host 127.0.0.1 --port 6006',
    url: 'http://127.0.0.1:6006/iframe.html',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
