import {createServer} from 'vite'
import {chromium} from '@playwright/test'
import fs from 'node:fs/promises'
import path from 'node:path'
import {execFileSync} from 'node:child_process'

const arg=name=>process.argv[process.argv.indexOf(name)+1]
const root=path.resolve(process.argv.includes('--root')?arg('--root'): '..')
const output=path.resolve(process.argv.includes('--output')?arg('--output'):'app-v1-qa')
const baseline=process.argv.includes('--baseline')
await fs.mkdir(output,{recursive:true})
const server=await createServer({root:path.join(root,'frontend'),configFile:path.join(root,'frontend/vite.config.ts'),server:{host:'127.0.0.1',port:6189,strictPort:true},logLevel:'error'})
await server.listen()
const browser=await chromium.launch({headless:true})
const report={source:execFileSync('git',['-C',root,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),actualApp:true,bridge:'synthetic Telegram host',data:'read-only deterministic API fixtures, no backend',baseline,screens:[],errors:[],requests:[]}
const fixtures=[
 ['Team Liquid — Team Spirit','esports','Team Liquid','Team Spirit',1.74,2.10,12435,28,48620],
 ['Реал Мадрид — Бавария','sport','Реал Мадрид','Бавария',1.95,1.87,9842,36,31266],
 ['NAVI — G2 Esports','esports','NAVI','G2 Esports',2.05,1.68,7618,22,26145],
 ['Новак Джокович — Карлос Алькарас','sport','Новак Джокович','Карлос Алькарас',2.30,1.62,6421,18,19840],
 ['Какой исход наступит в тестовом событии с длинным названием?','unique','Первый длинный исход','Второй длинный исход',1.85,2.05,500,12,2100],
].map(([question,category,a,b,oa,ob,off,count,volume],i)=>({id:i+1,question,category,outcomes:[a,b],description:'Тестовые данные визуального QA',creator_id:90002,creator:{id:90002,display_name:'Тестовый автор'},status:'open',visibility:'public',accepting_bets:true,mechanism:'p2p',close_at:'2026-11-03T23:00:00Z',best_offers:[{odds:oa,available:100},{odds:ob,available:100}],activity:{volume,active_offers_nano:String(off*1e9),offers_count:count,unique_participants:12}}))
const user={id:90001,username:'visual_qa',display_name:'Тестовый участник',telegram_username:'visual_qa',balance:125.4,balance_nano:125400000000,reserved:0,reserved_nano:0,in_positions:0,in_positions_nano:0,is_admin:false}
async function setup(width,height,mode='unsupported'){
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,colorScheme:'light',locale:'ru-RU',timezoneId:'UTC',hasTouch:true})
 await context.route('**/*',async route=>{
  const req=route.request(),url=new URL(req.url()),p=url.pathname
  if(url.hostname==='telegram.org')return route.fulfill({body:'',contentType:'text/javascript'})
  if(url.hostname!=='127.0.0.1'){report.errors.push('External request blocked: '+url.hostname);return route.abort()}
  if(p.startsWith('/v2/')||p.startsWith('/@')||p.startsWith('/node_modules/')||p.startsWith('/src/'))return route.continue()
  report.requests.push({method:req.method(),path:p})
  let data
  if(p==='/auth/telegram')data=user
  else if(p==='/health')data={status:'ok'}
  else if(p==='/markets')data=fixtures
  else if(/^\/markets\/\d+$/.test(p))data=fixtures.find(m=>m.id===Number(p.split('/')[2]))
  else if(/^\/markets\/\d+\/trades$/.test(p))data=[]
  else if(/^\/markets\/\d+\/chat$/.test(p))data={items:[],has_more:false,next_before_id:null}
  else if(/^\/ux-v3\/events\/\d+\/terms$/.test(p))data=null
  else if(p==='/feed/stats')data={active_offers_nano:'36816000000000',scope:'public'}
  else if(p==='/users/90001/account')data=user
  else if(p==='/guarantors/me')data=null
  else if(p==='/guarantors/me/heartbeat')data={ok:true}
  else if(p==='/notifications'||p==='/creators/top'||p==='/guarantors'||p==='/guarantor-cases')data=[]
  else if(p.startsWith('/chat/'))data={count:0,unread:0,unread_replies:0}
  else if(/^\/markets\/\d+\/orderbook$/.test(p))data={sides:[[{odds:1.74,available:100}],[{odds:2.1,available:100}]],available_to_me:[[{odds:1.74,available:100}],[{odds:2.1,available:100}]],queued:[100,100]}
  else if(p==='/favicon.ico')return route.fulfill({status:204})
  else {report.errors.push('Unhandled fixture request: '+req.method()+' '+p);return route.fulfill({status:404,json:{detail:'QA fixture not defined'}})}
  if(req.method()!=='GET'&&!['/auth/telegram','/guarantors/me/heartbeat'].includes(p)){report.errors.push('Unexpected write prevented: '+p);return route.abort()}
  return route.fulfill({json:data,headers:{'x-total-count':String(Array.isArray(data)?data.length:1)}})
 })
 await context.addInitScript(({height,mode})=>{
  localStorage.setItem('betton.theme','light');localStorage.setItem('betton.locale','ru')
  const listeners=new Map(),back=new Set()
  const emit=name=>{for(const f of listeners.get(name)||[])f()}
  const host={initData:'QA_SYNTHETIC_NOT_AUTH',initDataUnsafe:{user:{id:90001,first_name:'Тестовый участник'}},viewportStableHeight:height,isFullscreen:false,safeAreaInset:{top:0,bottom:0,left:0,right:0},contentSafeAreaInset:{top:0,bottom:0,left:0,right:0},isVersionAtLeast:()=>mode!=='unsupported',ready(){},expand(){},disableVerticalSwipes(){},colorScheme:'light',themeParams:{},setHeaderColor(){},setBackgroundColor(){},onEvent:(n,f)=>{if(!listeners.has(n))listeners.set(n,new Set());listeners.get(n).add(f)},offEvent:(n,f)=>listeners.get(n)?.delete(f),BackButton:{show(){},hide(){},onClick:f=>back.add(f),offClick:f=>back.delete(f)},requestFullscreen(){window.__APP_QA__.fullscreenRequests++;if(mode==='success'){host.isFullscreen=true;host.safeAreaInset={top:24,bottom:20,left:0,right:0};host.contentSafeAreaInset={top:46,bottom:0,left:0,right:0};emit('fullscreenChanged')}else emit('fullscreenFailed')}}
  window.Telegram={WebApp:host}
  window.__APP_QA__={host,emit,back:()=>{for(const f of [...back])f()},fullscreenRequests:0}
 },{height,mode})
 const page=await context.newPage()
 page.on('pageerror',e=>report.errors.push(e.message))
 await page.clock.setFixedTime(new Date('2026-11-02T10:00:00Z'))
 return {page,context}
}
async function ready(page){await page.evaluate(()=>document.fonts.ready);await page.locator('[data-source-art]').evaluateAll(async elements=>{const urls=[...new Set(elements.map(el=>getComputedStyle(el).backgroundImage.slice(4,-1).replace(/^[\"']|[\"']$/g,'')))];await Promise.all(urls.map(src=>{const image=new Image();image.src=src;return image.decode()}))});await page.locator('[data-visual="v1"]').waitFor();await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))))}
async function capture(page,name,kind){
 await ready(page)
 const audit=await page.evaluate(()=>{
  const root=document.querySelector('[data-visual="v1"]'),surface=root?.firstElementChild,feed=document.querySelector('[data-figma-frame="819:45192"]'),event=document.querySelector('[data-figma-frame="908:19752"]')
  const bounds=e=>{const b=e?.getBoundingClientRect();return b?{x:b.x,y:b.y,width:b.width,height:b.height,bottom:b.bottom}:null}
  const main=(feed??event)?.querySelector('main'),nav=feed?.querySelector('nav[aria-label="Основная навигация"]')??event?.querySelector('section[aria-label="Быстрая ставка"]'),cards=[...feed?.querySelectorAll('article')||[]]
  const area=main?.getBoundingClientRect()
  const cardBounds=cards.map(bounds)
  const equivalent=area?cardBounds.reduce((sum,b)=>sum+Math.max(0,Math.min(area.bottom,b.bottom)-Math.max(area.top,b.y))/b.height,0):null
  return {overflow:document.documentElement.scrollWidth>innerWidth+1,broken:[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.getAttribute('src')),root:bounds(root),surface:bounds(surface),header:bounds((feed??event)?.querySelector('header')),scroll:bounds(main),nav:bounds(nav),cardBounds,visibleCardEquivalent:feed?equivalent:null,fullCards:feed&&area?cardBounds.filter(b=>b.y>=area.top-1&&b.bottom<=area.bottom+1).length:null,footer:bounds(document.querySelector('[data-figma-frame] footer')),fullscreen:document.documentElement.getAttribute('data-betton-fullscreen'),compact:document.documentElement.getAttribute('data-betton-compact')}
 })
 await page.screenshot({path:path.join(output,name+'.png')})
 report.screens.push({name,kind,viewport:page.viewportSize(),...audit})
 if(audit.overflow)report.errors.push(name+': horizontal page overflow')
 if(audit.broken.length)report.errors.push(name+': broken images')
 if(audit.footer&&audit.surface&&audit.footer.bottom>audit.surface.bottom+1)report.errors.push(name+': footer outside safe surface')
 if(audit.nav&&audit.surface&&audit.nav.bottom>audit.surface.bottom+1)report.errors.push(name+': navigation outside safe surface')
 if(audit.nav&&audit.scroll&&audit.scroll.bottom>audit.nav.y+1)report.errors.push(name+': scroll overlaps navigation')
}
try{
 for(const width of [320,360,390,430])for(const height of [550,600,700,844]){
  const {page,context}=await setup(width,height)
  await page.goto('http://127.0.0.1:6189/v2/')
  for(let step=0;step<4;step++){
   await page.getByRole('heading',{level:1}).waitFor()
   await capture(page,`onboarding-${step+1}-${width}x${height}`,'onboarding')
   if(step===2){
    if(height<=600){await page.locator('[data-onboarding-illustration]').evaluate(el=>{const main=el.closest('main');main.scrollTop=main.scrollHeight});await capture(page,`onboarding-3-scrolled-${width}x${height}`,'onboarding-scroll');await page.locator('[data-onboarding-illustration]').evaluate(el=>el.closest('main').scrollTop=0)}
    for(const [index,kind] of ['public','private','guarantor'].entries()){
     await page.getByRole('button',{name:/Подробнее/}).nth(index).click()
     await capture(page,`detail-${kind}-${width}x${height}`,'detail')
     if(height<=600){await page.locator('[data-figma-frame] main').evaluate(el=>el.scrollTop=el.scrollHeight);await capture(page,`detail-${kind}-scrolled-${width}x${height}`,'detail-scroll')}
     await page.getByRole('button',{name:'Понятно',exact:true}).click()
     if(!baseline)await page.waitForFunction(kind=>document.activeElement?.getAttribute('data-event-type')===kind,kind)
    }
   }
   await page.getByRole('button',{name:step===3?'Начать':'Далее',exact:false}).click()
  }
  await page.getByText('Team Liquid — Team Spirit',{exact:true}).first().waitFor()
  await capture(page,`feed-${width}x${height}`,'feed')
  await page.getByRole('button',{name:'Меню',exact:true}).click()
  await capture(page,`drawer-${width}x${height}`,'drawer')
  await page.evaluate(()=>window.__APP_QA__.back())
  await page.getByRole('dialog',{name:'Меню BetTON'}).waitFor({state:'hidden'})
  if(width===390&&height===600){
   await page.getByRole('button',{name:'Меню',exact:true}).click()
   const drawer=page.getByRole('dialog',{name:'Меню BetTON'})
   await drawer.evaluate(el=>el.scrollTop=el.scrollHeight)
   await capture(page,'drawer-scrolled-390x600','drawer-scroll')
   await drawer.evaluate(el=>el.scrollTop=0)
   await drawer.dispatchEvent('pointerdown',{pointerType:'touch',pointerId:1,clientX:230,clientY:200})
   await drawer.dispatchEvent('pointerup',{pointerType:'touch',pointerId:1,clientX:80,clientY:205})
   await drawer.waitFor({state:'hidden'})
   await page.locator('[data-figma-frame="819:45192"] main').evaluate(el=>el.scrollTop=el.scrollHeight)
   await capture(page,'feed-scrolled-390x600','feed-scroll')
   await page.getByRole('button',{name:'Меню',exact:true}).click()
   await page.getByRole('button',{name:'Поиск событий',exact:false}).click()
   await page.getByRole('searchbox').fill('Тест')
   await page.evaluate(()=>{Object.defineProperty(window.visualViewport,'height',{configurable:true,get:()=>350});window.visualViewport.dispatchEvent(new Event('resize'))})
   await capture(page,'keyboard-model-390x600','keyboard-model')
   if(await page.evaluate(()=>document.documentElement.style.getPropertyValue('--betton-viewport-height'))!=='350px')report.errors.push('Keyboard model did not reduce App height')
  }
  await context.close()
 }
 for(const width of [320,390])for(const height of [600,844]){
  const {page,context}=await setup(width,height)
  await page.goto('http://127.0.0.1:6189/v2/')
  await page.getByRole('button',{name:'Пропустить',exact:true}).click()
  await page.getByRole('button',{name:'Team Liquid — Team Spirit',exact:true}).click()
  await page.getByRole('heading',{name:'Событие',exact:true}).waitFor()
  await page.getByText('Исполненных сделок за этот период нет',{exact:true}).waitFor()
  for(const [pane,label] of [['chart','График'],['book','Предложения'],['info','Информация'],['discussion','Обсуждение']]){
   await page.getByRole('button',{name:label,exact:true}).click()
   if(pane==='discussion')await page.getByText('Сообщений пока нет.',{exact:true}).waitFor()
   await capture(page,`event-${pane}-${width}x${height}`,'event')
   await page.locator('[data-figma-frame="908:19752"] main').evaluate(el=>el.scrollTop=el.scrollHeight)
   await capture(page,`event-${pane}-scrolled-${width}x${height}`,'event-scroll')
  }
  await page.getByRole('button',{name:'Назад',exact:true}).click()
  await page.getByRole('button',{name:'Team Liquid — Team Spirit',exact:true}).waitFor()
  await context.close()
 }
 for(const mode of ['success','denied']){
  const {page,context}=await setup(390,844,mode)
  await page.goto('http://127.0.0.1:6189/v2/')
  await capture(page,`onboarding-fullscreen-${mode}`,'fullscreen')
  await page.getByRole('button',{name:'Пропустить',exact:true}).click()
  await page.getByText('Team Liquid — Team Spirit',{exact:true}).first().waitFor()
  await capture(page,`feed-fullscreen-${mode}`,'fullscreen')
  if(await page.evaluate(()=>window.__APP_QA__.fullscreenRequests)!==1)report.errors.push(mode+': fullscreen request count')
  await page.getByRole('button',{name:'Меню',exact:true}).click()
  await capture(page,`drawer-fullscreen-${mode}`,'fullscreen')
  await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab')
  const trapped=await page.evaluate(()=>Boolean(document.activeElement?.closest('[role="dialog"]')))
  if(!trapped)report.errors.push(mode+': focus escaped drawer')
  await page.keyboard.press('Escape')
  await page.getByRole('dialog',{name:'Меню BetTON'}).waitFor({state:'hidden'})
  await page.getByRole('button',{name:'Team Liquid — Team Spirit',exact:true}).click()
  await page.getByText('Исполненных сделок за этот период нет',{exact:true}).waitFor()
  await capture(page,`event-fullscreen-${mode}`,'event-fullscreen')
  await page.locator('[data-figma-frame="908:19752"] main').evaluate(el=>el.scrollTop=el.scrollHeight)
  await capture(page,`event-fullscreen-scrolled-${mode}`,'event-fullscreen-scroll')
  await context.close()
 }
} catch(error){report.errors.push(error.stack||String(error))}
finally{
 await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2))
 await browser.close();await server.close()
}
console.log(JSON.stringify({source:report.source,screens:report.screens.length,errors:[...new Set(report.errors)]}))
if(report.errors.length&&!baseline)process.exitCode=1
