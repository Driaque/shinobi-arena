import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {createOnlineServer} from '../apps/server/index.js';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {clickGame,selectGame} from './navigation-helper.mjs';
const dir=await mkdtemp(join(tmpdir(),'fr-navigation-'));
const app=createOnlineServer({host:'127.0.0.1',port:0,storeOptions:{filename:join(dir,'db')}});let browser;
try{
 await app.listen();const origin=`http://127.0.0.1:${app.server.address().port}`;
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
 for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390}]){
  const context=await browser.newContext({viewport,isMobile:viewport.width<900,hasTouch:viewport.width<900}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(origin);await page.locator('#entry-guest').waitFor();assert.equal(await page.locator('#pause').isVisible(),false);assert.equal(await page.locator('#fullscreen').isVisible(),false);assert.equal(await page.locator('.stage-selection').isVisible(),false);
  await page.click('#entry-signin');await page.locator('#arena-hub-dialog').waitFor();assert.equal(await page.locator('[data-hub-tab=profile]').getAttribute('aria-pressed'),'true');await page.click('#hub-close');await page.click('#entry-guest');assert.equal(await page.locator('#account-entry').isVisible(),false);
  await page.locator('#game-menu > summary').click();for(const selector of ['.adventures-link','#account-profile','#rankings','#mode','#arena-hub'])assert.equal(await page.locator(selector).isVisible(),true);
  await page.locator('#game-settings > summary').click();assert.equal(await page.locator('#mode').isVisible(),false);for(const selector of ['#difficulty','#control-settings','#audio-settings','#graphics-settings','#experience-settings'])assert.equal(await page.locator(selector).isVisible(),true);
  await page.locator('#game-settings > summary').click();await page.locator('#character0 input[value=silent]').check();await page.click('#play');assert.equal(await page.locator('#loadout-panel').isVisible(),false);assert.equal(await page.locator('.stage-selection').isVisible(),true);assert.equal(await page.locator('#overlay .stage-selection').count(),1);
  await page.click('[data-stage=forge]');await page.click('#setup-back');assert.equal(await page.locator('#character0 input:checked').inputValue(),'silent');assert.equal(await page.locator('.stage-selection').isVisible(),false);await clickGame(page,'#play');await page.locator('#pause').waitFor();assert.equal(await page.locator('#fullscreen').isVisible(),true);await page.click('#pause');assert.equal(await page.locator('#play').innerText(),'Resume match');assert.equal(await page.locator('.stage-selection').isVisible(),false);await clickGame(page,'#play');await selectGame(page,'#mode','training');assert.equal(await page.locator('#loadout-panel').isVisible(),true);assert.equal(await page.locator('.stage-selection').isVisible(),false);assert.equal(await page.locator('#fullscreen').isVisible(),false);
  assert.deepEqual(errors,[]);await context.close();
 }
 // Saved Discord session status comes from the server, including refresh after a rename.
 const context=await browser.newContext(),page=await context.newPage();await page.addInitScript(base=>localStorage.setItem('shinobi.profile.v1.'+base,'a'.repeat(43)),origin);
 await page.route('**/api/me',r=>r.fulfill({json:{player:{name:'Signed Rival'},auth:{session:true,provider:'discord'}}}));await page.goto(origin);await page.getByRole('button',{name:'Signed in · Signed Rival',exact:true}).waitFor();assert.equal(await page.locator('#account-entry').isVisible(),false);await context.close();
 console.log('Navigation checks passed: menu/settings, guest/sign-in/session state, three viewport setup flow, Back persistence, battle controls and direct pause resume.');
}finally{await browser?.close();await app.close();await rm(dir,{recursive:true,force:true});}
