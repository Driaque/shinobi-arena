import {legacyRoster} from './loadout-helper.mjs';
import {equip} from './loadout-helper.mjs';
import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const baseURL=process.env.ONLINE_TEST_URL||'http://127.0.0.1:4185';
const server=process.env.ONLINE_TEST_URL?null:spawn(process.execPath,['apps/server/index.js'],{env:{...process.env,PORT:'4185'},stdio:['ignore','pipe','inherit']});
let browser;
const proxyURL=process.env.ONLINE_TEST_USE_PROXY==='1'&&process.env.HTTPS_PROXY?new URL(process.env.HTTPS_PROXY):null;
const proxy=proxyURL?{server:proxyURL.origin,username:decodeURIComponent(proxyURL.username),password:decodeURIComponent(proxyURL.password)}:undefined;
try{
 if(server)await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);server.once('exit',c=>reject(new Error(`Server exited ${c}`)));});
 browser=await chromium.launch({args:['--enable-unsafe-swiftshader'],headless:true,proxy,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader',...(proxyURL?['--ignore-certificate-errors']:[])]}: {})});
 const errors=[];const context1=await browser.newContext({ignoreHTTPSErrors:Boolean(proxyURL),viewport:{width:1280,height:900}}),context2=await browser.newContext({ignoreHTTPSErrors:Boolean(proxyURL),viewport:{width:844,height:390},isMobile:true,hasTouch:true});
 const p=await context1.newPage(),q=await context2.newPage();let snapshot;
 q.on('websocket',socket=>socket.on('framereceived',({payload})=>{try{const msg=JSON.parse(payload);if(msg.state)snapshot=msg.state;}catch{}}));
 const near=async()=>{const until=Date.now()+5000;while(Date.now()<until){if(snapshot&&Math.abs(snapshot.fighters[0].x-snapshot.fighters[1].x)<=60)return;await new Promise(r=>setTimeout(r,20));}throw new Error(`Did not approach: ${snapshot?.fighters.map(f=>f.x)}`);};
 for(const page of [p,q]){if(process.env.ONLINE_TEST_URL)page.on('console',m=>{if(m.type()==='error')console.error(m.text());});page.on('pageerror',e=>{errors.push(e.stack);console.error(e.stack);});await page.addInitScript(()=>localStorage.setItem('shinobi.experience.v1',JSON.stringify({prediction:true})));await page.goto(baseURL);await legacyRoster(page);await page.selectOption('#mode','online');}
 await p.fill('#player-name','Silent');await p.locator('#character0 input[value=silent]').check();await equip(p,'#weapon0','tachi');await equip(p,'#weapon-secondary0','kaiken');await equip(p,'#item0-0','smokeBomb');
 await p.click('#play');await p.waitForFunction(()=>document.querySelector('#online-status').textContent.includes('Waiting for an opponent'));assert.equal(await p.locator('#online-cancel').isVisible(),true);
 await p.click('#online-cancel');await p.waitForFunction(()=>document.querySelector('#play').disabled===false);await p.click('#play');await p.waitForFunction(()=>document.querySelector('#online-status').textContent.includes('Waiting for an opponent'));
 await q.fill('#player-name','AquaPrincess');await q.locator('#character0 input[value=dora]').check();await equip(q,'#weapon0','fans');await equip(q,'#weapon-secondary0','tachi');await equip(q,'#item0-0','poison');await q.click('#play');
 for(const page of [p,q]){await page.waitForFunction(()=>document.querySelector('#overlay-title').textContent==='Silent vs AquaPrincess');await page.waitForFunction(()=>document.querySelector('#overlay').hidden,{timeout:10000});}
 assert.match(await p.locator('#name0').innerText(),/Silent · Silent/);assert.match(await q.locator('#name1').innerText(),/AquaPrincess · Dora/);assert.match(await q.locator('#weapon-label').innerText(),/BLADED FANS/);assert.match(await q.locator('#mode-name').innerText(),/P2/);
 const observerContext=await browser.newContext({viewport:{width:1000,height:750}}),observer=await observerContext.newPage();observer.on('pageerror',e=>errors.push(e.stack));await observer.goto(baseURL);await observer.click('#arena-hub');await observer.getByRole('button',{name:'Watch live',exact:true}).first().click();await observer.waitForFunction(()=>document.querySelector('#replay-canvas').dataset.presentation==='selected-pixi');assert.match(await observer.locator('#viewer-status').innerText(),/LIVE/);await observer.click('#hub-close');assert.equal(await observer.locator('.replay-stage [data-practice-art]').count(),0);await observerContext.close();
 // A missing icon/stale asset must not kill the process or interrupt an active match.
 const missing=await p.request.get(new URL('/missing-browser-icon-regression.png',baseURL).href);assert.equal(missing.status(),404);
 const health=await p.request.get(new URL('/health',baseURL).href);assert.equal(health.status(),200);assert.ok((await health.json()).matches>=1);
 await p.keyboard.press('KeyF');await p.waitForFunction(()=>document.querySelector('#weapon-label').textContent.includes('KAIKEN'));
 await q.locator('[data-action=swapWeapon]').tap();await q.waitForFunction(()=>document.querySelector('#weapon-label').textContent.includes('TACHI'));
 await p.keyboard.press('KeyX');await p.waitForFunction(()=>document.querySelector('#inventory-status0').textContent.includes('3/4 ITEMS'));
 await q.locator('[data-action=useItem]').tap();await q.waitForFunction(()=>document.querySelector('#effects1').textContent.includes('POISON COATED'));
 assert.equal(snapshot.fighters[1].character,'dora');assert.match(await p.locator('#network-quality').innerText(),/movement prediction/);
 // Each device drives its own slot. Walk toward each other, then confirm real damage.
 await p.keyboard.down('KeyD');const cdp=await context2.newCDPSession(q),stick=await q.locator('#joystick').boundingBox();
 const center={x:stick.x+stick.width/2,y:stick.y+stick.height/2,id:1},left={...center,x:center.x-stick.width*.4};
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[left]});
 await near();await p.keyboard.up('KeyD');await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 for(let i=0;i<3;i++){await p.keyboard.press('KeyJ',{delay:80});await p.waitForTimeout(230);}
 await p.waitForFunction(()=>Number(document.querySelector('#hp1').textContent)<1000);
 // Knockback creates distance. Approach again before the mobile player attacks.
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[left]});await near();await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await q.waitForTimeout(150);
 // State is shared by both independent sessions; the mobile player can attack too.
 const attack=await q.locator('[data-action=attack]').boundingBox(),point={x:attack.x+attack.width/2,y:attack.y+attack.height/2,id:2};
 for(let i=0;i<2;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});await q.waitForTimeout(80);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await q.waitForTimeout(250);}
 await q.waitForFunction(()=>Number(document.querySelector('#hp0').textContent)<1000);
 await p.waitForFunction(hp=>document.querySelector('#hp0').textContent===hp,await q.locator('#hp0').innerText());
 assert.equal(await p.locator('#hp1').innerText(),await q.locator('#hp1').innerText());
 await q.waitForTimeout(500);await q.locator('[data-action=special1]').tap();await p.waitForFunction(()=>document.querySelector('#effects0').textContent.includes('WEAKEN'));
 await mkdir('test-results',{recursive:true});await p.screenshot({path:'test-results/online-desktop.png'});await q.screenshot({path:'test-results/online-mobile.png'});
 await q.setViewportSize({width:390,height:844});await q.locator('#landscape-tip').waitFor({state:'visible'});assert.equal(await q.locator('#rotate').isVisible(),false);assert.equal(await q.locator('#game').evaluate(el=>el.inert),false);assert.equal(await q.locator('#overlay').isVisible(),false);await q.setViewportSize({width:844,height:390});await q.locator('#rotate').waitFor({state:'hidden'});assert.equal(await q.locator('#overlay').isVisible(),false);
 await q.close();await p.waitForFunction(()=>document.querySelector('#overlay-description').textContent.includes('win by forfeit'));assert.equal(await p.locator('#play').innerText(),'Find opponent');
 await p.click('#play');await p.waitForFunction(()=>document.querySelector('#online-status').textContent.includes('Waiting for an opponent'));await p.click('#online-cancel');
 await p.selectOption('#mode','cpu');await p.click('#play');assert.equal(await p.locator('#overlay').isVisible(),false);assert.deepEqual(errors,[]);
 const unconfigured=await context1.newPage();await unconfigured.route('**/online-config.json',route=>route.fulfill({contentType:'application/json',body:'{"url":""}'}));await unconfigured.goto(baseURL);await legacyRoster(unconfigured);await unconfigured.selectOption('#mode','online');await unconfigured.fill('#player-name','Player');await unconfigured.click('#play');assert.match(await unconfigured.locator('#online-status').innerText(),/needs its multiplayer server/);assert.equal(await unconfigured.locator('#play').isDisabled(),false);await unconfigured.close();
 console.log('Online matchmaking: queue cancellation, two devices, character kits, mobile P2 control, shared damage, disconnect and requeue passed.');
}finally{await browser?.close();server?.kill();}
