// Uses installed Node Playwright; never sends credentials or screenshots elsewhere.
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(resolve('frontend/package.json'));
const {chromium}=require('@playwright/test');
const base='http://127.0.0.1:8885';
const runtime=resolve('.ux-preview/admin-center-runtime');
const credentials=JSON.parse(readFileSync(resolve(runtime,'access.json'),'utf8'));
const snapshot=JSON.parse(readFileSync(resolve(runtime,'snapshot.json'),'utf8'));
const hash=()=>createHash('sha256').update(readFileSync(snapshot.snapshot)).digest('hex');
const before=hash();
const browser=await chromium.launch();
try {
  const context=await browser.newContext({httpCredentials:credentials,viewport:{width:1440,height:900}});
  const page=await context.newPage();
  const errors=[],mutations=[],external=[];
  page.on('pageerror',error=>errors.push(String(error)));
  page.on('request',request=>{
    if(!['GET','HEAD'].includes(request.method()))mutations.push(request.url());
    if(!request.url().startsWith(base+'/'))external.push(request.url());
  });
  await page.goto(base);
  await page.getByRole('heading',{name:'Система в цифрах',exact:true}).waitFor();
  const output=resolve(runtime,'screenshots');mkdirSync(output,{recursive:true});
  await page.screenshot({path:resolve(output,'overview-1440.png'),fullPage:true});
  for(const section of ['users','events','orders','fills','ledger','settlements','guarantors','cases','revisions','messages','demo-runs','monitor','reconcile','errors']) {
    await page.locator(`#navigation a[href="#${section}"]`).click();
    await page.waitForFunction(()=>document.querySelector('#app')?.children.length>0);
    await page.waitForTimeout(180);
    assert.equal(await page.locator('.error').count(),0,'Failed section '+section);
  }
  const response=await context.request.get(base+'/api/reconciliation');
  assert.equal(response.status(),200);
  const report=await response.json();
  assert.equal(report.connected,true);assert.equal(report.schema_revision,4);
  assert.equal((await context.request.get(base+'/api/database-status')).status(),200);
  await page.goto(base+'/#guarantors');
  await page.locator('tbody tr').first().waitFor();
  await page.screenshot({path:resolve(output,'guarantors-1440.png'),fullPage:true});
  await page.setViewportSize({width:390,height:844});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:resolve(output,'guarantors-390.png'),fullPage:true});
  assert.deepEqual(errors,[]);assert.deepEqual(mutations,[]);assert.deepEqual(external,[]);
  assert.equal(hash(),before,'Admin browsing changed its read-only snapshot');
  console.log(JSON.stringify({browser:'passed',sections:14,write_requests:0,external_requests:0,
    snapshot_unchanged:true,schema_revision:report.schema_revision,reconciliation_status:report.status}));
}finally{await browser.close()}
