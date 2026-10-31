import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';import {tmpdir} from 'node:os';import {randomUUID} from 'node:crypto';
import {createStore} from '../apps/server/store.js';
const alice={id:'123456789012345678',username:'Alice'},bob={id:'987654321098765432',username:'Bob'};
test('linking preserves the exact guest player, stats, history and recovery credential',async()=>{
 const s=await createStore();try{
  const guest=await s.createIdentity('Silent'),opponent=await s.createIdentity('Winta');await s.rename(guest.player.id,'Cold Metal');
  await s.save({id:randomUUID(),createdAt:Date.now(),players:[{playerId:guest.player.id,name:'Cold Metal'},{playerId:opponent.player.id,name:'Winta'}],mode:'casual',winner:0,reason:'completed',wins:[2,0],playedTicks:1800,replay:{rules:'test',frames:[]}});
  const before=await s.identity(guest.token),history=await s.history({playerId:guest.player.id});
  const result=await s.accounts.connect(alice,{mode:'link',playerId:guest.player.id});
  assert.deepEqual(result.player,before);assert.equal(result.player.games,1);assert.deepEqual(await s.history({playerId:result.player.id}),history);assert.equal(result.player.name,'Cold Metal');assert.equal((await s.identity(guest.token)).id,result.player.id);
  assert.equal((await s.identity(result.token)).id,result.player.id);assert.notEqual(result.token,guest.token);
  const info=await s.accounts.info(result.token,result.player.id);assert.equal(info.session,true);assert.equal(info.provider,'discord');assert.equal(info.label,'Alice');
  assert.equal((await s.accounts.info(guest.token,guest.player.id)).session,false);
 }finally{await s.close();}
});
test('repeated and concurrent Discord logins create sessions for one persistent player',async()=>{
 const s=await createStore();try{
  const results=await Promise.all([1,2,3].map(()=>s.accounts.connect(alice,{mode:'signin'})));
  assert.equal(new Set(results.map(r=>r.player.id)).size,1);assert.equal(new Set(results.map(r=>r.token)).size,3);
  for(const r of results)assert.equal((await s.identity(r.token)).id,results[0].player.id);
  assert.equal(JSON.stringify(await s.leaderboard()).includes(alice.id),false);
 }finally{await s.close();}
});
test('conflicting account links fail without merging or replacing either profile',async()=>{
 const s=await createStore();try{
  const a=await s.createIdentity('One'),b=await s.createIdentity('Two');await s.accounts.connect(alice,{mode:'link',playerId:a.player.id});
  await assert.rejects(s.accounts.connect(alice,{mode:'link',playerId:b.player.id}),e=>e.status===409);
  await assert.rejects(s.accounts.connect(bob,{mode:'link',playerId:a.player.id}),e=>e.status===409);
  assert.equal((await s.identity(a.token)).name,'One');assert.equal((await s.identity(b.token)).name,'Two');assert.equal((await s.accounts.info(b.token,b.player.id)).provider,null);
 }finally{await s.close();}
});
test('logout revokes only the current session; expiry is enforced and recovery survives',async()=>{
 let now=1000;const s=await createStore({now:()=>now});try{
  const guest=await s.createIdentity('Silent'),a=await s.accounts.connect(alice,{mode:'link',playerId:guest.player.id}),b=await s.accounts.connect(alice,{mode:'signin'});
  await s.accounts.logout(a.token);assert.equal(await s.identity(a.token),null);assert.equal((await s.identity(b.token)).id,guest.player.id);
  now=b.expiresAt;assert.equal(await s.identity(b.token),null);assert.equal((await s.identity(guest.token)).id,guest.player.id);
 }finally{await s.close();}
});
test('newest session remains usable when the per-player session limit is reached at one timestamp',async()=>{
 const s=await createStore({now:()=>1000});try{let latest;for(let i=0;i<15;i++){latest=await s.accounts.connect(alice,{mode:'signin'});assert.ok(await s.identity(latest.token));}}finally{await s.close();}
});
test('Discord link and sessions survive storage restart',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'fr-discord-')),filename=join(dir,'profiles.sqlite');let s=await createStore({filename});try{
  const guest=await s.createIdentity('Silent'),first=await s.accounts.connect(alice,{mode:'link',playerId:guest.player.id});await s.close();s=await createStore({filename});
  const second=await s.accounts.connect(alice,{mode:'signin'});assert.equal(second.player.id,guest.player.id);assert.equal((await s.identity(first.token)).id,guest.player.id);
 }finally{await s.close();await rm(dir,{recursive:true,force:true});}
});
