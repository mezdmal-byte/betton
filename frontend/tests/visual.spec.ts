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
