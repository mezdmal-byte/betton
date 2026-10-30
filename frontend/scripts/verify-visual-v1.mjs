import { createServer } from 'vite'
import { chromium } from '@playwright/test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'

// Run from frontend. Optional CHROMIUM_EXECUTABLE_PATH supports managed runtimes.
const output=path.resolve(process.env.VISUAL_V1_OUTPUT || 'visual-v1-qa')
await fs.mkdir(output,{recursive:true})
const server=await createServer({server:{host:'127.0.0.1',port:6187,strictPort:true},logLevel:'error'})
await server.listen()
const executablePath=process.env.CHROMIUM_EXECUTABLE_PATH
const browser=await chromium.launch({headless:true,...(executablePath?{executablePath,args:['--no-sandbox','--no-zygote','--single-process','--disable-gpu','--disable-software-rasterizer','--use-gl=disabled','--disable-dev-shm-usage'],ignoreDefaultArgs:['--enable-unsafe-swiftshader']}: {})})
const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,colorScheme:'light'})
const page=await context.newPage(),errors=[],report=[]
page.on('pageerror',e=>errors.push(e.message))
const base='http://127.0.0.1:6187/v2/tests/visual-v1/'
async function open(route='index.html') {await page.goto(base+route,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);await page.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'})}
async function capture(name){await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));const audit=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,broken:[...document.images].filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.getAttribute('src')),frame:document.querySelector('[data-figma-frame]')?.getAttribute('data-figma-frame')}));assert.equal(audit.overflow,false,`${name}: horizontal overflow`);assert.deepEqual(audit.broken,[],`${name}: broken assets`);await page.screenshot({path:path.join(output,name+'.png')});report.push({name,...audit});}
try {
 for(const width of [390,320,430]){
  await page.setViewportSize({width,height:844})
  for(let step=0;step<4;step++){await open(`index.html?step=${step}`);await capture(`onboarding-${step+1}-${width}`)}
  for(const [name,index] of [['public',0],['private',1],['guarantor',2]]){await open('index.html?step=2');await page.getByRole('button',{name:/Подробнее/}).nth(index).click();await capture(`detail-${name}-${width}`)}
  for(const screen of ['portfolio','history','creator','create','help','public-profile','network','auth','expired']){await open('index.html?screen='+screen);await capture(`${screen}-${width}`)}
  for(const s of ['notes','profile','events','guarantor','register']){await open(`account/index.html?s=${s}`);await capture(`${s}-${width}`)}
  await open('feed/index.html');await capture(`feed-${width}`);await page.getByRole('button',{name:'Меню',exact:true}).click();await capture(`drawer-${width}`)
  for(const mode of ['event','quick','own']){await open('trade/index.html?mode='+mode);await capture(`${mode}-${width}`)}
 }
 await page.setViewportSize({width:390,height:844})
 for(const state of ['ready','loading','error']){await open('trade/index.html?mode=event&discussion='+state);await page.getByRole('button',{name:'Обсуждение',exact:true}).click();await capture('discussion-'+state+'-390');if(state==='ready'){assert.equal(await page.getByText('Проверим официальный результат.',{exact:true}).count(),1);assert.equal(await page.getByText('Скрытый текст',{exact:true}).count(),0)}if(state==='error'){await page.getByRole('button',{name:'Повторить загрузку обсуждения',exact:true}).click();assert.equal(await page.locator('[data-submit-count]').getAttribute('data-submit-count'),'1')}}
 await open('index.html?screen=help')
 await page.getByRole('button',{name:'Как заключаются ставки',exact:true}).click()
 await capture('help-p2p-390')
 await open('index.html?screen=public-profile')
 await page.getByRole('button',{name:'Статистика автора',exact:true}).click()
 await capture('public-stats-390')
 await open('index.html?screen=creator')
 await page.getByRole('button',{name:'Определить результат',exact:true}).click()
 await page.getByLabel('Обоснование',{exact:true}).fill('Дмитрий выиграл матч со счётом 3:1 по партиям.')
 await page.getByRole('button',{name:'Проверить решение',exact:true}).click()
 assert.equal(await page.locator('[data-qa-calls]').getAttribute('data-qa-calls'),'0','No request before final confirmation')
 await capture('creator-review-390')
 await page.getByRole('button',{name:'Подтвердить результат',exact:true}).click()
 await page.getByRole('heading',{name:'Решение подтверждено',exact:true}).waitFor()
 assert.equal(await page.locator('[data-qa-calls]').getAttribute('data-qa-calls'),'1','Exactly one decision request')
 await capture('creator-success-390')
 await open('index.html?screen=creator&fail=1')
 await page.getByRole('button',{name:'Определить результат',exact:true}).click()
 await page.getByLabel('Обоснование',{exact:true}).fill('Проверяем неуспешную отправку.')
 await page.getByRole('button',{name:'Проверить решение',exact:true}).click()
 await page.getByRole('button',{name:'Подтвердить результат',exact:true}).click()
 assert.equal(await page.getByRole('heading',{name:'Решение подтверждено',exact:true}).count(),0,'Server failure must not show success')
 await capture('creator-failed-request-390')
 await open('index.html?ui=legacy')
 assert.equal(await page.getByRole('button',{name:/\/ 5/}).count(),5,'Legacy five-page onboarding retained')
 await capture('legacy-onboarding-390')
 assert.deepEqual(errors,[],'No runtime page errors')
 await fs.writeFile(path.join(output,'report.json'),JSON.stringify({screens:report.length,errors,checks:['no horizontal overflow','no broken static images','creator explicit confirmation','one creator request','no optimistic success on rejected request','legacy onboarding retained'],report},null,2))
 console.log(JSON.stringify({screens:report.length,errors,output}))
}finally{await browser.close();await server.close()}
