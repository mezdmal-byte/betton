const {test,expect}=require('../../frontend/node_modules/@playwright/test');
for(const width of [320,360,390,430])for(const dark of [false,true])test(`${width} ${dark?'dark':'light'} concepts and states`,async({page},info)=>{
 await page.setViewportSize({width,height:844});await page.goto('/');if(dark)await page.locator('#theme').click();
 for(let d=0;d<3;d++){
 await page.locator(`[data-dir="${d}"]`).click();
 await page.screenshot({path:info.outputPath(`concept-${d}-${width}-${dark}.png`),fullPage:true});
 for(let s=0;s<15;s++){await page.locator('#scenario').selectOption(String(s));expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 }
});
test('negotiation, counteroffer, role boundary, decision and hostile long message',async({page})=>{
 await page.goto('/');await page.locator('#message').fill('<img src=x onerror=alert(1)>'+ 'оченьдлинно'.repeat(70));await page.locator('#chat button').click();await expect(page.locator('.message.mine')).toContainText('<img');expect(await page.locator('.message.mine img').count()).toBe(0);
 await page.getByRole('button',{name:'Встречное предложение',exact:true}).click();await page.locator('#mode').selectOption('combined');await page.locator('#fixed').fill('3');await page.getByRole('button',{name:'Отправить предложение',exact:true}).click();await expect(page.locator('#app')).toContainText('3 TON + 2%');
 await page.getByRole('button',{name:'Подтвердить эту редакцию',exact:true}).click();await expect(page.getByRole('button',{name:'Принять и начать сбор'})).toHaveCount(0);await page.locator('#role').selectOption('guarantor');await page.getByRole('button',{name:'Принять и начать сбор'}).click();await expect(page.locator('h1')).toContainText('Нужны сделки');
 await page.getByRole('button',{name:'Демо: оба исхода обеспечены'}).click();await page.getByRole('button',{name:'Демо: событие завершилось'}).click();await page.locator('#outcome').selectOption({label:'Нет'});page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Проверить перед решением'}).click();await expect(page.locator('#app')).toContainText('исход «Нет»');
});
test('reduced motion and keyboard',async({page})=>{await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');await expect(page.locator('#app')).toBeVisible();expect(await page.locator('main').evaluate(e=>getComputedStyle(e).animationName)).toBe('none');await page.keyboard.press('Tab');expect(await page.evaluate(()=>document.activeElement.tagName)).toBe('BUTTON');});
