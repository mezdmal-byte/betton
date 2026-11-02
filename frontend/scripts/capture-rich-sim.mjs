// CI only: real App + disposable guarded backend. No API interception or Telegram calls.
import {chromium} from '@playwright/test'
import {spawn} from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
const root=process.cwd(),output=path.join(root,'qa-rich-sim')
await fs.mkdir(output,{recursive:true})
const verification=await fs.readFile('rich-sim-check.log','utf8')
const state=verification.match(/ISOLATED_SIM_STATE=(.+)/)?.[1]
if(!state||!state.startsWith(path.join(root,'.ux-preview','qa-rich-')))throw Error('Disposable verified state required')
const manifest=JSON.parse(await fs.readFile(path.join(state,'ux-v3-sandbox.json'),'utf8'))
const child=spawn('python',['scripts/ux_v3_preview.py','--full-demo','--state-dir',state],{cwd:root,stdio:['ignore','pipe','pipe']})
let serverLog='';child.stdout.on('data',d=>serverLog+=d);child.stderr.on('data',d=>serverLog+=d)
const browser=await chromium.launch(),report={realAPI:true,disposable:true,executions:manifest.rich_history_fills,screens:[],errors:[]}
try{
 let up=false;for(let i=0;i<100;i++){try{const r=await fetch('http://127.0.0.1:8877/sandbox/session');if(r.ok){up=true;break}}catch{}await new Promise(r=>setTimeout(r,200))}if(!up)throw Error('SIM backend not ready: '+serverLog)
 const page=await browser.newPage({viewport:{width:390,height:700},hasTouch:true,deviceScaleFactor:2})
 page.on('pageerror',e=>report.errors.push(e.message))
 await page.addInitScript(()=>{localStorage.setItem('betton.onboarding.v1','done');localStorage.setItem('betton.locale','ru');localStorage.setItem('betton.theme','light')})
 await page.goto('http://127.0.0.1:8877/sandbox/?actor=creator')
 const card=page.getByRole('button',{name:manifest.rich_scenarios.rich_history.question,exact:true})
 // Use the app's native search to find this seeded market among the other scenarios.
 await page.getByRole('button',{name:'Поиск событий',exact:true}).click()
 await page.getByRole('searchbox',{name:'Поиск событий'}).fill('Сто сделок')
 await card.click();await page.getByRole('heading',{name:'Движение коэффициентов',exact:true}).waitFor()
 await page.locator('[aria-label="Период графика"]').waitFor()
 for(const label of ['1 ч','24 ч','Всё время']){
  await page.getByRole('button',{name:label,exact:true}).click()
  await page.waitForFunction(()=>document.querySelectorAll('svg polyline,svg path').length>0)
  await page.locator('img').evaluateAll(async list=>Promise.all(list.map(img=>img.decode().catch(()=>{}))))
  const file='chart-'+label.replaceAll(' ','-')+'.png';await page.screenshot({path:path.join(output,file)});report.screens.push(file)
 }
 await page.getByRole('button',{name:'Информация',exact:true}).click();await page.getByText('Как проверяется результат',{exact:true}).waitFor();await page.screenshot({path:path.join(output,'event-information.png')})
 if(report.errors.length)throw Error(JSON.stringify(report.errors))
} catch(e){report.errors.push(String(e));process.exitCode=1}finally{child.kill();await browser.close();await fs.writeFile(path.join(output,'report.json'),JSON.stringify(report,null,2))}
