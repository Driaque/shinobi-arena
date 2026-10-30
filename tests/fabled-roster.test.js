import test from 'node:test';import assert from 'node:assert/strict';
import {ORIGINAL_FIGHTERS,DEFAULT_FIGHTERS,isOriginalFighter} from '../packages/engine/originals.js';
import {CHARACTERS,validateLoadout,createMatch,stepMatch} from '../packages/engine/index.js';
import {sceneryFor,projectileShapes} from '../packages/presentation/battlefield.js';
import {practiceSceneFor} from '../packages/presentation/practice-scene.js';
test('ten originals have playable distinct kits, connected stories and original defaults',()=>{
 assert.equal(Object.keys(ORIGINAL_FIGHTERS).length,10);assert.deepEqual(DEFAULT_FIGHTERS,['aren','winta']);assert.equal(isOriginalFighter('naruto'),false);
 const kits=new Set();for(const c of Object.values(ORIGINAL_FIGHTERS)){
  assert.equal(CHARACTERS[c.id],c);assert.ok(c.backstory.length>100&&c.relationships.length>50);kits.add(c.special1+'|'+c.special2);
  const l=validateLoadout({character:c.id,weapon:c.defaultWeapon});const s=createMatch([l,l]);for(let i=0;i<90;i++)stepMatch(s,[{special1:i===0},{}]);assert.ok(s.fighters.every(f=>Number.isFinite(f.hp)));
 }assert.equal(kits.size,10);
 for(const c of ['silent','winta','dora','aren'])assert.ok(isOriginalFighter(c));
});
test('native projectile/scenery geometry is bounded, deterministic and retains exact snapshot positions across seeks',()=>{
 const scene={tick:100,decorative:true,parallax:4,projectiles:[{x:700,y:100,depth:20,move:'itemRaijin',direction:-1},{x:900,y:80,move:'itemBomb',life:30},{x:800,y:40,move:'itemShuriken'}]};
 const before=structuredClone(scene),a=projectileShapes(scene);assert.deepEqual(a,projectileShapes(scene));assert.deepEqual(scene,before);assert.equal(a[0].points[0],682);assert.equal(a[0].points[1],563);assert.ok(sceneryFor(scene).length<100);
 scene.tick=0;assert.deepEqual(projectileShapes({...scene,tick:100}),a);
 const s=createMatch();s.fighters[0].character='aren';s.projectiles=[{x:700,y:100,depth:20,move:'fireball'}];const p=practiceSceneFor(s,{}, {selected:true});assert.equal(p.fighters.length,1);assert.equal(p.fighters[0].id,0);assert.equal(p.projectiles[0].x,700);assert.equal(p.projectiles[0].element,'fire');
});
