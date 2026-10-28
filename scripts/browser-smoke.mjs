import {equip} from './loadout-helper.mjs';
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const server=spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,PORT:'4183'},stdio:['ignore','pipe','inherit']});
let browser;
try {
 await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',code=>reject(new Error(`Server exited: ${code}`)));});
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage']}: {})});
 await mkdir('test-results',{recursive:true});
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 const errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.stack);});
 await page.clock.install({time:new Date('2030-01-01T00:00:00Z')});
 await page.clock.pauseAt(new Date('2030-01-01T00:00:01Z'));
 await page.goto('http://127.0.0.1:4183');
 assert.equal(await page.locator('#difficulty').inputValue(),'easy','new players start on Easy');
 assert.equal(await page.locator('#difficulty option').count(),4);
 for(const level of ['medium','difficult','xtreme','easy']){await page.selectOption('#difficulty',level);await page.clock.runFor(32);assert.match(await page.locator('#mode-name').innerText(),new RegExp(level.toUpperCase()));}
 await page.reload();assert.equal(await page.locator('#difficulty').inputValue(),'easy','difficulty persists on reload');
 assert.equal(await page.locator('#character0 input[type=radio]').count(),19);
 assert.equal(await page.locator('#character1 input[type=radio]').count(),19);
 await page.selectOption('#roster-era','TNR');assert.equal(await page.locator('.character-card:not([hidden])').count(),6);
 await page.locator('#character0 input[value="silent"]').check();await page.locator('#character1 input[value="winta"]').check();
 for(const img of await page.locator('.concept-portrait').all())assert.ok(await img.evaluate(el=>el.complete&&el.naturalWidth>0),'concept image loaded');
 assert.match(await page.locator('#kit0').innerText(),/Cold Metal Ascendant.*proposed/);
 await page.screenshot({path:'test-results/originals-roster.png'});
 await page.selectOption('#roster-era','all');
 await page.locator('#roster-search').fill('Boruto');assert.equal(await page.locator('.character-card:not([hidden])').count(),2);
 await page.locator('#roster-search').fill('');await page.selectOption('#roster-era','Boruto');assert.equal(await page.locator('.character-card:not([hidden])').count(),8);
 await page.locator('#character0 input[value="boruto"]').check();await page.locator('#character1 input[value="kawaki"]').check();
 assert.equal(await page.locator('#selected0').innerText(),'Boruto');assert.equal(await page.locator('#selected1').innerText(),'Kawaki');
 await page.selectOption('#roster-era','all');await page.locator('#character1 input[value="sasuke"]').check();
 await page.locator('#character0 input[value="hinata"]').check();
 assert.equal(await page.locator('#selected0').innerText(),'Hinata');
 assert.equal(await page.locator('#character1 input:checked').inputValue(),'sasuke','P1 selection does not change opponent');
 await page.locator('#character0 input[value="naruto"]').check();
 await page.locator('#character0 input:checked').focus();await page.keyboard.press('ArrowRight');
 assert.equal(await page.locator('#selected0').innerText(),'Sasuke','native keyboard navigation selects a character');
 assert.equal(await page.locator('#character1 input:checked').inputValue(),'sasuke');
 await page.locator('#character0 input[value="naruto"]').check();
 await page.selectOption('#mode','local');
 assert.equal(await page.locator('#opponent-label').innerText(),'PLAYER TWO');
 assert.equal(await page.locator('#difficulty').isDisabled(),true,'local P2 ignores CPU difficulty');
 assert.equal(await page.locator('#character1 .pick-mark').first().innerText(),'P2');
 await page.click('#play');
 await page.keyboard.down('KeyD');await page.clock.runFor(1700);await page.keyboard.up('KeyD');
 await page.keyboard.down('KeyJ');await page.clock.runFor(40);await page.keyboard.up('KeyJ');await page.clock.runFor(200);
 assert.equal(await page.locator('#hp1').innerText(),'935','basic attack damages opponent');
 await page.keyboard.press('KeyP');assert.equal(await page.locator('#play').innerText(),'Resume match');
 const timer=await page.locator('#timer').innerText();await page.clock.runFor(3000);
 assert.equal(await page.locator('#timer').innerText(),timer,'pause freezes timer');
 await page.click('#play');
 // Timed basic taps form a visible hit-confirm chain.
 await page.clock.runFor(500);
 await page.keyboard.down('KeyD');await page.clock.runFor(200);await page.keyboard.up('KeyD');
 await page.keyboard.down('KeyJ');await page.clock.runFor(100);await page.keyboard.up('KeyJ');await page.clock.runFor(16);
 await page.keyboard.down('KeyJ');await page.clock.runFor(100);await page.keyboard.up('KeyJ');await page.clock.runFor(100);
 await page.keyboard.down('KeyJ');await page.clock.runFor(200);await page.keyboard.up('KeyJ');
 assert.match(await page.locator('#combo0').innerText(),/3 HITS/);await page.screenshot({path:'test-results/combo.png'});
 // A real complete match, using local P1 attacks against idle P2.
 for(let round=0;round<2;round++){
   for(let attack=0;attack<22;attack++){
     if(await page.locator('#overlay').isVisible())break;
     await page.keyboard.down('KeyD');await page.clock.runFor(attack===0?1700:120);await page.keyboard.up('KeyD');
     await page.keyboard.down('KeyJ');await page.clock.runFor(40);await page.keyboard.up('KeyJ');await page.clock.runFor(1100);
   }
   assert.equal(await page.locator('#overlay').isVisible(),true,'round ends');
   assert.match(await page.locator('#overlay-title').innerText(),/Naruto wins/);
   assert.equal(await page.locator('#play').innerText(),round===0?'Next round':'Rematch');
   await page.click('#play');
 }
 await page.clock.runFor(180);
 assert.equal(await page.locator('#hp0').innerText(),'1000');assert.equal(await page.locator('#hp1').innerText(),'1000');
 await page.screenshot({path:'test-results/desktop.png'});
 // Pre-battle choices are used by the simulation and action HUD.
 await page.selectOption('#mode','cpu');await page.locator('#character0 input[value="hinata"]').check();await equip(page,'#weapon0','katana');
 await page.locator('#character1 input[value="orochimaru"]').check();await equip(page,'#weapon1','shuriken');
 await page.screenshot({path:'test-results/loadouts.png'});await page.click('#play');await page.clock.runFor(32);
 assert.equal(await page.locator('#name0').innerText(),'HINATA');assert.equal(await page.locator('#name1').innerText(),'OROCHIMARU');
 assert.match(await page.locator('#weapon-label').innerText(),/KATANA/);assert.equal(await page.locator('#bl-name').innerText(),'BYAKUGAN');
 await page.keyboard.down('KeyO');await page.clock.runFor(180);await page.keyboard.up('KeyO');
 assert.match(await page.locator('#effects0').innerText(),/BYAKUGAN/);
 await page.keyboard.down('KeyR');await page.clock.runFor(32);await page.keyboard.up('KeyR');
 assert.match(await page.locator('#replacement-cd').innerText(),/s/);
 await page.selectOption('#mode','local');await page.locator('#character0 input[value="naruto"]').check();await equip(page,'#weapon0','kunai');
 await page.locator('#character1 input[value="sasuke"]').check();await equip(page,'#weapon1','kunai');
 // CPU actually wins a round against an idle player, using the full browser loop.
 await page.selectOption('#mode','cpu');await page.selectOption('#difficulty','xtreme');await page.click('#play');await page.clock.runFor(25000);
 assert.equal(await page.locator('#overlay').isVisible(),true);
 assert.match(await page.locator('#overlay-title').innerText(),/Sasuke wins/);
 // Actual damage from seven basic hits charges Naruto's form; no debug state injection.
 await page.selectOption('#mode','local');await page.click('#play');
 await page.keyboard.down('ArrowLeft');await page.clock.runFor(1700);await page.keyboard.up('ArrowLeft');
 for(let n=0;n<7;n++){
   await page.keyboard.down('ArrowLeft');await page.clock.runFor(120);await page.keyboard.up('ArrowLeft');
   await page.keyboard.down('KeyN');await page.clock.runFor(40);await page.keyboard.up('KeyN');await page.clock.runFor(1100);
 }
 assert.match(await page.locator('#awakening-label0').innerText(),/READY/);
 await page.keyboard.down('KeyT');await page.clock.runFor(40);await page.keyboard.up('KeyT');
 assert.match(await page.locator('#awakening-label0').innerText(),/KURAMA CHAKRA MODE/);
 assert.match(await page.locator('#s1-name').innerText(),/KURAMA/);assert.match(await page.locator('#s2-name').innerText(),/CHAKRA CLAW/);
 await page.screenshot({path:'test-results/kurama.png'});await page.clock.runFor(10100);
 assert.equal(await page.locator('#awakening-label0').innerText(),'AWAKENING USED');assert.equal(await page.locator('#s1-name').innerText(),'RASENGAN');
 // Original fighters use their selected weapons, signatures and bloodlines in live gameplay.
 await page.selectOption('#mode','cpu');await page.selectOption('#mode','local');
 await page.selectOption('#roster-era','TNR');await page.locator('#character0 input[value="silent"]').check();await page.locator('#character1 input[value="winta"]').check();
 await equip(page,'#weapon0','tachi');await equip(page,'#weapon1','kaiken');await page.click('#play');await page.clock.runFor(32);
 assert.equal(await page.locator('#name0').innerText(),'SILENT');assert.equal(await page.locator('#name1').innerText(),'WINTA');
 assert.equal(await page.locator('#bl-name').innerText(),'TETSUGAN');assert.match(await page.locator('#weapon-label').innerText(),/TACHI/);
 await page.keyboard.down('KeyO');await page.clock.runFor(450);await page.keyboard.up('KeyO');assert.match(await page.locator('#effects0').innerText(),/TETSUGAN GUARD/);
 await page.keyboard.down('ArrowLeft');await page.clock.runFor(1550);await page.keyboard.up('ArrowLeft');
 await page.keyboard.down('KeyK');await page.keyboard.down('KeyN');await page.clock.runFor(140);await page.keyboard.up('KeyN');
 assert.ok(Number(await page.locator('#hp1').innerText())<1000,'Silent reflects a guarded sword strike');assert.match(await page.locator('#effects0').innerText(),/COUNTER READY/);
 await page.keyboard.up('KeyK');await page.screenshot({path:'test-results/originals-combat.png'});
 assert.deepEqual(errors,[],'no desktop page errors');await page.close();
 const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
 const mobile=await context.newPage();const mobileErrors=[];mobile.on('pageerror',e=>mobileErrors.push(e.message));
 await mobile.clock.install({time:new Date('2030-01-01T00:00:00Z')});await mobile.clock.pauseAt(new Date('2030-01-01T00:00:01Z'));await mobile.goto('http://127.0.0.1:4183');await mobile.screenshot({path:'test-results/mobile-loadouts.png'});
 await mobile.selectOption('#roster-era','TNR');await mobile.locator('#character0 input[value="silent"]').check();await mobile.locator('#character1 input[value="winta"]').check();
 await mobile.screenshot({path:'test-results/mobile-originals.png'});await mobile.selectOption('#roster-era','all');
 await mobile.setViewportSize({width:667,height:375});await mobile.clock.runFor(32);
 await mobile.screenshot({path:'test-results/small-mobile-roster.png'});
 for(const card of await mobile.locator('.character-card').all()){
   const r=await card.boundingBox();assert.ok(r.x>=0&&r.x+r.width<=667&&r.height>=48,'roster cards fit a small landscape phone');
 }
 await mobile.setViewportSize({width:844,height:390});await mobile.clock.runFor(32);
 await mobile.locator('#character0 input[value="sasuke"]').check();await mobile.locator('#character1 input[value="sasuke"]').check();
 assert.equal(await mobile.locator('#selected0').innerText(),'Sasuke');assert.equal(await mobile.locator('#selected1').innerText(),'Sasuke');
 await mobile.locator('#character0 input[value="naruto"]').check();await mobile.click('#play');
 assert.equal(await mobile.locator('#difficulty').inputValue(),'easy');
 await mobile.clock.runFor(500);assert.equal(await mobile.locator('#hp0').innerText(),'1000','Easy opening leaves room to learn');
 await mobile.selectOption('#difficulty','medium');await mobile.clock.runFor(32);assert.equal(await mobile.locator('#play').innerText(),'Resume match');
 const keptHp=await mobile.locator('#hp0').innerText();await mobile.selectOption('#difficulty','easy');await mobile.click('#play');await mobile.clock.runFor(32);assert.equal(await mobile.locator('#hp0').innerText(),keptHp,'difficulty change preserves the fight');
 await mobile.screenshot({path:'test-results/mobile-difficulty.png'});
 const cdp=await context.newCDPSession(mobile);
 const box1=await mobile.locator('#joystick').boundingBox(),box2=await mobile.locator('[data-action=attack]').boundingBox();
 const point=(box,id)=>({x:box.x+box.width/2,y:box.y+box.height/2,id});
 const p1={...point(box1,1),x:box1.x+box1.width*.78},p2=point(box2,2);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p1]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p1,p2]});
 assert.ok((await mobile.locator('#joystick').getAttribute('class')??'').includes('active'));
 assert.ok((await mobile.locator('[data-action=attack]').getAttribute('class')).includes('active'));
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[p2]});
 await mobile.clock.runFor(32);
 assert.ok((await mobile.locator('#joystick').getAttribute('class')??'').includes('active'),'releasing attack preserves analog movement');
 assert.ok(!(await mobile.locator('[data-action=attack]').getAttribute('class')).includes('active'));
 await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await mobile.clock.runFor(32);
 assert.ok(!(await mobile.locator('#joystick').getAttribute('class')??'').includes('active'),'cancel clears held analog pointer');
 await mobile.setViewportSize({width:390,height:844});await mobile.clock.runFor(100);
 assert.equal(await mobile.locator('#rotate').isVisible(),true);
 assert.equal(await mobile.locator('#game').evaluate(el=>el.inert),true);
 await mobile.setViewportSize({width:844,height:390});await mobile.clock.runFor(100);
 assert.equal(await mobile.locator('#rotate').isVisible(),false);
 assert.equal(await mobile.locator('#play').innerText(),'Resume match');
 await mobile.click('#play');await mobile.clock.runFor(100);
 await mobile.screenshot({path:'test-results/mobile-landscape.png'});
 // Edit the touch layout, rebind a key, and persist both on this device.
 // Dock targets never cover the actual battle viewport, even at the arena edges.
 const fight=await mobile.locator('.battle-view').boundingBox();
 for(const control of await mobile.locator('[data-control]').all()){const rect=await control.boundingBox();assert.ok(rect.y>=fight.y+fight.height,'control stays below fighting viewport');}
 assert.equal(await mobile.locator('.arena').getAttribute('data-control-placement'),'dock');
 await mobile.clock.runFor(550); // Finish the earlier basic attack before testing free movement.
 // Actual touch jump and air dash through independent pointers; no injected combat state.
 const jumpBox=await mobile.locator('[data-action=jump]').boundingBox(),dashBox=await mobile.locator('[data-action=dashForward]').boundingBox();
 const jumpPoint=point(jumpBox,10),dashPoint=point(dashBox,11);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[jumpPoint]});await mobile.clock.runFor(32);
 assert.match(await mobile.locator('#movement-state').innerText(),/AIR/);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[jumpPoint,dashPoint]});await mobile.clock.runFor(32);
 assert.equal(await mobile.locator('#movement-state').innerText(),'AIR DASH');
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await mobile.clock.runFor(1400);
 // Repeated touch taps keep the visual viewport scale and page position stable.
 const scale=await mobile.evaluate(()=>visualViewport.scale),scroll=await mobile.evaluate(()=>scrollY);
 for(let i=0;i<8;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[jumpPoint]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await mobile.clock.runFor(35);}
 assert.equal(await mobile.evaluate(()=>visualViewport.scale),scale);assert.equal(await mobile.evaluate(()=>scrollY),scroll);
 assert.equal(await mobile.locator('.controls').evaluate(el=>getComputedStyle(el).touchAction),'none');
 await mobile.screenshot({path:'test-results/mobile-control-deck.png'});
 await mobile.click('#control-settings');assert.equal(await mobile.locator('#layout-editor').isVisible(),true);
 const editTimer=await mobile.locator('#timer').innerText();await mobile.clock.runFor(500);assert.equal(await mobile.locator('#timer').innerText(),editTimer);
 await mobile.locator('#control-opacity').evaluate(el=>{el.value='35';el.dispatchEvent(new Event('input',{bubbles:true}));});
 assert.equal(await mobile.locator('#opacity-value').innerText(),'35%');
 await mobile.selectOption('#control-placement','overlay');assert.equal(await mobile.locator('.arena').getAttribute('data-control-placement'),'overlay');
 await mobile.selectOption('#control-placement','dock');
 const attackBefore=await mobile.locator('[data-control=stick]').boundingBox();
 await mobile.mouse.move(attackBefore.x+attackBefore.width/2,attackBefore.y+attackBefore.height/2);await mobile.mouse.down();
 await mobile.mouse.move(attackBefore.x+attackBefore.width/2-10,attackBefore.y+attackBefore.height/2-10,{steps:4});await mobile.mouse.up();
 await mobile.selectOption('#control-select','attack');
 await mobile.locator('#control-size').evaluate(el=>{el.value='68';el.dispatchEvent(new Event('input',{bubbles:true}));});
 await mobile.click('#key-settings');await mobile.locator('[data-bind-player="0"][data-bind-action="jump"]').click();await mobile.keyboard.press('Space');
 assert.match(await mobile.locator('#key-message').innerText(),/Binding changed/);
 // A duplicate binding is rejected without stealing another action's key.
 await mobile.locator('[data-bind-player="0"][data-bind-action="attack"]').click();await mobile.keyboard.press('KeyA');
 assert.match(await mobile.locator('#key-message').innerText(),/already used/);await mobile.keyboard.press('Escape');
 await mobile.click('#close-keys');await mobile.screenshot({path:'test-results/control-editor.png'});await mobile.click('#save-controls');
 assert.equal(await mobile.locator('#layout-editor').isVisible(),false);
 const saved=await mobile.evaluate(()=>localStorage.getItem('shinobi-arena.controls.v1'));assert.ok(saved);
 const prefs=JSON.parse(saved);assert.equal(prefs.opacity,.35);assert.equal(prefs.placement,'dock');assert.equal(prefs.keys[0].Space,'jump');assert.equal(prefs.keys[0].KeyW,undefined);assert.equal(prefs.dockLayouts.medium.attack.size,68);
 await mobile.reload();await mobile.clock.runFor(32);
 assert.equal(Math.round((await mobile.locator('[data-control=attack]').boundingBox()).width),68);
 assert.equal(await mobile.locator('[data-action=jump] small').innerText(),'Space');assert.equal(await mobile.locator('.arena').evaluate(el=>el.style.getPropertyValue('--control-opacity')),'0.35');
 await mobile.click('#play');await mobile.keyboard.down('KeyW');await mobile.clock.runFor(32);
 assert.ok(!(await mobile.locator('[data-action=jump]').getAttribute('class')??'').includes('active'));await mobile.keyboard.up('KeyW');
 await mobile.keyboard.down('Space');await mobile.clock.runFor(32);
 assert.ok((await mobile.locator('[data-action=jump]').getAttribute('class')??'').includes('active'));await mobile.keyboard.up('Space');
 await mobile.click('#control-settings');
 const attackRect=await mobile.locator('[data-control=attack]').boundingBox(),weaponRect=await mobile.locator('[data-control=weapon]').boundingBox();
 await mobile.mouse.move(attackRect.x+attackRect.width/2,attackRect.y+attackRect.height/2);await mobile.mouse.down();
 await mobile.mouse.move(weaponRect.x+weaponRect.width/2,weaponRect.y+weaponRect.height/2,{steps:4});await mobile.mouse.up();
 await mobile.click('#save-controls');assert.equal(await mobile.locator('#layout-editor').isVisible(),true,'overlap prevents saving');
 assert.match(await mobile.locator('#editor-message').innerText(),/Separate/);
 await mobile.locator('#control-opacity').evaluate(el=>{el.value='90';el.dispatchEvent(new Event('input',{bubbles:true}));});
 await mobile.click('#reset-layout');await mobile.click('#cancel-controls');
 assert.equal(await mobile.evaluate(()=>localStorage.getItem('shinobi-arena.controls.v1')),saved,'cancel discards layout reset');
 await mobile.click('#play');await mobile.clock.runFor(32);
 for(const button of await mobile.locator('[data-action]').all()){
  const box=await button.boundingBox();assert.ok(box.width>=48&&box.height>=48,'touch targets are at least 48px');
  assert.ok(box.x>=0&&box.x+box.width<=844&&box.y>=0&&box.y+box.height<=390,'touch targets fit landscape viewport');
 }
 await mobile.setViewportSize({width:667,height:375});await mobile.clock.runFor(32);
 for(const button of await mobile.locator('[data-action]').all()){
   const b=await button.boundingBox();assert.ok(b.width>=48&&b.height>=48&&b.x>=0&&b.x+b.width<=667&&b.y>=0&&b.y+b.height<=375,'controls fit smaller landscape phone: '+JSON.stringify({action:await button.getAttribute('data-action'),box:b}));
 }
 assert.deepEqual(mobileErrors,[],'no mobile page errors');await context.close();
 console.log('Browser checks passed: local match, rematch, pause, multi-touch, cancellation, portrait gate, landscape resume and control bounds.');
} finally {if(browser)await browser.close();server.kill();}


