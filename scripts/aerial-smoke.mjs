import {clickGame,selectGame,openNavigation,steadyTiming} from './navigation-helper.mjs';
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
  const context=await browser.newContext({viewport:mobile?{width:844,height:390}:{width:1440,height:960},isMobile:mobile,hasTouch:mobile}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await steadyTiming(page);
  await page.clock.install({time:new Date('2030-01-01T00:00:00Z')});await page.clock.pauseAt(new Date('2030-01-01T00:00:01Z'));await page.goto('http://127.0.0.1:4192');await legacyRoster(page);await page.click('#edit-loadout0');
  for(const [i,id]of ['risingGale','skyCleave','divingFlame','skyfallNeedles'].entries()){await page.locator(`[data-loadout-slot="${i}"]`).click();await page.locator(`[data-pick-id=${id}]`).click();}
  await page.fill('#loadout-search','aerial only');assert.equal(await page.locator('[data-pick-kind=jutsu]').count(),3);assert.match(await page.locator('#loadout-grid').innerText(),/AIR COMBO/);await page.screenshot({path:`test-results/aerial-library-${mobile?'mobile':'desktop'}.png`});await page.click('#loadout-save');await selectGame(page,'#mode','training');await clickGame(page,'#play');await page.clock.runFor(32);await clickGame(page,'#training-settings');await page.uncheck('#training-ranges');await page.click('#training-start');await page.clock.runFor(32);
  if(!mobile){
   const press=async(key,after=0)=>{await page.keyboard.down(key);await page.clock.runFor(16);await page.keyboard.up(key);if(after)await page.clock.runFor(after);};
   await press('KeyU',165);await press('KeyW',32);await press('KeyJ',133);await press('KeyJ',116);await press('KeyI',165);
   assert.match(await page.locator('#combo0').innerText(),/AIR.*[34] HITS/);await page.screenshot({path:'test-results/aerial-combo-desktop.png'});await press('KeyO',200);assert.match(await page.locator('#combo0').innerText(),/5 HITS/,JSON.stringify(await page.locator('#combo0,#training-readout,#feedback').allTextContents()));await page.clock.runFor(600);await page.screenshot({path:'test-results/moonlit-shrine-desktop.png'});
  }else{
   await page.locator('#touch-kit-toggle').tap();assert.equal(await page.locator('[data-quick-action=special2]').isDisabled(),true);await page.locator('#touch-kit-toggle').tap();
   await page.locator('[data-action=jump]').tap();await page.clock.runFor(32);
   await page.locator('#touch-kit-toggle').tap();assert.equal(await page.locator('[data-quick-action=special2]').isDisabled(),false);await page.locator('[data-quick-action=special2]').tap();await page.clock.runFor(100);assert.match(await page.locator('#training-readout').innerText(),/STARTUP|ACTIVE/);assert.match(await page.locator('#s2-name').innerText(),/SKY CLEAVE/);await page.screenshot({path:'test-results/aerial-mobile.png'});
  }
  await context.close();
 }
 // Impact pause is on by default: the same opener holds its struck frame, so fewer engine ticks pass in the same time.
 const openerTicks=async impact=>{
  const context=await browser.newContext({viewport:{width:1440,height:960}}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));if(!impact)await steadyTiming(page);
  await page.clock.install({time:new Date('2030-01-01T00:00:00Z')});await page.clock.pauseAt(new Date('2030-01-01T00:00:01Z'));await page.goto('http://127.0.0.1:4192');await legacyRoster(page);await page.click('#edit-loadout0');
  await page.locator('[data-loadout-slot="0"]').click();await page.locator('[data-pick-id=risingGale]').click();await page.click('#loadout-save');await selectGame(page,'#mode','training');await clickGame(page,'#play');await page.clock.runFor(32);await clickGame(page,'#training-settings');await page.uncheck('#training-ranges');await page.click('#training-start');await page.clock.runFor(32);
  const tick=async()=>Number(await page.locator('#canvas').getAttribute('data-render-tick')),start=await tick();
  await page.keyboard.down('KeyU');await page.clock.runFor(16);await page.keyboard.up('KeyU');await page.clock.runFor(400);
  const ticks=await tick()-start;await context.close();return ticks;
 };
 const steady=await openerTicks(false),held=await openerTicks(true);
 assert.ok(steady>=23&&steady<=26,`steady timing steps every tick: ${steady}`);assert.ok(held>=steady-9&&held<=steady-2,`impact pause holds the struck frame: ${held} of ${steady} ticks`);
 const reduced=await browser.newContext({reducedMotion:'reduce'}),p=await reduced.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:4192');await legacyRoster(p);await selectGame(p,'#mode','training');await clickGame(p,'#play');await p.screenshot({path:'test-results/aerial-reduced-motion.png'});await reduced.close();assert.deepEqual(errors,[]);
 console.log('Aerial browser checks passed: searchable tags, five-hit keyboard air route, detailed stage, mobile analog jump and aerial menu gating, default impact pause, reduced-motion rendering.');
}finally{await browser?.close();server.kill();}
