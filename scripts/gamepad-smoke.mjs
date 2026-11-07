import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {clickGame,selectGame} from './navigation-helper.mjs';
const server=spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,PORT:'4207'},stdio:['ignore','pipe','inherit']});let browser;
try{
 await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader'],...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}: {})});
 await mkdir('test-results',{recursive:true});
 for(const viewport of [{width:844,height:390},{width:390,height:844}]){
  const context=await browser.newContext({viewport,isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.testPads=[];Object.defineProperty(navigator,'getGamepads',{value:()=>window.testPads});});
  await page.goto('http://127.0.0.1:4207');await page.waitForFunction(()=>document.documentElement.dataset.gameReady==='true');
  await selectGame(page,'#mode','training');await clickGame(page,'#play');
  const box=()=>page.locator('.battle-view').boundingBox();
  await page.evaluate(()=>{window.testPads=[{index:0,id:'Sony DualSense 054c',mapping:'standard',connected:true,axes:[0,0,0,0],buttons:Array.from({length:16},()=>({pressed:false}))}];});
  await page.waitForSelector('#controller-status:visible');assert.equal(await page.locator('.arena').evaluate(n=>n.classList.contains('controller-view')),false,'idle connection must retain touch');
  await page.waitForTimeout(250);const original=await box(),dock=await page.locator('.battle-view').evaluate(n=>parseFloat(getComputedStyle(n).bottom));
  await page.evaluate(()=>{window.testPads[0].buttons[4].pressed=true;});
  await page.waitForSelector('.arena.controller-view');await page.waitForTimeout(250);
  assert.ok((await box()).height>original.height+100,'controller reclaims the dock');assert.equal(await page.locator('#joystick').isVisible(),false);assert.equal(await page.locator('#combat-techniques').isVisible(),true);
  assert.match(await page.locator('#controller-hint').innerText(),/L1.*R1/);
  const geometry=await page.locator('#combat-techniques').evaluate(strip=>{const box=strip.getBoundingClientRect();return Array.from(strip.querySelectorAll('button:not([hidden]) .jutsu-status')).filter(n=>n.getClientRects().length).every(n=>{const b=n.getBoundingClientRect();return b.top>=box.top&&b.bottom<=box.bottom+1;});});assert.equal(geometry,true,'controller bindings and cooldown labels remain inside the strip');
  await page.screenshot({path:`test-results/controller-${viewport.width}.png`});
  // A held controller must not take the layout back from an intentional touch.
  await page.locator('#canvas').tap({position:{x:20,y:20}});await page.waitForTimeout(250);
  assert.equal(await page.locator('#joystick').isVisible(),true);assert.ok(Math.abs(await page.locator('.battle-view').evaluate(n=>parseFloat(getComputedStyle(n).bottom))-dock)<2,'touch restores its full dock reservation even if the connection indicator wraps the header');
  await page.evaluate(()=>{window.testPads[0].buttons[4].pressed=false;window.testPads[0].buttons[0].pressed=true;});await page.waitForSelector('.arena.controller-view');
  // Open Feel without a touchscreen event and persist the coexistence preference.
  await page.evaluate(()=>document.querySelector('#experience-settings').click());await page.locator('[data-experience=showTouchWithController]').check();
  await page.locator('#experience-close').click();assert.equal(await page.locator('#joystick').isVisible(),true);
  await page.evaluate(()=>document.querySelector('#experience-settings').click());await page.locator('[data-experience=showTouchWithController]').uncheck();await page.locator('#experience-close').click();
  // Controller navigation can reach toolbar settings even while a battle overlay is open.
  const pulse=async button=>{await page.evaluate(button=>{window.testPads[0].buttons[button].pressed=false;},button);await page.waitForTimeout(50);await page.evaluate(button=>{window.testPads[0].buttons[button].pressed=true;},button);await page.waitForTimeout(80);await page.evaluate(button=>{window.testPads[0].buttons[button].pressed=false;},button);await page.waitForTimeout(50);};
  await page.locator('#game-settings > summary').focus();await pulse(0);assert.equal(await page.locator('#game-settings').getAttribute('open')!==null,true);
  await page.locator('#experience-settings').focus();await pulse(0);assert.equal(await page.locator('#experience-dialog').isVisible(),true);
  const slider=page.locator('[data-experience=deadZone]'),before=Number(await slider.inputValue());await slider.focus();await pulse(15);assert.ok(Number(await slider.inputValue())>before,'D-pad changes a focused sensitivity slider');
  await pulse(1);assert.equal(await page.locator('#experience-dialog').isVisible(),false);
  // Simulated disconnection immediately restores the touch deck.
  await page.evaluate(()=>window.testPads=[]);await page.waitForFunction(()=>!document.querySelector('.arena').classList.contains('controller-view'));
  assert.equal(await page.locator('#joystick').isVisible(),true);assert.deepEqual(errors,[]);
  // Adventures share the exact same input-mode and expanded-viewport behavior.
  await page.goto('http://127.0.0.1:4207/adventures.html');await page.click('#start-story');await page.click('#story-next');
  await page.evaluate(()=>{window.testPads=[{index:0,id:'Xbox',connected:true,axes:[.8,0,0,0],buttons:Array.from({length:16},()=>({pressed:false}))}];});
  await page.waitForSelector('.adventure-arena.controller-view');await page.waitForTimeout(250);
  assert.equal(await page.locator('#joystick').isVisible(),false);assert.match(await page.locator('#controller-hint').innerText(),/LB.*RB/);
  await page.screenshot({path:`test-results/controller-adventure-${viewport.width}.png`});assert.deepEqual(errors,[]);
  await context.close();
 }
 console.log('Controller mobile portrait/landscape and adventure checks passed');
}finally{await browser?.close();server.kill();}
