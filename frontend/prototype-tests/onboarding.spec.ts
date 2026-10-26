import { test, expect } from '@playwright/test'
import { copy, type Locale } from '../prototypes/onboarding/copy'

for(const width of [320,360,390,430])for(const theme of ['light','dark'])for(const locale of ['ru','en','zh'] as Locale[])for(const variant of [1,2,3]){
  test(`${width} ${theme} ${locale} direction ${variant}: five pages and three details`,async({page})=>{
    await page.setViewportSize({width,height:844})
    await page.emulateMedia({colorScheme:theme as 'light'|'dark',reducedMotion:theme==='dark'?'reduce':'no-preference'})
    const errors:string[]=[],writes:string[]=[]
    page.on('pageerror',error=>errors.push(error.message))
    page.on('request',request=>{if(/\/(auth|markets|users|guarantors|orders)(\/|$)/.test(new URL(request.url()).pathname))writes.push(request.url())})
    const c=copy[locale]
    await page.goto(`/prototypes/onboarding/index.html?v=${variant}&lang=${locale}&theme=${theme}`)
    for(let step=0;step<5;step++){
      await page.getByRole('button',{name:`${step+1} / 5`,exact:true}).click()
      await expect(page.getByRole('heading',{level:1})).toHaveText(c.titles[step])
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
      const main=page.locator('main');expect(await main.evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true)
      const button=page.getByRole('button',{name:step===4?c.start:c.next,exact:true});await expect(button).toBeVisible()
      const rect=await button.boundingBox();expect(rect!.y+rect!.height).toBeLessThanOrEqual(844)
      if(step===2)for(const kind of ['public','private','guarantor'] as const){
        await page.locator('main').getByRole('button').filter({hasText:c.details[kind][0]}).click()
        await expect(page.getByRole('heading',{level:1})).toHaveText(c.details[kind][0])
        await page.getByRole('button',{name:c.close,exact:true}).click()
      }
    }
    if(width===390&&locale==='ru')await page.screenshot({path:`../.ux-preview/onboarding-screenshots/direction-${variant}-${theme}.png`})
    await page.getByRole('button',{name:c.start,exact:true}).click()
    await expect(page.getByRole('heading',{level:1})).toHaveText(c.done)
    expect(await page.evaluate(()=>localStorage.getItem('betton.onboarding.v1'))).toBeNull()
    expect(errors).toEqual([]);expect(writes).toEqual([])
  })
}

test('picker, education amounts, skip, reduced motion and Telegram BackButton',async({page})=>{
  await page.setViewportSize({width:390,height:844})
  await page.addInitScript(()=>{(window as any).__bridgeVisible=false;(window as any).Telegram={WebApp:{BackButton:{show(){(window as any).__bridgeVisible=true},hide(){(window as any).__bridgeVisible=false},onClick(fn:()=>void){(window as any).__bridgeBack=fn},offClick(){}}}}})
  await page.goto('/prototypes/onboarding/index.html?v=3&lang=en&theme=light')
  const slider=page.getByRole('slider',{name:copy.en.liquidity})
  await slider.fill('20');await page.getByRole('button',{name:copy.en.ioc,exact:true}).click()
  await expect(page.locator('main')).toContainText('20 TON');await expect(page.locator('main')).toContainText('80 TON')
  await slider.focus();await page.keyboard.press('ArrowRight');await expect(page).toHaveURL(/v=3/)
  await page.getByRole('button',{name:'2 / 5',exact:true}).click()
  expect(await page.evaluate(()=>(window as any).__bridgeVisible)).toBe(true)
  await page.evaluate(()=>(window as any).__bridgeBack())
  await expect(page.getByRole('heading',{level:1})).toHaveText(copy.en.titles[0])
  await page.locator('h1').click();await page.keyboard.press('1');await expect(page).toHaveURL(/v=1/)
  await page.keyboard.press('ArrowRight');await expect(page).toHaveURL(/v=2/)
  await page.getByRole('button',{name:copy.en.match,exact:true}).click();await expect(page.locator('main')).toContainText('60 TON')
  await page.keyboard.press('r');await expect(page.locator('main')).toContainText('0 TON')
  await page.reload();await expect(page).toHaveURL(/v=2/)
  await page.emulateMedia({reducedMotion:'reduce'})
  expect(await page.locator('.proto-picker-highlight').evaluate(el=>getComputedStyle(el).transitionDuration)).toBe('0s')
  await page.getByRole('button',{name:copy.en.skip,exact:true}).click();await expect(page.getByRole('heading',{level:1})).toHaveText(copy.en.done)
})

test('malformed variants, visible exercise feedback, consent stages and focus recovery',async({page})=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message))
  await page.setViewportSize({width:320,height:844})
  for(const invalid of ['1.5','99','bad']){
    await page.goto('/prototypes/onboarding/index.html?v='+invalid+'&lang=en')
    await expect(page.locator('[data-direction]')).toHaveAttribute('data-direction','premium')
    await expect(page).toHaveURL(/v=1/)
  }
  await page.goto('/prototypes/onboarding/index.html?v=3&lang=en')
  await page.getByRole('button',{name:'2 / 5',exact:true}).click()
  const slider=page.getByRole('slider',{name:copy.en.liquidity})
  await slider.fill('20')
  await page.getByRole('button',{name:copy.en.ioc,exact:true}).click()
  await slider.scrollIntoViewIfNeeded()
  const mainBox=(await page.locator('main').boundingBox())!,feedbackBox=(await page.locator('[data-execution]').boundingBox())!,sliderBox=(await slider.boundingBox())!
  expect(feedbackBox.y).toBeGreaterThanOrEqual(mainBox.y-1)
  expect(feedbackBox.y+feedbackBox.height).toBeLessThanOrEqual(mainBox.y+mainBox.height+1)
  expect(sliderBox.y+sliderBox.height).toBeLessThanOrEqual(mainBox.y+mainBox.height+1)
  await expect(page.locator('[data-execution]')).toContainText('20 TON')
  await expect(page.locator('[data-execution]')).toContainText('80 TON')
  await page.getByRole('button',{name:'3 / 5',exact:true}).click()
  expect(await page.locator('main').evaluate(el=>el.scrollTop)).toBe(0)
  expect(await page.evaluate(()=>document.activeElement?.tagName)).toBe('H1')
  const progressBox=(await page.getByRole('button',{name:'3 / 5',exact:true}).boundingBox())!
  expect(progressBox.width).toBeGreaterThanOrEqual(44);expect(progressBox.height).toBeGreaterThanOrEqual(44)
  await page.getByRole('button',{name:'4 / 5',exact:true}).click()
  const profit=page.getByRole('slider',{name:copy.en.profit});await profit.fill('200')
  await expect(page.locator('main')).toContainText('1.50 TON');await expect(page.locator('main')).toContainText('0.50 TON')
  await page.getByRole('button',{name:'5 / 5',exact:true}).click()
  await page.getByRole('button',{name:copy.en.agree,exact:true}).click()
  await expect(page.locator('ol li span svg')).toHaveCount(1)
  await expect(page.locator('ol li').nth(2)).toContainText('after the event ends')
  expect(errors).toEqual([])
})
