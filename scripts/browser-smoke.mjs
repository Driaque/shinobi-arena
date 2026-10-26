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
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.clock.install();
 await page.goto('http://127.0.0.1:4183');
 await page.selectOption('#mode','local');await page.click('#play');
 await page.keyboard.down('KeyD');await page.clock.runFor(1700);await page.keyboard.up('KeyD');
 await page.keyboard.down('KeyJ');await page.clock.runFor(40);await page.keyboard.up('KeyJ');await page.clock.runFor(200);
 assert.equal(await page.locator('#hp1').innerText(),'935','basic attack damages opponent');
 await page.keyboard.press('KeyP');assert.equal(await page.locator('#play').innerText(),'Resume match');
 const timer=await page.locator('#timer').innerText();await page.clock.runFor(3000);
 assert.equal(await page.locator('#timer').innerText(),timer,'pause freezes timer');
 await page.click('#play');
 // A real complete match, using local P1 attacks against idle P2.
 for(let round=0;round<2;round++){
   for(let attack=0;attack<22;attack++){
     if(await page.locator('#overlay').isVisible())break;
     await page.keyboard.down('KeyD');await page.clock.runFor(attack===0?1700:120);await page.keyboard.up('KeyD');
     await page.keyboard.down('KeyJ');await page.clock.runFor(40);await page.keyboard.up('KeyJ');await page.clock.runFor(400);
   }
   assert.equal(await page.locator('#overlay').isVisible(),true,'round ends');
   assert.match(await page.locator('#overlay-title').innerText(),/Naruto wins/);
   assert.equal(await page.locator('#play').innerText(),round===0?'Next round':'Rematch');
   await page.click('#play');
 }
 await page.clock.runFor(180);
 assert.equal(await page.locator('#hp0').innerText(),'1000');assert.equal(await page.locator('#hp1').innerText(),'1000');
 await page.screenshot({path:'test-results/desktop.png'});
 // CPU actually wins a round against an idle player, using the full browser loop.
 await page.selectOption('#mode','cpu');await page.click('#play');await page.clock.runFor(15000);
 assert.equal(await page.locator('#overlay').isVisible(),true);
 assert.match(await page.locator('#overlay-title').innerText(),/Sasuke wins/);
 assert.deepEqual(errors,[],'no desktop page errors');await page.close();
 const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});
 const mobile=await context.newPage();const mobileErrors=[];mobile.on('pageerror',e=>mobileErrors.push(e.message));
 await mobile.clock.install();await mobile.goto('http://127.0.0.1:4183');await mobile.click('#play');
 const cdp=await context.newCDPSession(mobile);
 const box1=await mobile.locator('[data-action=right]').boundingBox(),box2=await mobile.locator('[data-action=attack]').boundingBox();
 const point=(box,id)=>({x:box.x+box.width/2,y:box.y+box.height/2,id});
 const p1=point(box1,1),p2=point(box2,2);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p1]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[p1,p2]});
 assert.ok((await mobile.locator('[data-action=right]').getAttribute('class')).includes('active'));
 assert.ok((await mobile.locator('[data-action=attack]').getAttribute('class')).includes('active'));
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[p2]});
 await mobile.clock.runFor(32);
 assert.ok((await mobile.locator('[data-action=right]').getAttribute('class')).includes('active'),'releasing attack preserves movement');
 assert.ok(!(await mobile.locator('[data-action=attack]').getAttribute('class')).includes('active'));
 await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await mobile.clock.runFor(32);
 assert.ok(!(await mobile.locator('[data-action=right]').getAttribute('class')).includes('active'),'cancel clears held pointer');
 await mobile.setViewportSize({width:390,height:844});await mobile.clock.runFor(100);
 assert.equal(await mobile.locator('#rotate').isVisible(),true);
 assert.equal(await mobile.locator('#game').evaluate(el=>el.inert),true);
 await mobile.setViewportSize({width:844,height:390});await mobile.clock.runFor(100);
 assert.equal(await mobile.locator('#rotate').isVisible(),false);
 assert.equal(await mobile.locator('#play').innerText(),'Resume match');
 await mobile.click('#play');await mobile.clock.runFor(100);
 await mobile.screenshot({path:'test-results/mobile-landscape.png'});
 for(const button of await mobile.locator('[data-action]').all()){
  const box=await button.boundingBox();assert.ok(box.width>=48&&box.height>=48,'touch targets are at least 48px');
  assert.ok(box.x>=0&&box.x+box.width<=844&&box.y>=0&&box.y+box.height<=390,'touch targets fit landscape viewport');
 }
 assert.deepEqual(mobileErrors,[],'no mobile page errors');await context.close();
 console.log('Browser checks passed: local match, rematch, pause, multi-touch, cancellation, portrait gate, landscape resume and control bounds.');
} finally {if(browser)await browser.close();server.kill();}
