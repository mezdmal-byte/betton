import { chromium } from '@playwright/test'
import fs from 'node:fs/promises'

const stories = [
  ['screens-markets--default', 'markets'],
  ['screens-filtersheet--open', 'filters'],
  ['screens-marketdetail--default', 'market-detail'],
  ['screens-marketdetail--empty-order-book', 'market-detail-empty-book'],
  ['screens-marketdetail--closed', 'market-detail-closed'],
  ['screens-marketdetail--resolved', 'market-detail-resolved'],
  ['screens-marketdetail--cancelled', 'market-detail-cancelled'],
  ['screens-marketdetail--loading', 'market-detail-loading'],
  ['screens-marketdetail--network-error', 'market-detail-network-error'],
  ['screens-quicktrade--default', 'quick-trade'],
  ['screens-quicktrade--no-liquidity', 'quick-trade-no-liquidity'],
  ['screens-quicktrade--partial', 'quick-trade-partial'],
  ['screens-quicktrade--stale-quote', 'quick-trade-stale'],
  ['screens-ownprice--default', 'own-price'],
  ['screens-ownprice--partial-fill', 'own-price-partial'],
  ['screens-ownprice--pending', 'own-price-pending'],
  ['screens-createmarket--default', 'create-market'],
  ['screens-createresult--by-link', 'create-result'],
  ['screens-createresult--pending', 'create-result-pending'],
  ['screens-portfolio--default', 'portfolio'],
  ['screens-portfolio--empty', 'portfolio-empty'],
  ['screens-profile--default', 'profile'],
  ['screens-profile--guest', 'profile-guest'],
  ['screens-notifications--unread', 'notifications'],
  ['screens-notifications--empty', 'notifications-empty'],
  ['screens-activity--default', 'activity'],
  ['screens-activity--empty', 'activity-empty'],
  ['screens-myevents--default', 'my-events'],
  ['screens-publicprofile--default', 'public-profile'],
  ['screens-moderation--default', 'moderation'],
  ['screens-help--default', 'help'],
  ['screens-wallet--default', 'wallet'],
  ['screens-wallet--withdraw', 'wallet-withdraw'],
  ['screens-wallet--solana-deposit', 'wallet-solana'],
  ['screens-wallet--solana-withdraw', 'wallet-solana-withdraw'],
  ['screens-onboarding--default', 'onboarding'],
  ['screens-authexpired--default', 'auth-expired'],
  ['screens-systemstate--network-error', 'network-error'],
  ['screens-systemstate--loading', 'loading'],
]

const widths = [[320, 700], [360, 800], [390, 844], [430, 900]]
await fs.mkdir('ui-shots', { recursive: true })
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 430, height: 932 }, deviceScaleFactor: 1 })
async function openStory(id) { await page.goto(`http://127.0.0.1:6006/iframe.html?id=${id}&viewMode=story`, { waitUntil: 'networkidle' }); await page.evaluate(() => document.fonts.ready); await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}' }); const shell = page.getByTestId('phone-shell'); await shell.waitFor({ state: 'visible' }); return shell }
for (const [id, name] of stories) {
  const shell = await openStory(id)
  for (const [width, height] of widths) { await shell.evaluate((node, size) => { node.style.setProperty('--shell-width', `${size.width}px`); node.style.setProperty('--shell-height', `${size.height}px`) }, { width, height }); const overflow = await shell.evaluate((node) => node.scrollWidth > node.clientWidth + 1); if (overflow) throw new Error(`${name} overflows horizontally at ${width}px`) }
  await shell.evaluate((node) => { node.style.setProperty('--shell-width', '390px'); node.style.setProperty('--shell-height', '844px') })
  await page.evaluate(() => document.documentElement.removeAttribute('data-theme'))
  await shell.screenshot({ path: `ui-shots/${name}-390.png` })
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'))
  await shell.screenshot({ path: `ui-shots/${name}-390-dark.png` })
}
await browser.close()
