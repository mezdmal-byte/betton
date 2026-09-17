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

const widths = [
  [320, 700],
  [360, 800],
  [390, 844],
  [430, 900],
]

await fs.mkdir('ui-shots', { recursive: true })
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 1 })

async function openStory(id) {
  await page.goto(`http://127.0.0.1:6006/iframe.html?id=${id}&viewMode=story`, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}' })
  const shell = page.getByTestId('phone-shell')
  await shell.waitFor({ state: 'visible' })
  return shell
}

for (const [id, name] of stories) {
  const shell = await openStory(id)

  for (const [width, height] of widths) {
    await shell.evaluate((node, size) => {
      node.style.setProperty('--shell-width', `${size.width}px`)
      node.style.setProperty('--shell-height', `${size.height}px`)
    }, { width, height })
    const overflow = await shell.evaluate((node) => node.scrollWidth > node.clientWidth + 1)
    if (overflow) throw new Error(`${name} overflows horizontally at ${width}px`)
  }

  await shell.evaluate((node) => {
    node.style.setProperty('--shell-width', '390px')
    node.style.setProperty('--shell-height', '844px')
  })
  await page.evaluate(() => document.documentElement.removeAttribute('data-theme'))
  await shell.screenshot({ path: `ui-shots/${name}-390.png` })

  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'))
  await shell.screenshot({ path: `ui-shots/${name}-390-dark.png` })
}

await browser.close()
