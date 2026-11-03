import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {createOnlineServer} from '../apps/server/index.js';
const app=createOnlineServer({port:0,host:'127.0.0.1',countdownTicks:600});
const clients=[],connect=app.arena.connect;app.arena.connect=send=>{const c=connect(send);clients.push(c);return c;};
let browser;
try{
 await app.listen();const base=`http://127.0.0.1:${app.server.address().port}`;
 browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader'],...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 const errors=[],contexts=await Promise.all([browser.newContext({viewport:{width:1280,height:900}}),browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true})]);
 const pages=[];for(const [i,context]of contexts.entries()){const page=await context.newPage();pages.push(page);page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await page.selectOption('#mode','online');await page.fill('#player-name',i?'Winta':'Silent');await page.click('#lounge-enter');await page.waitForFunction(()=>document.querySelector('#online-status').textContent.includes('in the player lounge'));}
 const [p,q]=pages;
 await p.waitForFunction(()=>document.querySelectorAll('.lounge-player').length===2);
 await p.locator('.lounge-player').filter({hasText:'Winta'}).getByText('View profile',{exact:true}).click();assert.match(await p.locator('.lounge-player').filter({hasText:'Winta'}).innerText(),/rating/);
 await p.locator('.lounge-player').filter({hasText:'Winta'}).getByRole('button',{name:'Challenge',exact:true}).click();await q.getByRole('button',{name:'Decline',exact:true}).click();await p.waitForFunction(()=>document.querySelector('#duel-invitations').textContent.includes('declined'));
 // Sending cooldown is a real server rule.
 await p.waitForTimeout(5100);await p.locator('.lounge-player').filter({hasText:'Winta'}).getByRole('button',{name:'Challenge',exact:true}).click();await q.getByRole('button',{name:'Accept duel',exact:true}).click();
 await p.locator('#fight-gestures').waitFor({state:'visible'});await p.locator('[data-gesture=bow]').click();await q.waitForFunction(()=>document.querySelector('#gesture-feed').textContent.includes('Silent: Respectful bow'));await q.waitForTimeout(300);assert.match(await q.locator('#gesture-feed').innerText(),/Respectful bow/);
 const match=clients.find(c=>c?.match)?.match;assert.ok(match);match.remaining=1;
 await p.waitForFunction(()=>document.querySelector('#overlay').hidden);assert.equal(await p.locator('#fight-gestures').isVisible(),false);
 // End through the normal authoritative combat step, keeping the test short.
 match.state.wins[0]=1;match.state.fighters[1].hp=0;
 await q.locator('[data-gesture=goodFight]').waitFor({state:'visible'});await q.locator('[data-gesture=goodFight]').click();await p.waitForFunction(()=>document.querySelector('#gesture-feed').textContent.includes('Winta: Good fight!'));
 await mkdir('test-results',{recursive:true});await p.screenshot({path:'test-results/social-desktop.png'});await q.screenshot({path:'test-results/social-mobile.png'});
 await p.click('#lounge-enter');await p.waitForFunction(()=>document.querySelector('#online-status').textContent.includes('in the player lounge'));await p.click('#online-cancel');
 await p.click('#account-profile');await p.locator('#profile-display-name').fill('Silent Prime');await p.getByRole('button',{name:'Save display name',exact:true}).click();await p.waitForFunction(()=>document.querySelector('.profile-card h2')?.textContent==='Silent Prime');await p.screenshot({path:'test-results/profile-desktop.png'});
 await p.click('#hub-close');assert.equal(await p.locator('#player-name').inputValue(),'Silent Prime');assert.deepEqual(errors,[]);
 console.log('Social desktop/mobile: presence, profiles, decline, accepted duel, pre/post gestures, return to lounge and saved profile name passed.');
}finally{await browser?.close();await app.close();}
