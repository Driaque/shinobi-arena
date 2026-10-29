import {chromium} from 'playwright';import assert from 'node:assert/strict';import {mkdir} from 'node:fs/promises';
import {createOnlineServer} from '../apps/server/index.js';import {createMatch,CHARACTERS,MOVES,AWAKENINGS} from '../packages/engine/index.js';import {RULES_VERSION} from '../packages/network/protocol.js';
const app=createOnlineServer({port:0,host:'127.0.0.1'});let browser;
try{
 await mkdir('test-results',{recursive:true});await app.listen();const s=await app.storeReady,cs=Object.keys(CHARACTERS).slice(0,8),members=await Promise.all(cs.map(c=>s.createIdentity('SIM '+CHARACTERS[c].name))),chars=new Map(members.map((m,i)=>[m.player.id,cs[i]]));
 const t=await s.tournaments.create(members[0].player,{name:'Group One Character Benchmark',capacity:8,format:'league-knockout',benchmark:true});for(const m of members.slice(1))await s.tournaments.update(t.id,m.player,'join');let current=await s.tournaments.update(t.id,members[0].player,'start');
 // Fixtures stay in this local test store; production has no client result-submission API.
 while(current.status==='running'){
  for(const pair of current.rounds.at(-1)){
   const context=await s.tournaments.prepare(t.id,pair.players[0],chars.get(pair.players[0]));await s.tournaments.prepare(t.id,pair.players[1],chars.get(pair.players[1]));const players=pair.players.map(id=>({playerId:id,name:members.find(m=>m.player.id===id).player.name,character:chars.get(id),weapon:'kunai'})),state=createMatch(players),last=structuredClone(state);last.wins=[2,0];last.status='matchOver';last.metrics[0].damage=2000;
   await s.save({id:context.matchId,tournament:context,createdAt:Date.now(),mode:'tournament',players,winner:0,reason:'completed',wins:[2,0],playedTicks:1500,replay:{schema:1,id:context.matchId,rules:RULES_VERSION,tickRate:60,duration:120,players,catalog:{characters:CHARACTERS,moves:MOVES,awakenings:AWAKENINGS},loadouts:state.loadouts,frames:[{at:0,state},{at:120,state:last}]}});
  }
  current=await s.tournaments.get(t.id);
 }
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage']}: {})});const errors=[];
 for(const mobile of [false,true]){
  const context=await browser.newContext({viewport:mobile?{width:844,height:390}:{width:1440,height:960},isMobile:mobile,hasTouch:mobile}),p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(`http://127.0.0.1:${app.server.address().port}`);await p.click('#arena-hub');await p.locator('[data-hub-tab=tournaments]').click();await p.locator('.league-standings').waitFor();assert.equal(await p.locator('.league-standings tbody tr').count(),8);assert.equal(await p.getByRole('button',{name:'Replay fight',exact:true}).count(),35);assert.match(await p.locator('.tournament-card').innerText(),/Quarterfinals/);assert.match(await p.locator('.tournament-card').innerText(),/Semifinals/);assert.match(await p.locator('.tournament-card').innerText(),/no player Elo/);assert.equal(await p.locator('[data-tournament-fight]').count(),0);assert.equal(await p.getByRole('button',{name:'Sign up',exact:true}).count(),0);
  await p.screenshot({path:`test-results/v21-league-${mobile?'mobile':'desktop'}.png`});await p.getByRole('button',{name:'Replay fight',exact:true}).first().click();await p.waitForFunction(()=>document.querySelector('#viewer-status').textContent.includes('REPLAY'));await p.waitForFunction(()=>document.querySelector('#viewer-score').textContent.includes('SIM '));assert.equal(await p.locator('#replay-controls').isVisible(),true);await context.close();
 }
 assert.deepEqual(errors,[]);console.log('Character league browser passed: 8 standings, all 35 replay links, seeded rounds, benchmark isolation labels and desktop/mobile replay playback.');
}finally{await browser?.close();await app.close();}
