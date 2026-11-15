import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const server=spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,PORT:'4227'},stdio:['ignore','pipe','inherit']});let browser;
try{
 await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
 await mkdir('test-results',{recursive:true});
 for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390},{width:768,height:1024}]){
  const context=await browser.newContext({viewport,deviceScaleFactor:2}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4227');await page.click('#entry-guest');
  assert.equal(await page.locator('#character0 .character-card:not([hidden]) img[data-painted-portrait]').count(),10);
  for(const id of ['silent','winta','dora','aren','eira','kael','nyra','rook','veyra','oryn']){
   const image=page.locator(`#character0 img[data-painted-portrait=${id}]`);await image.scrollIntoViewIfNeeded();
   await image.evaluate(img=>img.decode());assert.ok(await image.evaluate(img=>img.naturalWidth>0));
   assert.match(await image.evaluate(img=>img.currentSrc),/painted-v1\/portraits\/.*\.png$/);
  }
  await page.locator('#character0 input[value=dora]').check();await page.click('#play');
  for(const id of ['skyglass','frost','forge','grove','court']){
   const card=page.locator(`.stage-card[data-stage=${id}]`);await card.scrollIntoViewIfNeeded();await card.locator('img').evaluate(img=>img.decode());
   assert.ok(await card.locator('img').evaluate(img=>img.naturalWidth>0));
  }
  await page.locator('.stage-card[data-stage=court]').click();await page.click('#play');
  await page.waitForFunction(()=>document.querySelector('[data-practice-art]:not([hidden])')?.dataset.paintedStage==='court');
  await page.screenshot({path:`test-results/painted-art-${viewport.width}x${viewport.height}.png`});
  assert.deepEqual(errors,[]);await context.close();
 }
 // A failed thumbnail keeps stage selection playable using procedural scenery.
 const page=await browser.newPage();await page.route('**/painted-v1/stages/forge-*.png',route=>route.abort());await page.goto('http://127.0.0.1:4227');await page.click('#entry-guest');await page.click('#play');await page.locator('.stage-card[data-stage=forge]').scrollIntoViewIfNeeded();await page.locator('[data-stage=forge] svg').waitFor();await page.locator('.stage-card[data-stage=forge]').click();assert.equal(await page.locator('.stage-card[data-stage=forge]').getAttribute('aria-pressed'),'true');
 console.log('Painted art: ten original PNG portraits, five stage previews, four viewports, live painted stage and failed-image fallback passed.');
}finally{await browser?.close();server.kill();}
