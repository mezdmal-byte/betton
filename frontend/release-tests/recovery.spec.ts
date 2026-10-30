import { test, expect, type Page } from '@playwright/test'
import { randomUUID } from 'node:crypto'

test.beforeEach(async ({context}, info) => {
  // The local Telegram simulator defaults to light; choose the actual app theme explicitly.
  const scheme = info.project.use.colorScheme === 'dark' ? 'dark' : 'light'
  await context.addInitScript(value => localStorage.setItem('betton.theme', value), scheme)
})

async function open(page:Page) {
  await page.addInitScript(()=>localStorage.setItem('betton.onboarding.v1','done'))
  await page.goto('/sandbox/?actor=creator')
  await expect(page.locator('html')).toHaveAttribute('data-theme',test.info().project.use.colorScheme === 'dark' ? 'dark' : 'light')
  const session=await (await page.request.get('/sandbox/session?actor=creator')).json()
  const headers={Authorization:'tma '+session.init_data}
  const actor=await (await page.request.post('/auth/telegram',{headers})).json()
  return {headers,userId:actor.id,marketId:session.sandbox.public_event_id}
}
async function own(page:Page) {
  await page.getByText('Тест: кто победит в финальном матче?',{exact:true}).first().click()
  await page.getByRole('button',{name:'Свой коэффициент',exact:true}).click()
}
async function store(page:Page,userId:number,marketId:number,requestId:string) {
  await page.evaluate(({userId,marketId,requestId})=>{
    localStorage.setItem(`betton:order-intent:v1:${userId}`,JSON.stringify({userId,marketId,requestId,createdAt:Date.now(),body:{outcome:0,money:'10',odds:2,kind:'limit'}}))
    window.dispatchEvent(new Event('betton:order-intent'))
  },{userId,marketId,requestId})
}

test('committed POST with lost response survives closing/reopening the page without another debit',async({page,context},info)=>{
  const {headers,userId,marketId}=await open(page)
  const notices=await (await page.request.get('/notifications',{headers})).json()
  const notice=notices.find((n:{read:boolean})=>!n.read)
  expect(notice).toBeTruthy() // Real approval notification must not cover monetary recovery.
  const before=await (await page.request.get(`/users/${userId}`,{headers})).json()
  const requestId=randomUUID()
  await store(page,userId,marketId,requestId)
  await page.route(`**/markets/${marketId}/orders`,async route=>{await route.fetch();await route.abort('failed')})
  await page.evaluate(async({marketId,requestId})=>{
    try { await fetch(`/markets/${marketId}/orders`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'tma '+window.Telegram!.WebApp!.initData},body:JSON.stringify({outcome:0,money:'10',odds:2,kind:'limit',request_id:requestId})}) } catch { /* deliberately lost response */ }
  },{marketId,requestId})
  await page.close()
  const reopened=await context.newPage();await open(reopened);await own(reopened)
  await expect(reopened.getByText('Результат операции подтверждён',{exact:true})).toBeVisible()
  await expect(reopened.getByRole('complementary')).toHaveCount(0)
  await reopened.screenshot({path:info.outputPath('recovered.png')})
  await reopened.getByRole('button',{name:'Продолжить',exact:true}).click()
  await expect(reopened.getByRole('complementary')).toBeVisible()
  const remainingNotices=await (await reopened.request.get('/notifications',{headers})).json()
  expect(remainingNotices.find((n:{id:number})=>n.id===notice.id).read).toBe(false)
  expect(await reopened.evaluate(uid=>localStorage.getItem(`betton:order-intent:v1:${uid}`),userId)).toBeNull()
  const after=await (await reopened.request.get(`/users/${userId}`,{headers})).json()
  expect(before.balance-after.balance).toBe(10)
  const orders=await (await reopened.request.get(`/users/${userId}/orders`,{headers})).json()
  expect(orders.filter((o:{request_id:string})=>o.request_id===requestId)).toHaveLength(1)
})

test('offline unresolved intent is checked after reload, then explicitly retried with original key',async({page,context})=>{
  const {headers,userId,marketId}=await open(page)
  await own(page)
  const before=await (await page.request.get(`/users/${userId}`,{headers})).json()
  const requestId=randomUUID()
  await context.setOffline(true);await store(page,userId,marketId,requestId)
  await expect(page.getByText('Не удалось определить результат. Проверьте историю перед повторной попыткой.',{exact:true})).toBeVisible()
  await context.setOffline(false);await page.reload();await own(page)
  const status=await page.request.get(`/users/${userId}/orders/by-request/${requestId}`,{headers})
  expect(status.status()).toBe(404)
  await page.getByRole('button',{name:'Повторить прежнее предложение',exact:true}).click()
  await expect(page.getByText('Результат операции подтверждён',{exact:true})).toBeVisible()
  await page.getByRole('button',{name:'Продолжить',exact:true}).click()
  const after=await (await page.request.get(`/users/${userId}`,{headers})).json()
  expect(before.balance-after.balance).toBe(10)
  const result=await (await page.request.get(`/users/${userId}/orders/by-request/${requestId}`,{headers})).json()
  expect(result.amount).toBe(10);expect(result.request_id).toBe(requestId)
})


test('informational Wallet V1 stays read-only and returns to its actual parent',async({page})=>{
  await open(page)
  await page.getByRole('navigation',{name:'Основная навигация'}).getByRole('button',{name:'Профиль'}).click()
  await page.getByRole('navigation',{name:'Профиль'}).getByRole('button',{name:'Кошелёк'}).click()
  await expect(page.getByRole('heading',{name:'Кошелёк'})).toBeVisible()
  await expect(page.getByText('Кошелёк пока не подключён. Не отправляйте средства.')).toBeVisible()
  await expect(page.getByText('Адрес',{exact:true})).toBeVisible()
  await expect(page.getByText('Недоступен',{exact:true})).toBeVisible()

  // The network selector is informational and must not start any transaction.
  await page.getByRole('button',{name:/^Сеть/}).click()
  await expect(page.getByRole('dialog',{name:'Сеть'})).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog',{name:'Сеть'})).not.toBeVisible()
  await expect(page.getByRole('heading',{name:'Кошелёк'})).toBeVisible()

  await page.getByRole('button',{name:'Пополнить',exact:true}).click()
  await expect(page.getByRole('heading',{name:'Пополнение'})).toBeVisible()
  await expect(page.getByText('Пополнение пока недоступно. Не отправляйте средства.')).toBeVisible()
  await page.getByRole('button',{name:'Назад',exact:true}).click()
  await expect(page.getByRole('heading',{name:'Кошелёк'})).toBeVisible()

  await page.getByRole('button',{name:'Вывести',exact:true}).click()
  await expect(page.getByRole('heading',{name:'Вывод'})).toBeVisible()
  await expect(page.getByText('Вывод пока недоступен. Операция не создана.')).toBeVisible()
  await page.getByRole('button',{name:'Вернуться',exact:true}).click()
  await expect(page.getByRole('heading',{name:'Кошелёк'})).toBeVisible()

  await page.getByRole('button',{name:'Подключить позже',exact:true}).click()
  await expect(page.locator('[data-figma-frame="819:61952"]')).toBeVisible()
})
