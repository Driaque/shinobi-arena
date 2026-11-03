import test from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';
import {createStore} from '../apps/server/store.js';import {RULES_VERSION} from '../packages/engine/index.js';
const record=(a,b,at,extra={})=>({id:randomUUID(),createdAt:at,players:[{playerId:a.player.id,character:'silent'},{playerId:b.player.id,character:'winta'}],mode:'casual',winner:0,reason:'completed',wins:[2,0],playedTicks:1800,replay:{rules:RULES_VERSION,frames:[{state:{fighters:[{damageTaken:10},{damageTaken:10}]}}]},...extra});
test('verified rewards are idempotent, capped by opponent, and cannot equip locked titles',async()=>{
 let at=Date.UTC(2026,10,1);const s=await createStore({now:()=>at});try{const a=await s.createIdentity('One'),b=await s.createIdentity('Two');
 const r=record(a,b,at);await Promise.all([s.save(r),s.save(r)]);assert.equal((await s.progression.get(a.player.id)).total,1);
 await s.save(record(a,b,at,{players:[{playerId:a.player.id,character:'winta'},{playerId:b.player.id,character:'silent'}]}));await s.save(record(a,b,at));await s.save(record(a,b,at));
 let p=await s.progression.get(a.player.id);assert.equal(p.total,3);assert.deepEqual(p.unlocks,['newChallenger','dailyRival']);assert.equal(await s.progression.equip(a.player.id,'weeklyContender'),null);assert.equal((await s.progression.equip(a.player.id,'dailyRival')).title,'dailyRival');
 at+=86400000;p=await s.progression.get(a.player.id);assert.equal(p.daily.matches,0);assert.equal(p.total,3);assert.equal(p.title,'dailyRival');
 }finally{await s.close();}
});
test('login claims serialize, survive missed days, and finish once after seven distinct days',async()=>{
 let at=Date.UTC(2026,10,1);const s=await createStore({now:()=>at});try{const a=await s.createIdentity('One');await Promise.all([s.progression.login(a.player.id),s.progression.login(a.player.id)]);assert.equal((await s.progression.get(a.player.id)).loginDays,1);for(let i=0;i<6;i++){at+=3*86400000;await s.progression.login(a.player.id);}let p=await s.progression.get(a.player.id);assert.equal(p.loginDays,7);assert.deepEqual(p.unlocks,['returningRival']);at+=86400000;assert.equal((await s.progression.login(a.player.id)).loginDays,7);}finally{await s.close();}
});
test('forfeits, short, inactive, duplicate-player and benchmark fights do not advance challenges',async()=>{
 const at=Date.UTC(2026,10,1),s=await createStore({now:()=>at});try{const a=await s.createIdentity('One'),b=await s.createIdentity('Two');for(const extra of [{reason:'opponent-left'},{playedTicks:1199},{replay:{rules:RULES_VERSION,frames:[{state:{fighters:[{damageTaken:0},{damageTaken:10}]}}]}},{tournament:{id:randomUUID(),benchmark:true}}])await s.save(record(a,b,at,extra));assert.equal((await s.progression.get(a.player.id)).total,0);await s.save(record(a,a,at));assert.equal((await s.progression.get(a.player.id)).total,0);}finally{await s.close();}
});

test('weekly reset is Monday UTC and permanent unlocks survive store restart',async()=>{
 const {mkdtemp,rm}=await import('node:fs/promises'),{tmpdir}=await import('node:os'),{join}=await import('node:path');const dir=await mkdtemp(join(tmpdir(),'progression-')),filename=join(dir,'db');let at=Date.UTC(2026,10,1,23,59);let s=await createStore({filename,now:()=>at});try{const a=await s.createIdentity('One');await s.progression.login(a.player.id);const p=await s.progression.get(a.player.id);assert.equal(p.weeklyResetsAt,Date.UTC(2026,10,2));await s.close();at+=120000;s=await createStore({filename,now:()=>at});const next=await s.progression.get(a.player.id);assert.equal(next.loginDays,1);assert.equal(next.loginAvailable,true);assert.equal(next.weeklyResetsAt,Date.UTC(2026,10,9));}finally{await s.close();await rm(dir,{recursive:true,force:true});}
});

test('HTTP rewards require authentication, reject locked titles, and never accept submitted results',async()=>{
 const {createOnlineServer}=await import('../apps/server/index.js');const app=createOnlineServer({host:'127.0.0.1',port:0});await app.listen();try{const base=`http://127.0.0.1:${app.server.address().port}`,s=await app.storeReady,a=await s.createIdentity('One');assert.equal((await fetch(base+'/api/progression')).status,401);const headers={Authorization:'Bearer '+a.token,'Content-Type':'application/json'};assert.equal((await fetch(base+'/api/progression',{headers})).status,200);assert.equal((await fetch(base+'/api/progression/title',{headers,method:'POST',body:JSON.stringify({title:'dailyRival'})})).status,503,'in-memory preview cannot claim persistent rewards');assert.equal((await fetch(base+'/api/progression/results',{headers,method:'POST',body:'{}'})).status,404);}finally{await app.close();}
});
