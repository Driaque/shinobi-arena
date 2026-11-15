import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {MOVES,WEAPONS} from '../packages/engine/index.js';
import {createTraining,stepTraining} from '../packages/engine/training.js';
import {practiceSceneFor} from '../packages/presentation/practice-scene.js';
import {FIGHTER_ATLAS_DATA} from '../packages/presentation/fighter-atlas-data.js';
import {WEAPON_ART,HAND_ANCHORS,weaponArtUrl,cutoutBackground,handFor,weaponPoseFor,weaponSpriteFor,strikeArcFor} from '../packages/presentation/weapons.js';

const fighter=(weapon,age,extra={})=>({character:'aren',weapon,y:0,buffs:[],action:{source:'weapon',move:WEAPONS[weapon].move,age},...extra});
const finite=list=>list.every(Number.isFinite);

test('every equippable weapon has painted in-fight art and every atlas fighter has measured hands',()=>{
 assert.deepEqual(Object.keys(WEAPON_ART).sort(),Object.keys(WEAPONS).sort());
 for(const [id,art] of Object.entries(WEAPON_ART)){
  assert.ok(existsSync(new URL(`../apps/web/${weaponArtUrl(id).slice(2)}`,import.meta.url)),`${id} painted icon ships`);
  assert.ok(art.length>0&&['swing','thrust','disc'].includes(art.style));
  for(const point of [art.grip,art.tip])assert.ok(point.every(v=>v>=0&&v<=1));
 }
 assert.deepEqual(Object.keys(HAND_ANCHORS).sort(),Object.keys(FIGHTER_ATLAS_DATA).sort());
 for(const hands of Object.values(HAND_ANCHORS))assert.deepEqual(Object.keys(hands),['8','9','10','11']);
 assert.deepEqual(handFor({character:'eira'},9),[96,-95]);
 assert.equal(handFor({character:'unknown'},10).length,2,'unmeasured fighters fall back to a generic hand');
});

test('painted backdrop is cut out from the border inwards without eating the weapon',()=>{
 const size=8,data=new Uint8ClampedArray(size*size*4);
 const put=(x,y,r,g,b)=>data.set([r,g,b,255],(y*size+x)*4);
 for(let y=0;y<size;y++)for(let x=0;x<size;x++)put(x,y,12,20,38);
 for(let y=2;y<6;y++)for(let x=2;x<6;x++)put(x,y,230,240,250);
 // A dark rivet enclosed by the blade matches no backdrop tolerance and must survive.
 put(3,3,70,80,100);
 cutoutBackground(data,size,size);
 const alpha=(x,y)=>data[(y*size+x)*4+3];
 assert.equal(alpha(0,0),0);assert.equal(alpha(7,4),0);assert.equal(alpha(1,1),0);
 assert.equal(alpha(2,2),255);assert.equal(alpha(5,5),255);assert.equal(alpha(3,3),255);
 assert.deepEqual([...data.slice((2*size+2)*4,(2*size+2)*4+3)],[230,240,250],'opaque weapon pixels keep their colour');
});

test('a sword stays in the leading hand, swings through the active frames and leaves a fading trail',()=>{
 const m=MOVES.skyforgedBlade,end=m.startup+m.active;
 assert.equal(weaponPoseFor({character:'aren',weapon:'skyforgedBlade',action:null}),null);
 assert.equal(weaponPoseFor({character:'aren',weapon:'skyforgedBlade',action:{source:'attack',move:'attack',age:3}}),null,'weapons only show during weapon attacks');
 const windup=weaponPoseFor(fighter('skyforgedBlade',m.startup-1)),first=weaponPoseFor(fighter('skyforgedBlade',m.startup)),last=weaponPoseFor(fighter('skyforgedBlade',end-1)),rest=weaponPoseFor(fighter('skyforgedBlade',end+m.recovery-1));
 assert.deepEqual([windup.x,windup.y],HAND_ANCHORS.aren[8]);assert.deepEqual([first.x,first.y],HAND_ANCHORS.aren[9]);assert.deepEqual([rest.x,rest.y],HAND_ANCHORS.aren[10]);
 assert.ok(windup.rotation<-1.5,'blade is raised behind the vertical before the cut');
 assert.ok(last.rotation>first.rotation&&last.rotation>0,'blade ends forward and below the hand');
 assert.equal(windup.trail,null);
 for(const pose of [first,last]){assert.ok(pose.trail.points.length>=12&&finite(pose.trail.points)&&finite(pose.trail.edge));assert.ok(pose.trail.alpha>0);}
 const after=weaponPoseFor(fighter('skyforgedBlade',end+2));
 assert.ok(after.trail.alpha<last.trail.alpha,'trail fades once the cut is over');
 assert.equal(weaponPoseFor(fighter('skyforgedBlade',end+6)).trail,null);
 assert.ok(rest.alpha<1&&rest.alpha>=0,'weapon fades out as recovery ends');
 // The tip reaches roughly the move's range at the end of the cut.
 const tip=last.x+Math.cos(last.rotation)*last.length;assert.ok(tip>m.reach*.8&&tip<m.reach*1.15,`tip ${tip}`);
 const air=weaponPoseFor(fighter('skyforgedBlade',m.startup,{y:60}));
 assert.deepEqual([air.x,air.y],HAND_ANCHORS.aren[11],'aerial cuts hang from the raised hand');
 assert.deepEqual([weaponPoseFor(fighter('skyforgedBlade',2),0,false,12).x,weaponPoseFor(fighter('skyforgedBlade',2),0,false,12).y],[32,-58],'the pose on screen decides the hand');
 assert.equal(weaponPoseFor(fighter('skyforgedBlade',m.startup,{buffs:[{type:'poisonCoating'}]})).color,0xb5e08b);
});

test('thrusts drive forward, discs leave the hand when thrown and sprites line up with the pose',()=>{
 const spike=MOVES.conduitSpike,back=weaponPoseFor(fighter('conduitSpike',spike.startup-1)),through=weaponPoseFor(fighter('conduitSpike',spike.startup+spike.active-1));
 assert.ok(Math.abs(back.rotation)<.2&&Math.abs(through.rotation)<.2,'spike stays level');
 assert.ok(back.x<HAND_ANCHORS.aren[8][0]&&through.x>HAND_ANCHORS.aren[9][0],'drawn back, then driven through');
 assert.equal(through.trail.points.length,6);
 const disc=MOVES.orbitDisc,held=weaponPoseFor(fighter('orbitDisc',1),10);
 assert.ok(held&&held.trail===null&&held.rotation!==0);
 assert.equal(weaponPoseFor(fighter('orbitDisc',1),10,true).rotation,0,'reduced motion stops the spin');
 assert.equal(weaponPoseFor(fighter('orbitDisc',disc.startup),10),null,'the projectile takes over once thrown');
 for(const id of Object.keys(WEAPON_ART)){
  const pose=weaponPoseFor(fighter(id,2),4);if(!pose)continue;
  const sprite=weaponSpriteFor(pose,256),art=WEAPON_ART[id],dx=(art.tip[0]-art.grip[0])*256,dy=(art.tip[1]-art.grip[1])*256;
  // Rotating and scaling the painted grip-to-tip vector must land on the posed blade.
  const x=(dx*Math.cos(sprite.rotation)-dy*Math.sin(sprite.rotation))*sprite.scale,y=(dx*Math.sin(sprite.rotation)+dy*Math.cos(sprite.rotation))*sprite.scale;
  assert.ok(Math.abs(x-Math.cos(pose.rotation)*pose.length)<1e-6&&Math.abs(y-Math.sin(pose.rotation)*pose.length)<1e-6,id);
  assert.deepEqual([sprite.anchorX,sprite.anchorY],art.grip);
 }
});

test('unarmed strikes get a swoosh only while they connect, and scenes carry weapons to the sprite layer',()=>{
 const m=MOVES.attack,strike=age=>strikeArcFor({y:0,action:{source:'attack',move:'attack',age}});
 assert.equal(strike(0),null);assert.equal(strikeArcFor({action:null}),null);
 const arc=strike(m.startup);assert.ok(arc&&finite(arc.points)&&finite(arc.edge)&&arc.alpha>0);
 assert.equal(strike(m.startup+m.active+3),null);
 assert.equal(strikeArcFor(fighter('skyforgedBlade',12)),null,'weapon attacks use their own trail');
 const projectile=Object.entries(MOVES).find(([,move])=>move.projectile)[0];
 assert.equal(strikeArcFor({y:0,action:{source:'special1',move:projectile,age:MOVES[projectile].startup}}),null);

 const state=createTraining([{character:'aren',weapon:'skyforgedBlade'},{character:'winta',weapon:'orbitDisc'}]);
 const idle=practiceSceneFor(state,{worldWidth:1600,viewHeight:472,zoom:1});
 assert.equal(idle.fighters[0].weapon,null);assert.equal(idle.fighters[0].arc,null);
 stepTraining(state,{weapon:true});for(let n=0;n<MOVES.skyforgedBlade.startup;n++)stepTraining(state,{});
 const before=structuredClone(state),scene=practiceSceneFor(state,{worldWidth:1600,viewHeight:472,zoom:1});
 assert.deepEqual(state,before,'presentation never mutates the match');
 assert.equal(scene.fighters[0].weapon.id,'skyforgedBlade');assert.equal(scene.fighters[0].arc,scene.fighters[0].weapon.trail);
 state.projectiles.push({x:700,y:60,vx:9,move:'orbitDisc',owner:1},{x:700,y:60,vx:9,move:projectile,owner:1});
 const thrown=practiceSceneFor(state,{worldWidth:1600,viewHeight:472,zoom:1}).projectiles;
 assert.equal(thrown[0].sprite,'orbitDisc');assert.equal(thrown[1].sprite,undefined);
});
