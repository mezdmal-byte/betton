import { test, expect } from '@playwright/test'
import { createHmac } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { resolve } from 'node:path'

test('Telegram SIM menu opens its own API and six selectable demo guarantors', async ({ page }) => {
  test.skip(!process.env.BETTON_TELEGRAM_EXISTING, 'Requires the separately launched local Telegram simulator')
  const record = JSON.parse(readFileSync(resolve('../.ux-preview/telegram-simulation-runtime/verification.json'), 'utf8'))
  expect(new URL(record.url).hostname.endsWith('.trycloudflare.com')).toBe(true)
  const config = readFileSync(resolve(homedir(), 'betton/.local-preserve/pr22-d83d355/.telegram-test/credentials.env'), 'utf8')
  const value = (key: string) => config.match(new RegExp('^' + key + '=(.*)$', 'm'))![1].trim().replace(/^['"]|['"]$/g, '')
  const user = { id: Number(value('ADMIN_TELEGRAM_IDS')), first_name: 'Test' }
  const fields = { auth_date: String(Math.floor(Date.now()/1000)), user: JSON.stringify(user) }
  const secret = createHmac('sha256', 'WebAppData').update(value('BOT_TOKEN')).digest()
  const check = Object.entries(fields).sort().map(([k,v]) => `${k}=${v}`).join('\n')
  const initData = new URLSearchParams({ ...fields, hash: createHmac('sha256', secret).update(check).digest('hex') }).toString()
  // Emulate only the Telegram host; all app/API traffic uses the actual public tunnel and normal HMAC.
  await page.route('https://telegram.org/js/telegram-web-app.js', route => route.fulfill({
    contentType: 'application/javascript', body: `window.Telegram={WebApp:{initData:${JSON.stringify(initData)},initDataUnsafe:{user:${JSON.stringify(user)}},ready(){},expand(){},onEvent(){},offEvent(){}}}`,
  }))
  await page.addInitScript(() => {
    localStorage.setItem('betton.onboarding.v1', 'done'); localStorage.setItem('betton.locale', 'ru')
  })
  let directoryUrl = ''
  page.on('request', request => { if (new URL(request.url()).pathname === '/guarantors') directoryUrl = request.url() })
  await page.goto(record.url)
  await expect(page).toHaveURL(new RegExp('/v2/\\?betton_sim=' + record.identity))
  await page.getByRole('button', { name:'Создать', exact:true }).click()
  await page.getByRole('radio', { name:/^Частное с гарантом/ }).click()
  await page.getByRole('button', { name:'Продолжить', exact:true }).click()
  await page.locator('#event-question').fill('ТЕСТ: проверка доступности гарантов через публичный вход?')
  await page.locator('#event-outcomeA').fill('Да'); await page.locator('#event-outcomeB').fill('Нет')
  await page.getByRole('button', { name:'Далее', exact:true }).click()
  await page.locator('#event-rules').fill('Проверить тестовый протокол для каждого исхода')
  await page.locator('#event-method').fill('Сопоставить условия с итоговым протоколом')
  const end = new Date(Date.now()+86400000).toISOString().slice(0,16)
  await page.locator('#event-closeAt').fill(end); await page.locator('#event-endsAt').fill(end)
  await page.getByRole('button', { name:'Проверить событие', exact:true }).click()
  await page.getByRole('button', { name:'Выбрать гаранта', exact:true }).click()
  const choices = page.locator('button[aria-pressed]').filter({ hasText:'ТЕСТ ·' })
  await expect(choices).toHaveCount(6)
  for (const choice of await choices.all()) await expect(choice).toBeEnabled()
  expect(new URL(directoryUrl).origin).toBe(record.api)
  await expect(page.getByText(/Гарантов пока нет/)).toHaveCount(0)
})
