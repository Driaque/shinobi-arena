import test from 'node:test';import assert from 'node:assert/strict';
import {createMatch,stepMatch,fighterBody,FIGHTER_SCALE} from '../packages/engine/index.js';
import {cleanInput} from '../packages/network/protocol.js';
const low={crouch:true,block:true},advance=(s,n,inputs=[low,{}])=>{for(let t=0;t<n;t++)stepMatch(s,inputs);};
const duel=()=>{const s=createMatch();s.fighters[0].x=600;s.fighters[1].x=670;advance(s,10);return s;};
const shot=(s,height=50)=>s.projectiles.push({id:s.nextId++,owner:1,x:614,y:height,direction:-1,life:20,move:'shuriken',pierce:0});
test('held crouch guard survives chip and repeated hits throughout blocked-hit recovery',()=>{
 const s=duel(),f=s.fighters[0];shot(s);stepMatch(s,[low,{}]);assert.equal(f.hp,995);assert.equal(f.guardStun,7);assert.equal(f.crouching,true);assert.equal(f.blocking,true);
 shot(s);stepMatch(s,[low,{}]);assert.equal(f.hp,990);for(let t=0;t<6;t++){stepMatch(s,[low,{}]);assert.equal(f.crouching,true);assert.equal(f.blocking,true);}assert.equal(f.guard,56);
});
test('releasing Guard exposes crouch; ordinary hitstun cannot become a free shield',()=>{
 const s=duel(),f=s.fighters[0];shot(s);stepMatch(s,[low,{}]);shot(s);stepMatch(s,[{crouch:true},{}]);assert.equal(f.hp,940);assert.equal(f.guardStun,0);stepMatch(s,[low,{}]);assert.equal(f.blocking,false);assert.equal(f.crouching,false);
});
test('guard break and full pierce defeat a crouch guard and clear block recovery',()=>{
 const broken=duel(),f=broken.fighters[0];f.guard=10;shot(broken);stepMatch(broken,[low,{}]);assert.equal(f.guardStun,0);assert.ok(broken.events.some(e=>e.type==='guardBreak'));stepMatch(broken,[low,{}]);assert.equal(f.blocking,false);assert.equal(f.crouching,false);
 const pierce=duel();advance(pierce,13,[low,{special1:true}]);assert.equal(pierce.fighters[0].hp,850);assert.equal(pierce.fighters[0].guardStun,0);
});
test('crouch by itself never grants a guard and defensive recovery never permits attacks',()=>{
 const s=duel(),f=s.fighters[0];shot(s);stepMatch(s,[low,{}]);stepMatch(s,[{...low,attack:true},{}]);assert.equal(f.action,null);assert.equal(f.blocking,true);
 const bare=duel();bare.fighters[0].blocking=false;shot(bare);stepMatch(bare,[{crouch:true},{}]);assert.equal(bare.fighters[0].hp,945);
});
test('live body sizes and push collision scale together while older recordings retain original scale',()=>{
 const s=createMatch(),f=s.fighters[0];assert.equal(f.scale,.96);assert.equal(FIGHTER_SCALE,.96);assert.equal(fighterBody(f).width,52*.96);assert.equal(fighterBody(f).height,120*.96);f.crouching=true;assert.equal(fighterBody(f).height,76*.96);
 assert.equal(fighterBody({crouching:false}).width,52);assert.equal(fighterBody({crouching:false}).height,120);
 s.fighters[0].x=640;s.fighters[1].x=641;stepMatch(s);assert.ok(Math.abs(s.fighters[1].x-s.fighters[0].x-52*.96)<.001);
});
test('projectile body collision matches the reduced standing height rather than an old invisible hitbox',()=>{
 for(const [scale,hp]of [[.88,1000],[1,945]]){const s=duel();s.fighters[0].scale=scale;shot(s,110);stepMatch(s,[{},{}]);assert.equal(s.fighters[0].hp,hp);}
 const input=cleanInput({...low,scale:10,guardStun:100});assert.equal(input.block,true);assert.equal(input.crouch,true);assert.equal(input.scale,undefined);assert.equal(input.guardStun,undefined);
});


test('a simultaneous blocked shot cannot overwrite real piercing hitstun with shield recovery',()=>{
 const s=duel(),f=s.fighters[0];s.projectiles.push({id:s.nextId++,owner:1,x:614,y:50,direction:-1,life:20,move:'fireball',pierce:1});shot(s);stepMatch(s,[low,{}]);assert.ok(f.stun>f.guardStun);stepMatch(s,[low,{}]);assert.equal(f.blocking,false);assert.equal(f.crouching,false);
});
