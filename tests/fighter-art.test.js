import test from 'node:test';
import assert from 'node:assert/strict';
import {createFighterAtlasStore,FIGHTER_FRAMES,fighterAtlasData} from '../packages/presentation/fighter-atlases.js';
import {ORIGINAL_FIGHTERS} from '../packages/engine/originals.js';
import {createMatch} from '../packages/engine/index.js';
import {practiceSceneFor} from '../packages/presentation/practice-scene.js';
const settle=()=>new Promise(resolve=>setImmediate(resolve));
const image={width:1536,height:1536};

test('detailed sheets load only requested originals, once per identity including mirrors',async()=>{
  const calls=[],store=createFighterAtlasStore(async id=>{calls.push(id);return image;});
  store.request(['silent','silent','winta','naruto']);store.request(['silent']);
  assert.equal(store.get('silent'),null);await settle();
  assert.deepEqual(calls,['silent','winta']);assert.deepEqual(store.readyIds(),['silent','winta']);
  assert.equal(store.get('silent'),image);assert.deepEqual(store.failedIds(),[]);
  store.destroy();assert.equal(store.get('silent'),null);
});
test('sheet failures are isolated, disposal discards late completions, a fresh store retries',async()=>{
  let resolveLate,changed=0;
  const store=createFighterAtlasStore(id=>id==='nyra'?Promise.reject(Error('offline')):id==='oryn'?{width:1,height:1}:new Promise(r=>{resolveLate=r;}),()=>changed++);
  store.request(['nyra','oryn','dora']);await settle();
  assert.deepEqual(store.failedIds(),['nyra','oryn']);assert.equal(changed,2);
  store.destroy();resolveLate(image);await settle();assert.equal(changed,2);assert.deepEqual(store.readyIds(),[]);
  const retry=createFighterAtlasStore(async()=>image);retry.request(['nyra']);await settle();assert.equal(retry.get('nyra'),image);retry.destroy();
});
test('ten native identities retain body scale, player slots and simulation state across mirrors and seeks',()=>{
  for(const c of Object.values(ORIGINAL_FIGHTERS)){
    const state=createMatch([0,1].map(()=>({character:c.id,weapon:c.defaultWeapon}))),before=structuredClone(state);
    state.fighters[1].facing=-1;
    const scene=practiceSceneFor(state,{}, {selected:true,atlasFighters:[c.id]});
    assert.deepEqual(scene.fighters.map(f=>[f.id,f.atlasId]),[[0,c.id],[1,c.id]]);
    for(const f of scene.fighters){assert.ok(Math.abs(f.scale*fighterAtlasData(c.id).standingHeight-120*state.fighters[f.id].scale)<1e-9);assert.equal(f.frame,FIGHTER_FRAMES[f.frameIndex]);}
    const original=practiceSceneFor(state,{}, {selected:true,atlasFighters:[]});
    assert.equal(original.fighters.length,c.id==='aren'?2:0,'unloaded sheets retain compatibility bodies');
    assert.equal(state.tick,before.tick);assert.deepEqual(state.fighters.map(f=>f.hp),before.fighters.map(f=>f.hp));
  }
  const state=createMatch([{character:'aren',weapon:'katana'},{character:'winta',weapon:'tachi'}]);state.fighters[1].character='dora';
  assert.equal(practiceSceneFor(state,{}, {selected:true,atlasFighters:['aren','dora']}).fighters[1].atlasId,'dora');
});
