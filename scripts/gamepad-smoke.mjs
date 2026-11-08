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
  assert.ok((await box()).height>original.height+50,'controller reclaims most of the dock');await page.waitForFunction(()=>{const rail=document.querySelector('#combat-techniques').getBoundingClientRect(),battle=document.querySelector('.battle-view').getBoundingClientRect();return rail.top>=battle.bottom-.5;});assert.equal(await page.locator('#joystick').isVisible(),false);assert.equal(await page.locator('#combat-techniques').isVisible(),true);
  assert.match(await page.locator('#controller-hint').innerText(),/L1.*R1/);
  const geometry=await page.locator('#combat-techniques').evaluate(strip=>{const box=strip.getBoundingClientRect();return Array.from(strip.querySelectorAll('button:not([hidden]) .jutsu-status')).filter(n=>n.getClientRects().length).every(n=>{const b=n.getBoundingClientRect();return b.top>=box.top&&b.bottom<=box.bottom+1;});});assert.equal(geometry,true,'controller bindings and cooldown labels remain inside the strip');
  await page.screenshot({path:`test-results/controller-${viewport.width}.png`});
  const header=await page.locator('.topbar').boundingBox();await page.locator('#navigation-toggle').click();assert.equal(await page.locator('#navigation-toggle').getAttribute('aria-expanded'),'false');assert.ok((await page.locator('.topbar').boundingBox()).height<=header.height);await page.locator('#navigation-toggle').click();
  assert.equal(await page.locator('#resources-dialog .release-link').count(),1);
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
  await page.locator('#controller-mapping summary').click();const layer=page.locator('[data-pad-ability="0"]');await layer.selectOption('jutsu7');assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('fabled.pad.abilities.v1'))[0]),'jutsu7');await layer.selectOption('special1');
  const slider=page.locator('[data-experience=deadZone]'),before=Number(await slider.inputValue());await slider.focus();await pulse(15);assert.ok(Number(await slider.inputValue())>before,'D-pad changes a focused sensitivity slider');
  await pulse(1);assert.equal(await page.locator('#experience-dialog').isVisible(),false);
  // Right stick scrolls a focused menu without moving/showing the left-stick cursor.
  await page.evaluate(()=>{document.querySelector('#experience-settings').click();document.querySelector('[data-experience=deadZone]').focus();document.querySelector('#experience-dialog').scrollTop=0;window.testPads[0].axes[3]=1;});
  await page.waitForFunction(()=>document.querySelector('#experience-dialog').scrollTop>15);
  await page.evaluate(()=>window.testPads[0].axes[3]=0);await page.waitForTimeout(100);const stopped=await page.locator('#experience-dialog').evaluate(n=>n.scrollTop);await page.waitForTimeout(100);assert.equal(await page.locator('#experience-dialog').evaluate(n=>n.scrollTop),stopped,'right-stick scrolling stops on release');assert.equal(await page.locator('#controller-cursor').isVisible(),false,'scrolling does not activate the cursor');
  await page.evaluate(()=>document.querySelector('#experience-dialog').close());
  // Left-stick cursor selects an actual modal button and disappears in combat.
  await page.evaluate(()=>document.querySelector('#experience-settings').click());
  await page.evaluate(()=>{document.querySelector('#experience-close').scrollIntoView({block:'center'});window.testPads[0].axes[0]=.7;});await page.waitForSelector('#controller-cursor:visible');
  await page.evaluate(()=>new Promise(resolve=>{const timer=setInterval(()=>{const cursor=document.querySelector('#controller-cursor').getBoundingClientRect(),button=document.querySelector('#experience-close').getBoundingClientRect(),dx=button.x+button.width/2-(cursor.x+cursor.width/2),dy=button.y+button.height/2-(cursor.y+cursor.height/2);const axis=d=>Math.abs(d)<6?0:Math.sign(d)*Math.max(.38,Math.min(.8,Math.abs(d)/100));window.testPads[0].axes[0]=axis(dx);window.testPads[0].axes[1]=axis(dy);if(Math.abs(dx)<8&&Math.abs(dy)<8){window.testPads[0].axes[0]=window.testPads[0].axes[1]=0;clearInterval(timer);resolve();}},30);setTimeout(()=>{clearInterval(timer);resolve();},12000);}));
  await page.waitForFunction(()=>document.querySelector('#experience-close').classList.contains('controller-hover'));await pulse(0);assert.equal(await page.locator('#experience-dialog').isVisible(),false);
  await page.evaluate(()=>document.querySelector('#play').click());await page.waitForTimeout(100);assert.equal(await page.locator('#controller-cursor').isVisible(),false,'combat keeps the right stick for aiming');
  // Simulated disconnection immediately restores the touch deck.
  await page.evaluate(()=>window.testPads=[]);await page.waitForFunction(()=>!document.querySelector('.arena').classList.contains('controller-view'));
  assert.equal(await page.locator('#joystick').isVisible(),true);assert.deepEqual(errors,[]);
  // Adventures share the exact same input-mode and expanded-viewport behavior.
  await page.goto('http://127.0.0.1:4207/adventures.html');await page.click('#start-story');await page.click('#story-next');
  await page.evaluate(()=>{window.testPads=[{index:0,id:'Xbox',connected:true,axes:[.8,0,0,0],buttons:Array.from({length:16},()=>({pressed:false}))}];});
  await page.waitForSelector('.adventure-arena.controller-view');await page.waitForTimeout(250);
  assert.equal(await page.locator('#joystick').isVisible(),false);assert.match(await page.locator('#controller-hint').innerText(),/LB.*RB/);
  await page.screenshot({path:`test-results/controller-adventure-${viewport.width}.png`});assert.deepEqual(errors,[]);
  // Local setup routes the second pad to P2 and protects the shared editor.
  await page.goto('http://127.0.0.1:4207');await page.waitForFunction(()=>document.documentElement.dataset.gameReady==='true');await selectGame(page,'#mode','local');
  await page.evaluate(()=>{window.testPads=[0,1].map(index=>({index,id:'Xbox '+index,connected:true,axes:[0,0,0,0],buttons:Array.from({length:16},()=>({pressed:false}))}));});
  const press=async(slot,button)=>{await page.evaluate(({slot,button})=>window.testPads[slot].buttons[button].pressed=true,{slot,button});await page.waitForTimeout(80);await page.evaluate(({slot,button})=>window.testPads[slot].buttons[button].pressed=false,{slot,button});await page.waitForTimeout(60);};
  await page.waitForFunction(()=>document.documentElement.dataset.setupControllers==='paired');
  const p1=await page.locator('#character0 input:checked').inputValue();await press(1,13);await press(1,0);
  assert.equal(await page.locator('#character1 input:checked').inputValue(),await page.locator('#character1 input').first().inputValue(),'pad 2 selects its own fighter');assert.equal(await page.locator('#character0 input:checked').inputValue(),p1);
  const p2=await page.locator('#weapon1').inputValue();await page.locator('#weapon1').focus();await press(0,15);assert.equal(await page.locator('#weapon1').inputValue(),p2,'pad 1 cannot change P2 equipment');
  await page.evaluate(()=>{document.querySelector('#game-menu').open=false;document.querySelector('#edit-loadout1').click();});
  await press(0,1);assert.equal(await page.locator('#loadout-book').isVisible(),true,'pad 1 cannot cancel P2 editor');await press(1,1);assert.equal(await page.locator('#loadout-book').isVisible(),false,'pad 2 owns its editor');
  // Both player cursors can appear independently while on the setup screen.
  await page.evaluate(()=>{window.testPads[0].axes[0]=.5;window.testPads[1].axes[0]=-.5;});await page.waitForSelector('#controller-cursor:visible');await page.waitForSelector('#controller-cursor-p2:visible');await page.evaluate(()=>window.testPads.forEach(p=>p.axes=[0,0,0,0]));
  assert.deepEqual(errors,[]);
  await context.close();
 }
 console.log('Controller mobile portrait/landscape and adventure checks passed');
}finally{await browser?.close();server.kill();}
