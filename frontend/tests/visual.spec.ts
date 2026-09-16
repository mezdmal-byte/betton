import { expect, test } from '@playwright/test'

const SCREENS = [
  ['screens-markets--default', 'markets'],
  ['screens-quicktrade--default', 'quicktrade'],
  ['screens-marketdetail--default', 'marketdetail'],
  ['screens-ownprice--default', 'ownprice'],
  ['screens-createmarket--default', 'createmarket'],
  ['screens-portfolio--default', 'portfolio'],
  ['screens-profile--default', 'profile'],
] as const

const NARROW_SCREENS = [
  ['screens-markets--default', 'markets'],
  ['screens-filtersheet--open', 'filtersheet'],
  ['screens-profile--default', 'profile'],
  ['screens-portfolio--history-from-profile', 'history'],
  ['screens-wallet--default', 'wallet'],
  ['screens-createmarket--default', 'create'],
  ['screens-createresult--by-link', 'createresult'],
  ['screens-marketdetail--default', 'marketdetail-chart'],
  ['screens-marketdetail--empty-chart', 'marketdetail-empty-chart'],
  ['screens-marketdetail--order-book', 'marketdetail-book'],
  ['screens-marketdetail--chart-error', 'marketdetail-chart-error'],
  ['screens-marketdetail--admin', 'marketdetail-admin'],
  ['screens-ownprice--default', 'ownprice'],
  ['screens-portfolio--default', 'portfolio'],
] as const

const WIDTHS = [
  [320, 700],
  [360, 800],
  [390, 844],
  [430, 900],
] as const

async function openStory(page: import('@playwright/test').Page, id: string) {
  await page.goto(`/iframe.html?id=${id}&viewMode=story`, { waitUntil: 'networkidle' })
  const shell = page.getByTestId('phone-shell')
  await expect(shell).toBeVisible()
  await page.evaluate(() => document.fonts.ready)
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
        caret-color: transparent !important;
      }
    `,
  })
  return shell
}

test.describe('visual 390x844', () => {
  for (const [id, name] of SCREENS) {
    test(name, async ({ page }) => {
      const shell = await openStory(page, id)
      await expect(shell).toHaveScreenshot(`${name}-390.png`)
    })
  }
})

test.describe('visual 390x844 dark', () => {
  for (const [id, name] of SCREENS) {
    test(`${name} dark`, async ({ page }) => {
      const shell = await openStory(page, id)
      await page.evaluate(() => {
        document.documentElement.setAttribute('data-theme', 'dark')
      })
      await expect(shell).toHaveScreenshot(`${name}-390-dark.png`)
    })
  }
})

test.describe('layout 430x932', () => {
  for (const [id, name] of SCREENS) {
    test(`${name} does not overflow`, async ({ page }) => {
      await page.setViewportSize({ width: 430, height: 932 })
      const wideId = id.replace('--default', '--wide-430')
      const shell = await openStory(page, wideId)
      const box = await shell.boundingBox()
      expect(box?.width).toBe(430)
      expect(box?.height).toBe(932)
      const overflow = await shell.evaluate((node) => node.scrollWidth > node.clientWidth + 1)
      expect(overflow, `${name} should not overflow horizontally`).toBe(false)
    })
  }
})

const LONG_CONTENT = [
  'screens-markets--long-content',
  'screens-marketdetail--long-content',
  'screens-createmarket--long-content',
  'screens-createmarket--keyboard',
  'screens-profile--long-handle',
] as const

test.describe('long content overflow', () => {
  for (const id of LONG_CONTENT) {
    test(`${id} does not overflow`, async ({ page }) => {
      await page.setViewportSize({ width: 430, height: 932 })
      const shell = await openStory(page, id)
      const overflow = await shell.evaluate((node) => node.scrollWidth > node.clientWidth + 1)
      expect(overflow, `${id} should not overflow horizontally`).toBe(false)
    })
  }
})

test.describe('telegram widths no overflow', () => {
  for (const [width, height] of WIDTHS) {
    for (const [id, name] of NARROW_SCREENS) {
      test(`${name} ${width}`, async ({ page }) => {
        await page.setViewportSize({ width, height })
        const shell = await openStory(page, id)
        await shell.evaluate((node, next) => {
          ;(node as HTMLElement).style.setProperty('--shell-width', `${next.width}px`)
          ;(node as HTMLElement).style.setProperty('--shell-height', `${next.height}px`)
        }, { width, height })
        const overflow = await shell.evaluate((node) => node.scrollWidth > node.clientWidth + 1)
        expect(overflow, `${name} ${width} should not overflow horizontally`).toBe(false)
      })
    }
  }
})

test.describe('telegram visual core', () => {
  const shots = [
    ['screens-filtersheet--open', 'filtersheet'],
    ['screens-marketdetail--default', 'marketdetail-chart'],
    ['screens-marketdetail--empty-chart', 'marketdetail-empty'],
    ['screens-marketdetail--order-book', 'marketdetail-book'],
    ['screens-marketdetail--chart-error', 'marketdetail-chart-error'],
    ['screens-createresult--by-link', 'createresult'],
    ['screens-portfolio--history-from-profile', 'history'],
  ] as const
  for (const [id, name] of shots) {
    test(`${name} 390`, async ({ page }) => {
      const shell = await openStory(page, id)
      await expect(shell).toHaveScreenshot(`${name}-390.png`)
    })
    test(`${name} 320`, async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 700 })
      const shell = await openStory(page, id)
      await shell.evaluate((node) => {
        ;(node as HTMLElement).style.setProperty('--shell-width', '320px')
        ;(node as HTMLElement).style.setProperty('--shell-height', '700px')
      })
      await expect(shell).toHaveScreenshot(`${name}-320.png`)
    })
  }
})
