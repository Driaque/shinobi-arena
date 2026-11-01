import test from 'node:test';
import assert from 'node:assert/strict';
import {motionFor} from '../packages/presentation/motion.js';
import {MOVES} from '../packages/engine/index.js';
import {createLabState,sceneFor} from '../packages/presentation/visual-lab.js';

test('all attack presentation offsets are bounded and finite, with no simulation mutation',()=>{
 for(const [move,m] of Object.entries(MOVES))for(const age of [0,m.startup,m.startup+(m.active??0),100]){
  const f={facing:1,y:50,action:{move,age}}, before=structuredClone(f),p=motionFor(f,40);
  assert.deepEqual(f,before);
  for(const key of ['x','y','rotation'])assert.ok(Number.isFinite(p[key]),move+' '+key);
  assert.ok(Math.abs(p.x)<=4&&Math.abs(p.y)<=3&&Math.abs(p.rotation)<=.12);
  assert.deepEqual(motionFor(f,40,true),{x:0,y:0,rotation:0,trail:false});
 }
});
test('painted running poses stay opaque without crossfading silhouettes',()=>{
 const state=createLabState();state.tick=100;const f=state.fighters[0];f.vx=3;f.travel=31;
 const s=sceneFor(state),a=s.fighters[0];assert.equal(a.blend,1);assert.equal(a.frame,a.blendFrame);
 const before=structuredClone(state);sceneFor(state);assert.deepEqual(state,before);
 const reduced=sceneFor(state,{reduced:true});assert.equal(reduced.fighters[0].blend,1);assert.equal(reduced.fighters[0].motion.trail,false);assert.equal(reduced.bursts.length,0);
});

test('idle holds its silhouette and attack phases switch at combat boundaries',()=>{
 const state=createLabState(), f=state.fighters[0];
 for(const tick of [10,35,70,105]){state.tick=tick;assert.equal(sceneFor(state).fighters[0].frameIndex,0);}
 const [move,m]=Object.entries(MOVES).find(([,m])=>m.startup>0&&m.active>0&&!m.ground&&!m.projectile&&!m.buff);
 f.action={move,age:0};
 for(const [age,frame] of [[0,8],[m.startup,9],[m.startup+m.active,10]]){
  f.action.age=age;const actor=sceneFor(state).fighters[0];
  assert.equal(actor.frameIndex,frame);assert.equal(actor.blend,1);assert.equal(actor.frame,actor.blendFrame);
 }
 f.action=null;f.y=30;f.vy=6;assert.equal(sceneFor(state).fighters[0].frameIndex,5);
 f.vy=-1;assert.equal(sceneFor(state).fighters[0].frameIndex,7);
});

import {projectLocalFighter} from '../apps/web/motion.js';
test('local sub-tick presentation is continuous, bounded and leaves simulation intact',()=>{
 const a={character:'silent',x:100,y:30,depth:0,travel:10},b={...a,x:105,y:36,depth:2,travel:15};
 const before=structuredClone(b);
 for(const alpha of [0,.25,.5,.75,1])assert.equal(projectLocalFighter(a,b,alpha).x,105+5*alpha);
 assert.equal(projectLocalFighter(a,b,9).x,110);
 assert.equal(projectLocalFighter(a,b,NaN).x,105);
 assert.deepEqual(b,before);
 assert.equal(projectLocalFighter(a,{...b,x:400},.5).x,400,'teleport snaps');
 assert.equal(projectLocalFighter(a,b,.5,4).x,105,'missed ticks do not project a multi-tick displacement');
 assert.equal(projectLocalFighter(a,{...b,y:0},.5).y,0,'landing remains grounded');
 assert.equal(projectLocalFighter(b,b,.5).x,105,'stopped fighter has no stale-velocity drift');
});
