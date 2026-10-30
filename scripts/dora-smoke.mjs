import {legacyRoster} from './loadout-helper.mjs';
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const server=spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,PORT:'4187'},stdio:['ignore','pipe','inherit']});let browser;
try{
 await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',c=>reject(new Error(`Server exited ${c}`)));});
 browser=await chromium.launch({args:['--enable-unsafe-swiftshader'],headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']}: {})});
 await mkdir('test-results',{recursive:true});const errors=[];
 for(const mobile of [false,true]){
  const context=await browser.newContext(mobile?{viewport:{width:844,height:390},isMobile:true,hasTouch:true}:{viewport:{width:1280,height:900}}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.stack));
  await page.clock.install({time:new Date('2030-01-01T00:00:00Z')});await page.clock.pauseAt(new Date('2030-01-01T00:00:01Z'));await page.goto('http://127.0.0.1:4187');await legacyRoster(page);
  await page.selectOption('#roster-era','Original');await page.locator('#character0 input[value=dora]').check();assert.equal(await page.locator('#selected0').innerText(),'Dora');assert.equal(await page.locator('#weapon0').inputValue(),'fans');assert.equal(await page.locator('#weapon-secondary0').inputValue(),'katana');assert.match(await page.locator('#kit0').innerText(),/Limit Release/);
  const portrait=page.locator('#character0 [data-character=dora] .concept-portrait');assert.ok(await portrait.evaluate(async el=>{if(el instanceof HTMLImageElement){await el.decode();return el.naturalWidth>0;}return el.dataset.animatedPortrait==='dora'&&el.getContext('2d').getImageData(0,0,el.width,el.height).data.some((n,i)=>i%4===3&&n>0);}),'Dora concept portrait rendered');await page.screenshot({path:`test-results/dora-${mobile?'mobile':'desktop'}-select.png`});
  await page.selectOption('#mode','training');await page.click('#play');await page.clock.runFor(32);assert.equal(await page.locator('#name0').innerText(),'DORA');assert.equal(await page.locator('#s1-name').innerText(),'TIDAL EDICT');
  const tap=async(key,action,ms=500)=>{if(mobile)await page.locator(`[data-action=${action}]`).tap();else {await page.keyboard.down(key);await page.clock.runFor(40);await page.keyboard.up(key);}await page.clock.runFor(ms);};
  await tap('KeyU','special1');assert.match(await page.locator('#effects1').innerText(),/WEAKEN/);
  await page.click('#training-reset');await page.clock.runFor(32);await tap('KeyO','bloodline');assert.match(await page.locator('#effects0').innerText(),/TRIUNE FLOW/);
  await page.click('#training-reset');await page.clock.runFor(32);await tap('KeyF','swapWeapon');assert.match(await page.locator('#weapon-label').innerText(),/KATANA/);
  if(!mobile){
   await page.click('#training-settings');await page.uncheck('#training-health');await page.click('#training-start');await page.clock.runFor(32);
   await page.keyboard.down('KeyA');await page.clock.runFor(600);await page.keyboard.up('KeyA');await page.keyboard.down('KeyI');await page.clock.runFor(350);await page.keyboard.up('KeyI');assert.match(await page.locator('#training-readout').innerText(),/STARTUP 18f.*Gap 100.*hitstun 12f/);await page.clock.runFor(500);assert.equal(await page.locator('#hp1').innerText(),'835');
  }
  await page.clock.runFor(1000);await page.click('#training-settings');await page.click('#training-charge');await page.click('#training-close');await page.click('#play');await tap('KeyT','awakening',200);assert.match(await page.locator('#awakening-label0').innerText(),/LIMIT RELEASE/);assert.equal(await page.locator('#s1-name').innerText(),'ROYAL GALE');await page.screenshot({path:`test-results/dora-${mobile?'mobile':'desktop'}-awakening.png`});
  await context.close();
 }
 assert.deepEqual(errors,[]);console.log('Dora browser checks passed: desktop/mobile selection, portrait, loadout defaults, weaken, Triune Flow, swap, pull-finisher damage and Limit Release.');
}finally{await browser?.close();server.kill();}
