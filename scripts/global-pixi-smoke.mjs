import {chromium} from 'playwright';import {spawn} from 'node:child_process';import assert from 'node:assert/strict';import {mkdir} from 'node:fs/promises';
const server=spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,PORT:'4202'},stdio:['ignore','pipe','inherit']});let browser;
try{
 await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});await mkdir('test-results',{recursive:true});
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:960},isMobile:mobile,hasTouch:mobile}),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://127.0.0.1:4202');await p.waitForFunction(()=>document.querySelector('#canvas').dataset.presentation==='selected-pixi');
  await p.waitForSelector('#character0 canvas[data-animated-portrait=aren]');
  const portrait=p.locator('#character0 canvas[data-animated-portrait=aren]');
  const before=await portrait.evaluate(c=>c.toDataURL());
  await p.waitForTimeout(180);
  assert.notEqual(await portrait.evaluate(c=>c.toDataURL()),before,'Pixi portrait advances while visible');
  await p.emulateMedia({reducedMotion:'reduce'});await p.waitForTimeout(150);
  const still=await portrait.evaluate(c=>c.toDataURL());await p.waitForTimeout(150);
  assert.equal(await portrait.evaluate(c=>c.toDataURL()),still,'reduced motion freezes the portrait');
  await p.emulateMedia({reducedMotion:'no-preference'});
  assert.equal(await p.locator('#include-anime').isChecked(),false);assert.equal(await p.locator('#character0 .character-card:visible').count(),10);assert.ok(await p.locator('#character0').evaluate(el=>el.clientHeight>=260),'original grid exposes more rows');assert.equal(await p.locator('#character0 input:checked').inputValue(),'aren');assert.equal(await p.locator('#character1 input:checked').inputValue(),'winta');
  for(const c of ['silent','winta','dora','aren','eira','kael','nyra','rook','veyra','oryn']){await p.locator(`#character0 input[value=${c}]`).check();assert.match(await p.locator('#kit0').innerText(),/Story & connections/);}
  await p.locator('#include-anime').check();assert.equal(await p.locator('#character0 .character-card:visible').count(),35);await p.locator('#character0 input[value=naruto]').check();await p.locator('#include-anime').uncheck();assert.equal(await p.locator('#character0 input:checked').inputValue(),'aren');assert.equal(await p.locator('#character0 .character-card:visible').count(),10);
  for(const mode of ['cpu','local','training','online']){await p.selectOption('#mode',mode);if(mode!=='online'){await p.click('#play');await p.waitForTimeout(100);}await p.waitForFunction(()=>document.querySelector('#canvas').dataset.presentation==='selected-pixi');assert.doesNotMatch(await p.locator('#name1').innerText(),/SPARRING ECHO/);}
  await p.selectOption('#mode','training');await p.click('#play');await p.click('#training-settings');assert.equal(await p.locator('#training-charge').isDisabled(),true,'Aren has no awakening to charge');await p.click('#training-close');await p.click('#play');await p.screenshot({path:`test-results/global-pixi-${mobile?'portrait':'desktop'}.png`});
  await p.click('#graphics-settings');
  assert.equal(await p.locator('#fighter-style').inputValue(),'fluid');
  assert.equal(await p.locator('#canvas').getAttribute('data-fighter-style'),'fluid');
  await p.selectOption('#fighter-style','painted');await p.waitForFunction(()=>document.querySelector('#canvas').dataset.fighterStyle==='painted');
  await p.selectOption('#fighter-style','fluid');await p.waitForFunction(()=>document.querySelector('#canvas').dataset.fighterStyle==='fluid');
  await p.selectOption('#battle-renderer','canvas');await p.waitForFunction(()=>document.querySelector('#canvas').dataset.presentation==='selected-canvas');await p.selectOption('#battle-renderer','pixi');await p.waitForFunction(()=>document.querySelector('#canvas').dataset.presentation==='selected-pixi');await p.click('#graphics-close');
  await p.evaluate(()=>document.querySelector('[data-practice-art=pixi]').dispatchEvent(new Event('webglcontextlost',{cancelable:true})));await p.waitForFunction(()=>document.querySelector('#canvas').dataset.presentation==='selected-canvas');
  await p.click('#graphics-settings');await p.click('#battle-graphics-retry');await p.waitForFunction(()=>document.querySelector('#canvas').dataset.presentation==='selected-pixi');await p.click('#graphics-close');
  assert.equal(await p.evaluate(async()=>{
   const {createRenderer}=await import('./renderer.js'),{createMatch}=await import('./packages/engine/index.js');const host=document.createElement('div');host.style.cssText='position:fixed;width:800px;height:400px;left:-1000px';const canvas=document.createElement('canvas');host.append(canvas);document.body.append(host);const render=createRenderer(canvas),state=createMatch();render(state,{sampled:true});state.fighters[0].x=777;render(state,{sampled:true});const x=render.frame.state.fighters[0].x;render.dispose();host.remove();return x;
  }),777,'replay samples at the same tick use the actual interpolated position');
  await p.reload();assert.equal(await p.locator('#include-anime').isChecked(),false);assert.equal(await p.locator('#character0 .character-card:visible').count(),10);assert.deepEqual(errors,[]);
  await p.route('**/roster-pixi.js*',route=>route.abort());await p.reload();
  await p.waitForSelector('#character0 .character-portrait');
  assert.equal(await p.locator('#character0 [data-animated-portrait]').count(),0,'failed Pixi module retains static portraits');
  await p.locator('#character0 input[value=silent]').check();
  assert.equal(await p.locator('#character0 input:checked').inputValue(),'silent','static fallback keeps selection usable');
  assert.deepEqual(errors,[]);
  await p.goto('http://127.0.0.1:4202/animation-review.html');
  await p.selectOption('#sequence','combo');await p.check('#joints');await p.click('#pause');
  const reviewTick=Number(await p.locator('#review').getAttribute('data-tick'));
  await p.click('#step');assert.equal(Number(await p.locator('#review').getAttribute('data-tick')),reviewTick+1);
  await p.check('#mirror');await p.selectOption('#sequence','jump');await p.click('#step');
  assert.match(await p.locator('#readout').innerText(),/Aren: Rise/);
  await p.emulateMedia({reducedMotion:'reduce'});assert.equal(await p.locator('#pause').innerText(),'Play');
  assert.deepEqual(errors,[]);await context.close();
 }
 console.log('Global Pixi/original roster passed: 10 originals and stories, explicit anime opt-in/reset, CPU/local/Training/online presentation, selected fighter identity, native WebGL, global Canvas choice, context loss/retry, portrait and desktop.');
}finally{await browser?.close();server.kill();}
