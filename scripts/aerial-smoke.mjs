import {legacyRoster} from './loadout-helper.mjs';
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const server=spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,PORT:'4192'},stdio:['ignore','pipe','inherit']});let browser;
try{
 await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',c=>reject(new Error(`Server exited ${c}`)));});
 browser=await chromium.launch({args:['--enable-unsafe-swiftshader'],headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']}: {})});await mkdir('test-results',{recursive:true});const errors=[];
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:844,height:390}:{width:1440,height:960},isMobile:mobile,hasTouch:mobile}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.clock.install({time:new Date('2030-01-01T00:00:00Z')});await page.clock.pauseAt(new Date('2030-01-01T00:00:01Z'));await page.goto('http://127.0.0.1:4192');await legacyRoster(page);await page.click('#edit-loadout0');
  for(const [i,id]of ['risingGale','skyCleave','divingFlame','aerialSenbon'].entries()){await page.locator(`[data-loadout-slot="${i}"]`).click();await page.locator(`[data-pick-id=${id}]`).click();}
  await page.fill('#loadout-search','aerial only');assert.equal(await page.locator('[data-pick-kind=jutsu]').count(),3);assert.match(await page.locator('#loadout-grid').innerText(),/AIR COMBO/);await page.screenshot({path:`test-results/aerial-library-${mobile?'mobile':'desktop'}.png`});await page.click('#loadout-save');await page.selectOption('#mode','training');await page.click('#play');await page.clock.runFor(32);await page.click('#training-settings');await page.uncheck('#training-ranges');await page.click('#training-start');await page.clock.runFor(32);
  if(!mobile){
   const press=async(key,after=0)=>{await page.keyboard.down(key);await page.clock.runFor(16);await page.keyboard.up(key);if(after)await page.clock.runFor(after);};
   await press('KeyU',165);await press('KeyW',32);await press('KeyJ',133);await press('KeyJ',116);await press('KeyI',165);
   assert.match(await page.locator('#combo0').innerText(),/AIR.*[34] HITS/);await page.screenshot({path:'test-results/aerial-combo-desktop.png'});await press('KeyO',200);assert.match(await page.locator('#combo0').innerText(),/5 HITS/,JSON.stringify(await page.locator('#combo0,#training-readout,#feedback').allTextContents()));await page.clock.runFor(600);await page.screenshot({path:'test-results/moonlit-shrine-desktop.png'});
  }else{
   await page.click('#jutsu-toggle');assert.equal(await page.locator('[data-jutsu-cast=special2]').isDisabled(),true);await page.click('#jutsu-toggle');
   await page.locator('[data-action=jump]').tap();await page.clock.runFor(32);
   await page.click('#jutsu-toggle');assert.equal(await page.locator('[data-jutsu-cast=special2]').isDisabled(),false);await page.locator('[data-jutsu-cast=special2]').tap();await page.clock.runFor(100);assert.match(await page.locator('#training-readout').innerText(),/STARTUP|ACTIVE/);assert.match(await page.locator('#s2-name').innerText(),/SKY CLEAVE/);await page.screenshot({path:'test-results/aerial-mobile.png'});
  }
  await context.close();
 }
 const reduced=await browser.newContext({reducedMotion:'reduce'}),p=await reduced.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:4192');await legacyRoster(p);await p.selectOption('#mode','training');await p.click('#play');await p.screenshot({path:'test-results/aerial-reduced-motion.png'});await reduced.close();assert.deepEqual(errors,[]);
 console.log('Aerial browser checks passed: searchable tags, five-hit keyboard air route, detailed stage, mobile analog jump and aerial menu gating, reduced-motion rendering.');
}finally{await browser?.close();server.kill();}
