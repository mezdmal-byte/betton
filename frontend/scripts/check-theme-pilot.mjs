import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { chromium } from 'playwright'

const frontend = fileURLToPath(new URL('../', import.meta.url))
const output = fileURLToPath(new URL('../../docs/design/theme-pilot/screenshots/', import.meta.url))
await mkdir(output, { recursive: true })
const server = await createServer({ root: frontend, configFile: `${frontend}vite.pilot.config.ts` })
await server.listen()
const browser = await chromium.launch({
  ...(process.env.PILOT_BROWSER_PATH ? { executablePath: process.env.PILOT_BROWSER_PATH } : {}),
  args: ['--font-render-hinting=none', '--disable-lcd-text', ...(process.env.PILOT_SINGLE_PROCESS === '1' ? ['--no-sandbox', '--single-process', '--no-zygote'] : [])],
})
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })
const errors = []
const requests = []
page.on('pageerror', error => errors.push(error.message))
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
page.on('request', request => requests.push({ url: request.url(), type: request.resourceType(), method: request.method() }))
const base = 'http://127.0.0.1:4173/prototypes/figma-theme-pilot.html'
const screens = ['markets', 'detail', 'quick', 'portfolio']
const layouts = {}

async function open(screen = 'markets', theme = 'dark', compare = true) {
  await page.goto(`${base}?theme=${theme}&screen=${screen}${compare ? '&compare=1' : ''}`)
  await page.evaluate(() => document.fonts.ready)
  await page.locator('h1').waitFor()
}

try {
  for (const width of [390, 360, 430]) {
    await page.setViewportSize({ width, height: 844 })
    for (const theme of ['dark', 'light']) {
      for (const screen of screens) {
        await open(screen, theme)
        assert.equal(await page.locator('html').getAttribute('data-theme'), theme)
        const layout = await page.evaluate(() => {
          const shell = document.querySelector('[data-testid="app-shell"]')
          const all = [...shell.querySelectorAll('main > *, header, nav, h1')]
          return {
            width: innerWidth,
            documentWidth: document.documentElement.scrollWidth,
            overflowing: [...shell.querySelectorAll('main, main > *, nav')].filter(el => el.scrollWidth > el.clientWidth + 1).map(el => el.className),
            boxes: all.map(el => {
              const r = el.getBoundingClientRect()
              return { class: el.className, x: r.x, y: r.y, width: r.width, height: r.height }
            }),
          }
        })
        assert.equal(layout.documentWidth, width, `${screen}/${theme}/${width}: horizontal page overflow`)
        assert.deepEqual(layout.overflowing, [], `${screen}/${theme}/${width}: content overflow`)
        layouts[`${width}-${theme}-${screen}`] = layout
        if (width === 390) await page.screenshot({ path: `${output}${theme}-${screen}.png`, animations: 'disabled', caret: 'hide' })
        if (theme === 'light') assert.deepEqual(layout, layouts[`${width}-dark-${screen}`], `${screen}/${width}: theme changed layout`)
      }
    }
  }

  await page.setViewportSize({ width: 390, height: 844 })
  await open('markets', 'dark', false)
  const timeOrigin = await page.evaluate(() => performance.timeOrigin)
  await page.getByRole('button', { name: 'Light', exact: true }).click()
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'light')
  assert.equal(await page.evaluate(() => performance.timeOrigin), timeOrigin, 'theme reloaded the page')
  assert.equal(new URL(page.url()).searchParams.get('theme'), 'light')
  await page.getByRole('button', { name: 'TON войдёт в топ‑5 криптовалют до конца 2026?', exact: true }).click()
  assert.equal(new URL(page.url()).searchParams.get('screen'), 'detail')
  await page.getByRole('button', { name: 'Купить ДА', exact: true }).click()
  assert.equal(new URL(page.url()).searchParams.get('screen'), 'quick')
  await page.getByRole('button', { name: 'Назад к рынку', exact: true }).click()
  assert.equal(new URL(page.url()).searchParams.get('screen'), 'detail')
  await page.getByRole('button', { name: 'Назад к рынкам', exact: true }).click()
  await page.getByRole('button', { name: 'Portfolio', exact: true }).click()
  assert.equal(new URL(page.url()).searchParams.get('screen'), 'portfolio')
  for (const destination of ['Create', 'Notifications', 'Profile']) {
    await page.getByRole('button', { name: destination, exact: true }).click()
    assert.equal(await page.getByText('Not included in UI pilot', { exact: true }).isVisible(), true)
  }
  await page.getByRole('button', { name: 'Markets', exact: true }).click()
  await page.getByRole('button', { name: 'Dark', exact: true }).click()
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark')
  await page.screenshot({ path: `${output}developer-toggle.png` })
  await page.goBack()
  assert.equal(new URL(page.url()).searchParams.get('screen'), 'profile')
  await page.reload()
  assert.equal(await page.locator('html').getAttribute('data-theme'), new URL(page.url()).searchParams.get('theme'))
  await open('quick', 'dark', false)
  await page.getByRole('button', { name: 'Проверить покупку', exact: true }).click()
  assert.equal(await page.getByRole('status').isVisible(), true)
  assert.equal(await page.getByRole('textbox').getAttribute('readonly'), '')
  assert.deepEqual(errors, [], 'browser console/page errors')
  assert.deepEqual(requests.filter(r => r.type === 'fetch' || r.type === 'xhr' || r.method !== 'GET' || !r.url.startsWith('http://127.0.0.1:4173/')), [], 'pilot made an API or external request')
  const report = { viewports: [360, 390, 430], height: 844, themes: ['dark', 'light'], screens, browser: await browser.version(), checks: ['24 screen/theme/viewport renders', 'identical layout across themes', 'no horizontal overflow', 'instant theme without reload', 'Markets → Detail → Quick → Detail', 'five navigation destinations', 'browser Back and refresh', 'fixed quote/no transaction', 'no API/external requests', 'no console errors'], layouts }
  await writeFile(`${output}../verification.json`, JSON.stringify(report, null, 2) + '\n')
  console.log(JSON.stringify({ result: 'PASS', checks: report.checks, screenshots: output }, null, 2))
} finally {
  await browser.close()
  await server.close()
}
