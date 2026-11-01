import test from 'node:test';
import assert from 'node:assert/strict';
import {fighterPose} from '../apps/web/motion.js';
import {MOVES,CHARACTERS} from '../packages/engine/index.js';
test('authored sword poses keep both arm segments connected across every phase and do not mutate combat',()=>{
 for(const character of ['aren','silent'])for(const moveId of (CHARACTERS[character].basicChain??['katana','skyCleave'])){
  const m=MOVES[moveId];
  for(let age=0;age<m.startup+m.active+m.recovery;age+=.25){
   const f={character,action:{move:moveId,age},facing:1,y:0,travel:0},before=structuredClone(f),p=fighterPose(f,100,m);
   assert.deepEqual(f,before);
   const upper=Math.hypot(p.elbow.x-13,p.elbow.y+89),lower=Math.hypot(p.armX-p.elbow.x,p.armY-p.elbow.y);
   assert.ok(Math.abs(upper-36)<1e-6);assert.ok(Math.abs(lower-34)<1e-6);
   assert.ok(Number.isFinite(p.weaponAngle));
  }
 }
});
test('sword keys meet continuously at startup and recovery boundaries',()=>{
 for(const character of ['aren','silent'])for(const id of (CHARACTERS[character].basicChain??['katana','skyCleave'])){
  const m=MOVES[id];
  for(const age of [m.startup,m.startup+m.active]){
   const f={character,action:{move:id,age:age-.001},y:0},a=fighterPose(f,100,m);f.action.age=age;
   const b=fighterPose(f,100,m);assert.ok(Math.hypot(a.armX-b.armX,a.armY-b.armY)<.1);assert.ok(Math.abs(a.weaponAngle-b.weaponAngle)<.01);
  }
 }
});
test('idle secondary motion stops under reduced motion and character guards remain distinct',()=>{
 const f={character:'aren',y:0,travel:0};
 const a=fighterPose(f,0,null,true),b=fighterPose(f,130,null,true);assert.equal(a.trail,0);assert.equal(b.trail,0);assert.equal(a.lean,b.lean);
 assert.notEqual(fighterPose(f,10,null).armY,fighterPose({...f,character:'silent'},10,null).armY);
});
