import {chromium} from 'playwright';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
const server=spawn(process.execPath,['scripts/serve.mjs'],{env:{...process.env,PORT:'4203'},stdio:['ignore','pipe','inherit']});let browser;
try{
  await new Promise((resolve,reject)=>{server.stdout.once('data',resolve);server.once('error',reject);});
  browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
  await mkdir('test-results',{recursive:true});
  for(const mobile of [false,true]){
    const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:900},hasTouch:mobile,isMobile:mobile}),page=await context.newPage(),errors=[];
    page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:4203');
    await page.waitForFunction(()=>document.querySelector('#canvas').dataset.presentation==='selected-pixi');
    await page.evaluate(async()=>{
      const {createPracticeBackends}=await import('./practice-pixi.js'),{createTraining}=await import('./packages/engine/training.js');
      const host=document.createElement('div');host.id='art-evidence';host.style.cssText='position:fixed;inset:0;z-index:9999;background:#101e30';document.body.append(host);
      let state,backend;const draw=(renderer='pixi')=>backend.draw(state,{worldWidth:1280,viewHeight:600,zoom:1,shakeX:0,shakeY:0},renderer,{preview:false});
      backend=await createPracticeBackends(host,()=>draw('canvas'),()=>draw());
      window.art={backend,host,draw,select(id){state=createTraining([0,1].map(()=>({character:id,weapon:id==='dora'?'fans':'tachi'})));state.fighters[0].x=480;state.fighters[1].x=800;draw();}};
    });
    for(const id of ['silent','winta','dora','aren','eira','kael','nyra','rook','veyra','oryn']){
      await page.evaluate(id=>window.art.select(id),id);
      await page.waitForFunction(id=>window.art.backend.fighterIds().includes(id),id);
      assert.equal(await page.evaluate(()=>{window.art.draw();return document.querySelector('#art-evidence [data-practice-art=pixi]').dataset.fighterModels;}),`${id},${id}`);
      if(['silent','dora','aren'].includes(id))await page.screenshot({path:`test-results/fighter-art-${id}-${mobile?'portrait':'desktop'}.png`});
    }
    assert.equal(await page.evaluate(()=>window.art.draw('canvas')),'canvas');
    assert.equal(await page.locator('#art-evidence [data-practice-art=canvas]').getAttribute('data-fighter-models'),'oryn,oryn');
    await page.evaluate(()=>document.querySelector('#art-evidence [data-practice-art=pixi]').dispatchEvent(new Event('webglcontextlost',{cancelable:true})));
    assert.equal(await page.evaluate(()=>window.art.draw('pixi')),'canvas');
    await page.evaluate(()=>{window.art.backend.destroy();window.art.host.remove();});
    await page.reload();await page.waitForFunction(()=>document.querySelector('#canvas').dataset.presentation==='selected-pixi');
    await page.route('**/assets/originals/nyra.webp*',route=>route.abort());
    await page.selectOption('#mode','training');await page.locator('#character0 input[value=nyra]').check();await page.click('#play');
    await page.waitForFunction(()=>document.querySelector('#practice-graphics-status').textContent.includes('nyra'));
    await page.unroute('**/assets/originals/nyra.webp*');
    const tick=await page.locator('#canvas').getAttribute('data-render-tick');
    await page.evaluate(()=>{document.querySelector('#graphics-settings').click();document.querySelector('#battle-graphics-retry').click();document.querySelector('#graphics-close').click();});
    await page.waitForFunction(()=>document.querySelector('[data-practice-art=pixi]')?.dataset.fighterModels?.includes('nyra'));
    assert.ok(Number(await page.locator('#canvas').getAttribute('data-render-tick'))>=Number(tick));
    const second=await page.evaluate(async()=>{
      const {createRenderer}=await import('./renderer.js'),{createMatch}=await import('./packages/engine/index.js');
      const host=document.createElement('div');host.style.cssText='width:800px;height:400px';const canvas=document.createElement('canvas');host.append(canvas);document.body.append(host);
      const render=createRenderer(canvas),state=createMatch();render(state);state.fighters[1].character='dora';render(state);
      const identity=render.frame.state.fighters[1].character;render.dispose();host.remove();return identity;
    });
    assert.equal(second,'dora','Player 2 model changes at the same tick');assert.deepEqual(errors,[]);await context.close();
  }
  console.log('Detailed fighter art passed: ten sheets, mirrors, WebGL/Canvas, desktop/portrait, failure/retry, context recovery and same-tick Player 2 replacement.');
}finally{await browser?.close();server.kill();}
