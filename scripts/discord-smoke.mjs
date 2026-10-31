import {chromium} from 'playwright';
import {mkdtemp,rm,mkdir} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';import {randomUUID} from 'node:crypto';
import assert from 'node:assert/strict';import {createOnlineServer} from '../apps/server/index.js';
const origin='http://127.0.0.1:4204',dir=await mkdtemp(join(tmpdir(),'fr-discord-browser-'));
const app=createOnlineServer({host:'127.0.0.1',port:4204,storeOptions:{filename:join(dir,'profiles.sqlite')},discordOptions:{clientId:'123456789012345678',clientSecret:'test-only',publicOrigin:origin,request:async url=>({ok:true,json:async()=>url.includes('/oauth2/token')?{access_token:'test-only-access',token_type:'Bearer',scope:'identify'}:{id:'111111111111111111',username:'CommunityTester'}})}});
let browser;
try{
 await app.listen();const store=await app.storeReady;
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader']});
 const errors=[];
 async function context(mobile=false){
  const ctx=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:900},isMobile:mobile,hasTouch:mobile});
  await ctx.route('https://discord.com/oauth2/authorize?**',route=>{const url=new URL(route.request().url());assert.equal(url.searchParams.get('scope'),'identify');assert.equal(url.searchParams.get('code_challenge_method'),'S256');return route.fulfill({status:302,headers:{location:origin+'/auth/discord/callback?'+new URLSearchParams({state:url.searchParams.get('state'),code:'test-code',iss:'https://discord.com'})}});});
  const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(origin);await page.click('#account-profile');await page.waitForSelector('.discord-account');return {ctx,page};
 }
 async function authorize(page,label){
  const opened=page.waitForEvent('popup');await page.getByRole('button',{name:label,exact:true}).click();const popup=await opened;
  try{await page.getByRole('button',{name:'Log out of this device',exact:true}).waitFor();}
  catch(e){console.error('Discord browser diagnostic:',JSON.stringify({message:await page.locator('#hub-message').innerText(),popupClosed:popup.isClosed(),popupText:popup.isClosed()?'closed':await popup.locator('body').innerText().catch(()=>''),errors}));throw e;}
 }
 const token=page=>page.evaluate(origin=>localStorage.getItem('shinobi.profile.v1.'+origin),origin);
 const first=await context();await first.page.getByRole('button',{name:'Create player profile',exact:true}).click();await first.page.getByRole('button',{name:'Link this profile to Discord',exact:true}).waitFor();
 const guestToken=await token(first.page),guest=await store.identity(guestToken),opponent=await store.createIdentity('Other');
 await store.save({id:randomUUID(),createdAt:Date.now(),players:[{playerId:guest.id,name:guest.name},{playerId:opponent.player.id,name:'Other'}],mode:'casual',winner:0,reason:'completed',wins:[2,0],playedTicks:1800,replay:{rules:'test',frames:[]}});
 await first.page.locator('[data-hub-tab=profile]').click();await first.page.getByText('1 wins / 0 losses / 0 draws',{exact:false}).waitFor();
 await authorize(first.page,'Link this profile to Discord');
 assert.equal((await store.identity(await token(first.page))).id,guest.id);assert.match(await first.page.locator('.discord-account').innerText(),/Linked to CommunityTester/);
 await mkdir('test-results',{recursive:true});await first.page.screenshot({path:'test-results/discord-linked-profile.png'});
 const second=await context(true);await authorize(second.page,'Continue with Discord');
 const secondToken=await token(second.page);assert.equal((await store.identity(secondToken)).id,guest.id);assert.match(await second.page.locator('#hub-content').innerText(),/1 wins/);
 await first.page.getByRole('button',{name:'Log out of this device',exact:true}).click();await first.page.getByRole('button',{name:'Continue with Discord',exact:true}).waitFor();assert.equal(await token(first.page),null);assert.ok(await store.identity(secondToken));await first.ctx.close();await second.ctx.close();
 const conflict=await context();await conflict.page.getByRole('button',{name:'Create player profile',exact:true}).click();await conflict.page.getByRole('button',{name:'Link this profile to Discord',exact:true}).waitFor();const otherToken=await token(conflict.page);
 await conflict.page.getByRole('button',{name:'Link this profile to Discord',exact:true}).click();await conflict.page.waitForFunction(()=>document.querySelector('#hub-message').textContent.includes('different profile'));
 assert.equal(await token(conflict.page),otherToken);assert.notEqual((await store.identity(otherToken)).id,guest.id);
 conflict.page.once('dialog',dialog=>dialog.dismiss());await conflict.page.getByRole('button',{name:'Sign in to another Discord profile',exact:true}).click();assert.equal(await token(conflict.page),otherToken);
 await conflict.ctx.close();assert.deepEqual(errors,[]);
 console.log('Discord account browser flow passed: popup authorization, guest progress, cross-device login, mobile profile, independent logout and conflict protection. Provider exchange was mocked; production activation still needs a real Discord application.');
}finally{await browser?.close();await app.close();await rm(dir,{recursive:true,force:true});}
