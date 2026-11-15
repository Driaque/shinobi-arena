import {clickGame,selectGame,openNavigation} from './navigation-helper.mjs';
import {chromium} from 'playwright';import {spawn} from 'node:child_process';import assert from 'node:assert/strict';import {mkdir} from 'node:fs/promises';
const server=spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,PORT:'4202'},stdio:['ignore','pipe','inherit']});let browser;
try{
 await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});await mkdir('test-results',{recursive:true});
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:960},isMobile:mobile,hasTouch:mobile}),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:4202');await p.waitForFunction(()=>document.querySelector('#canvas').dataset.presentation==='selected-pixi');
  for(const stage of ['frost','forge','grove','court','skyglass']){
   if(await p.locator('#loadout-panel').isVisible())await p.locator('#play').click();await p.click(`[data-stage=${stage}]`);
   await p.waitForFunction(id=>document.querySelector('#canvas').dataset.stage===id,stage);
  }
  await p.reload();await p.waitForFunction(()=>document.querySelector('#canvas').dataset.stage==='skyglass');
  const portrait=p.locator('#character0 img[data-painted-portrait=aren]');
  await portrait.scrollIntoViewIfNeeded();await portrait.evaluate(img=>img.decode());
  assert.ok(await portrait.evaluate(img=>img.naturalWidth>0),'painted PNG portrait decodes');
  const source=await portrait.evaluate(img=>img.currentSrc);
  assert.match(source,/painted-v1\/portraits\/aren-\d+\.png$/);
  assert.equal(await p.locator('#character0 [data-character=aren] canvas').count(),0,'original PNG portraits retain full detail');
  await p.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await portrait.evaluate(img=>img.currentSrc),source,'reduced motion preserves the painted portrait');
  await p.emulateMedia({reducedMotion:'no-preference'});
  assert.equal(await p.locator('#include-unreleased').count(),0);assert.equal(await p.locator('#character0 .character-card:visible').count(),35);assert.ok(await p.locator('#character0').evaluate(el=>el.clientHeight>=260),'original grid exposes more rows');assert.equal(await p.locator('#character0 input:checked').inputValue(),'aren');assert.equal(await p.locator('#character1 input:checked').inputValue(),'winta');
  for(const c of ['silent','winta','dora','aren','eira','kael','nyra','rook','veyra','oryn']){await p.locator(`#character0 input[value=${c}]`).check();assert.match(await p.locator('#kit0').innerText(),/Story & connections/);}
  const previewCard=p.locator('#character0 [data-character=solan]');
  assert.equal(await previewCard.getAttribute('data-silhouette'),'true');
  await previewCard.locator('input').check();
  assert.equal(await p.locator('#character0 input:checked').inputValue(),'solan');
  await p.locator('#character0 input[value=vael]').check();
  await p.waitForFunction(()=>document.querySelector('[data-practice-art=pixi]').dataset.fighterModels.split(',').includes('vael'));
  assert.equal(await p.locator('#character0 [data-character=vael]').getAttribute('data-silhouette'),'false');
  await p.locator('#character0 input[value=aren]').check();
  for(const mode of ['cpu','local','training','online']){await selectGame(p,'#mode',mode);if(mode!=='online'){await clickGame(p,'#play');await p.waitForTimeout(100);}await p.waitForFunction(()=>document.querySelector('#canvas').dataset.presentation==='selected-pixi');assert.doesNotMatch(await p.locator('#name1').innerText(),/SPARRING ECHO/);}
  await selectGame(p,'#mode','training');await clickGame(p,'#play');await clickGame(p,'#training-settings');assert.equal(await p.locator('#training-charge').isDisabled(),true,'Aren has no awakening to charge');await p.click('#training-close');await clickGame(p,'#play');await p.screenshot({path:`test-results/global-pixi-${mobile?'portrait':'desktop'}.png`});
  if(mobile){
   await p.waitForSelector('#touch-kit-toggle:visible');
   assert.equal(await p.locator('.arena').getAttribute('data-control-placement'),'expanded');
   for(const size of [{width:390,height:844},{width:844,height:390}]){
    await p.setViewportSize(size);
    await p.waitForFunction(()=>{const a=document.querySelector('.arena').getBoundingClientRect(),b=document.querySelector('.battle-view').getBoundingClientRect();return a.height>innerHeight-85&&Math.abs(a.height-b.height)<1;});
    assert.equal(await p.locator('#combat-techniques').isVisible(),false);
    const stick=await p.locator('#joystick').boundingBox(),attack=await p.locator('[data-action=attack]').boundingBox();
    assert.ok(stick.x+stick.width<attack.x&&attack.y+attack.height<=size.height,'controls stay apart and on-screen');
    await p.locator('[data-action=jump]').tap();
    await p.waitForFunction(()=>document.querySelector('#movement-state').textContent.includes('AIR'));
    await p.locator('#touch-kit-toggle').tap();
    assert.equal(await p.locator('#touch-kit-toggle').getAttribute('aria-expanded'),'true');
    assert.match(await p.locator('#touch-kit-toggle').innerText(),/items?.*jutsu ready/);
    assert.equal(await p.locator('#jutsu-tray [data-action=weapon]').isVisible(),true);
    const item=await p.locator('#item-cycle-meta').innerText();
    await p.locator('#jutsu-tray [data-action=cycleItem]').tap();
    await p.waitForFunction(item=>document.querySelector('#item-cycle-meta').textContent!==item,item);
    await p.locator('#jutsu-tray header button').tap();
    assert.equal(await p.locator('#jutsu-tray').isVisible(),false);
    await p.screenshot({path:'test-results/expanded-touch-'+size.width+'.png'});
   }
   await p.setViewportSize({width:390,height:844});
  }
  await clickGame(p,'#graphics-settings');
  assert.equal(await p.locator('#fighter-style').count(),0,'released fighters are sprites only');
  assert.equal(await p.locator('#canvas').getAttribute('data-fighter-style'),'painted');
  await p.selectOption('#battle-renderer','canvas');await p.waitForFunction(()=>document.querySelector('#canvas').dataset.presentation==='selected-canvas');await p.selectOption('#battle-renderer','pixi');await p.waitForFunction(()=>document.querySelector('#canvas').dataset.presentation==='selected-pixi');await p.click('#graphics-close');
  await p.evaluate(()=>document.querySelector('[data-practice-art=pixi]').dispatchEvent(new Event('webglcontextlost',{cancelable:true})));await p.waitForFunction(()=>document.querySelector('#canvas').dataset.presentation==='selected-canvas');
  await clickGame(p,'#graphics-settings');await p.click('#battle-graphics-retry');await p.waitForFunction(()=>document.querySelector('#canvas').dataset.presentation==='selected-pixi');await p.click('#graphics-close');
  assert.equal(await p.evaluate(async()=>{
   const {createRenderer}=await import('./renderer.js'),{createMatch}=await import('./packages/engine/index.js');const host=document.createElement('div');host.style.cssText='position:fixed;width:800px;height:400px;left:-1000px';const canvas=document.createElement('canvas');host.append(canvas);document.body.append(host);const render=createRenderer(canvas),state=createMatch();render(state,{sampled:true});state.fighters[0].x=777;render(state,{sampled:true});const x=render.frame.state.fighters[0].x;render.dispose();host.remove();return x;
  }),777,'replay samples at the same tick use the actual interpolated position');
  await p.reload();assert.equal(await p.locator('#include-unreleased').count(),0);assert.equal(await p.locator('#character0 .character-card:visible').count(),35);assert.deepEqual(errors,[]);
  await p.waitForSelector('#character0 .character-portrait');
  assert.equal(await p.locator('#character0 .character-card:visible canvas').count(),0,'roster portraits are static paintings');
  await p.locator('#character0 input[value=silent]').check();
  assert.equal(await p.locator('#character0 input:checked').inputValue(),'silent','portrait cards keep selection usable');
  assert.deepEqual(errors,[]);
  await p.route('http://127.0.0.1:4202/',async route=>{
    const response=await route.fetch();
    await route.fulfill({response,body:(await response.text()).replace('data-story-locks="off"','data-story-locks="on"')});
  });
  await p.goto('http://127.0.0.1:4202/');
  const locked=p.locator('#character0 [data-character=vael]');
  assert.equal(await locked.getAttribute('data-silhouette'),'true');
  assert.equal(await locked.locator('input').isDisabled(),true);
  assert.match(await locked.innerText(),/Future story encounter/);
  assert.equal(await p.locator('#character0 input[value=aren]').isEnabled(),true);
  await p.unroute('http://127.0.0.1:4202/');
  await p.goto('http://127.0.0.1:4202/animation-review.html');
  await p.selectOption('#sequence','combo');await p.check('#joints');await p.click('#pause');
  const reviewTick=Number(await p.locator('#review').getAttribute('data-tick'));
  await p.click('#step');assert.equal(Number(await p.locator('#review').getAttribute('data-tick')),reviewTick+1);
  await p.check('#mirror');await p.selectOption('#sequence','jump');await p.click('#step');
  assert.match(await p.locator('#readout').innerText(),/Aren: Rise/);
  await p.emulateMedia({reducedMotion:'reduce'});assert.equal(await p.locator('#pause').innerText(),'Play');
  assert.deepEqual(errors,[]);await context.close();
 }
 console.log('Global Pixi/original roster passed: 10 originals and stories, visible preview silhouettes and launch locks, CPU/local/Training/online presentation, selected fighter identity, native WebGL, global Canvas choice, context loss/retry, portrait and desktop.');
}finally{await browser?.close();server.kill();}
