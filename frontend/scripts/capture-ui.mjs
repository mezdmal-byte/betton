import { chromium } from '@playwright/test'
import fs from 'node:fs/promises'

const stories = [
  ['screens-markets--default', 'markets'],
  ['screens-filtersheet--open', 'filters'],
  ['screens-marketdetail--default', 'market-detail'],
  ['screens-quicktrade--default', 'quick-trade'],
  ['screens-ownprice--default', 'own-price'],
  ['screens-createmarket--default', 'create-market'],
  ['screens-createresult--by-link', 'create-result'],
  ['screens-portfolio--default', 'portfolio'],
  ['screens-profile--default', 'profile'],
  ['screens-wallet--default', 'wallet'],
]

await fs.mkdir('ui-shots', { recursive: true })
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 1 })

for (const [id, name] of stories) {
  await page.goto(`http://127.0.0.1:6006/iframe.html?id=${id}&viewMode=story`, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  const shell = page.getByTestId('phone-shell')
  await shell.waitFor({ state: 'visible' })
  await shell.evaluate((node) => {
    node.style.setProperty('--shell-width', '390px')
    node.style.setProperty('--shell-height', '844px')
  })
  await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}' })
  await shell.screenshot({ path: `ui-shots/${name}-390.png` })
}

await browser.close()
