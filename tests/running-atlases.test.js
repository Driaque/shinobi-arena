import test from 'node:test';
import assert from 'node:assert/strict';
import {ORIGINAL_FIGHTERS} from '../packages/engine/originals.js';
import {createTraining} from '../packages/engine/training.js';
import {runningFrameFor,runningAtlasData} from '../packages/presentation/running-atlases.js';
import {practiceSceneFor} from '../packages/presentation/practice-scene.js';
const moving=id=>({character:id,hp:100,y:0,vx:3,travel:0,weapon:ORIGINAL_FIGHTERS[id].defaultWeapon,weapons:[ORIGINAL_FIGHTERS[id].defaultWeapon],items:[]});
test('each original has eight distance-driven running poses and two carry variants',()=>{
 for(const id of Object.keys(ORIGINAL_FIGHTERS)){
  const f=moving(id),original=structuredClone(f);
  assert.equal(runningAtlasData(id).poses,16);
  assert.ok(runningAtlasData(id).standingHeight>100);
  for(let i=0;i<16;i++){f.travel=i*18.75;assert.equal(runningFrameFor(f).frameIndex,i%8);}
  f.travel=0;assert.deepEqual(f,original);
  f.items=[{id:'poison',count:1},{id:'veilCanister',count:1}];
  if(id==='silent'){f.weapon='frostmereSaber';f.weapons=['frostmereSaber','oathknife'];}
  assert.equal(runningFrameFor(f).variant,'equipped');
  f.items[0].count=0;assert.equal(runningFrameFor(f).variant,'empty');
  f.items[0].count=1;f.weapon='spikeCapsule';assert.equal(runningFrameFor(f).variant,'empty');
 }
});
test('run selection respects combat poses, reduced motion, depth inputs and empty hands',()=>{
 const f=moving('silent');f.travel=70;
 assert.equal(runningFrameFor(f,{reduced:true}).frameIndex,0);
 for(const patch of [{action:{move:'attack'}},{stun:1},{blocking:true},{crouching:true},{charging:true},{dash:1},{y:1},{hp:0},{awakeningFlash:1}])assert.equal(runningFrameFor({...f,...patch}),null);
 assert.equal(runningFrameFor({...f,vx:0}),null);
 assert.equal(runningFrameFor({...f,vx:0,previous:{moveZ:1}}).variant,'empty');
 assert.equal(runningFrameFor({...f,vx:0,previous:{depthUp:true}}).variant,'empty');
 assert.equal(runningFrameFor({...f,character:'solan'}),null);
 f.weapon='frostmereSaber';f.weapons=['frostmereSaber'];f.items=[{id:'poison',count:1},{id:'veilCanister',count:1}];assert.equal(runningFrameFor(f).variant,'empty','Silent needs both painted weapons');
});
test('run sheets replace only grounded runs, with one root, no extra bounce and no simulation mutation',()=>{
 const s=createTraining([{character:'dora',weapon:'tideglassFans'},{character:'winta',weapon:'frostmereSaber'}]);
 s.tick=100;s.fighters[0].vx=3;s.fighters[0].travel=40;
 const original=structuredClone(s),settings={selected:true,atlasFighters:['dora','winta'],runningFighters:['dora','winta']};
 let scene=practiceSceneFor(s,{},settings);
 assert.equal(scene.fighters[0].runAtlas,true);assert.equal(scene.fighters[0].frameIndex,2);
 assert.equal(scene.fighters[0].bob,0);assert.equal(scene.fighters[0].motion.y,0);
 assert.equal(scene.fighters[0].frame.rootY,340);assert.equal(scene.fighters[1].runAtlas,undefined);
 assert.deepEqual(s,original);
 assert.equal(practiceSceneFor(s,{}, {...settings,runningFighters:[]}).fighters[0].runAtlas,undefined,'failed/loading runs retain the normal atlas');
 s.fighters[0].landedAt=99;assert.equal(practiceSceneFor(s,{},settings).fighters[0].runAtlas,undefined,'landing keeps its own pose');
 s.fighters[0].y=100;assert.equal(practiceSceneFor(s,{},settings).fighters[0].runAtlas,undefined);
});
