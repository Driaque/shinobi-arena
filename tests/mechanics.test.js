import test from 'node:test';
import assert from 'node:assert/strict';
import {createMatch,stepMatch,nextRound,moveFor,CHARACTERS} from '../packages/engine/index.js';
const load=(character,weapon='kunai')=>({character,weapon});
const advance=(s,n,inputs=[{},{}])=>{for(let i=0;i<n;i++)stepMatch(s,inputs);return s;};
function close(character='naruto',weapon='kunai'){
 const s=createMatch([load(character,weapon),load('naruto')]);s.fighters[0].x=600;s.fighters[1].x=670;return s;
}
test('double jump grants exactly two impulses until landing',()=>{
 const s=createMatch();stepMatch(s,[{jump:true},{}]);advance(s,8);stepMatch(s,[{jump:true},{}]);
 assert.equal(s.fighters[0].jumps,2);const vy=s.fighters[0].vy;stepMatch(s);stepMatch(s,[{jump:true},{}]);
 assert.ok(s.fighters[0].vy<vy);advance(s,100);assert.equal(s.fighters[0].jumps,0);
 stepMatch(s,[{jump:true},{}]);assert.equal(s.fighters[0].jumps,1);
});
test('double-tapping either direction dashes, holding a direction does not',()=>{
 for(const direction of ['left','right']){
  const s=createMatch();stepMatch(s,[{[direction]:true},{}]);stepMatch(s);stepMatch(s,[{[direction]:true},{}]);
  assert.ok(s.fighters[0].dash);assert.equal(s.fighters[0].dash.direction,direction==='left'?-1:1);
 }
 const s=createMatch();advance(s,10,[{right:true},{}]);assert.equal(s.fighters[0].dash,null);
});
test('explicit forward/back dash follows facing and has no invulnerability',()=>{
 const s=createMatch();const x=s.fighters[0].x;stepMatch(s,[{dashBack:true},{}]);
 assert.ok(s.fighters[0].x<x);assert.equal(s.fighters[0].invulnerable,0);
 const right=s.fighters[1].x;stepMatch(s,[{}, {dashForward:true}]);assert.ok(s.fighters[1].x<right);
});
test('Replacement escapes hitstun, costs chakra and preserves poison',()=>{
 const s=close();const f=s.fighters[0];f.stun=14;f.effects=[{type:'poison',remaining:240,potency:9,nextTick:60}];
 stepMatch(s,[{replacement:true},{}]);assert.equal(f.stun,0);assert.ok(f.x<600);assert.ok(f.chakra<76);
 assert.equal(f.invulnerable,18);assert.equal(f.cooldowns.replacement,480);assert.equal(f.effects[0].type,'poison');
 const x=f.x;stepMatch(s);stepMatch(s,[{replacement:true},{}]);assert.equal(f.x,x);
});
test('Replacement fails without chakra and does not consume cooldown',()=>{
 const s=close();s.fighters[0].chakra=10;s.fighters[0].stun=15;stepMatch(s,[{replacement:true},{}]);
 assert.equal(s.fighters[0].x,600);assert.equal(s.fighters[0].invulnerable,0);assert.equal(s.fighters[0].cooldowns.replacement??0,0);
});
test('Replacement evades a direct hit, but periodic poison still ticks',()=>{
 const s=close();const f=s.fighters[0];stepMatch(s,[{replacement:true},{}]);f.x=600;
 advance(s,6,[{}, {attack:true}]);assert.equal(f.hp,1000);
 f.effects=[{type:'poison',remaining:120,potency:9,nextTick:s.tick+1}];stepMatch(s);assert.equal(f.hp,991);
});
test('Chidori pierces guard while Rasengan is reduced by guard',()=>{
 const pierce=close('sasuke');advance(pierce,13,[{special1:true},{block:true}]);assert.equal(pierce.fighters[1].hp,850);
 const guarded=close('naruto');advance(guarded,13,[{special1:true},{block:true}]);assert.equal(guarded.fighters[1].hp,988);
});
test('snake strike applies poison for six one-second ticks, without stacking',()=>{
 const s=close('orochimaru');advance(s,15,[{special1:true},{}]);const f=s.fighters[1];
 assert.equal(f.hp,905);assert.equal(f.effects[0].type,'poison');advance(s,360);
 assert.equal(f.hp,851);assert.equal(f.effects.length,0);
});
test('ordinary guard prevents poison application',()=>{
 const s=close('orochimaru');advance(s,15,[{special1:true},{block:true}]);assert.equal(s.fighters[1].effects.length,0);
});
test('fireball applies burn, which expires after four ticks',()=>{
 const s=createMatch();s.fighters[0].x=400;s.fighters[1].x=800;
 advance(s,50,[{}, {special2:true}]);const f=s.fighters[0];assert.equal(f.effects[0].type,'burn');
 advance(s,240);assert.equal(f.hp,842);assert.equal(f.effects.length,0);
});
test('Chakra Point Strike applies a 30 percent outgoing damage nerf',()=>{
 const s=close('hinata');advance(s,9,[{special2:true},{}]);const target=s.fighters[1];
 assert.equal(target.effects[0].type,'weaken');assert.equal(target.effects[0].potency,0.3);
 target.stun=0;target.x=670;s.fighters[0].action=null; // Isolate weaken from recovery-punish damage.
 advance(s,6,[{}, {attack:true}]);assert.equal(s.fighters[0].hp,954);
});
test('Byakugan temporarily lets a weapon penetrate guard',()=>{
 const s=close('hinata');advance(s,25,[{bloodline:true},{}]);assert.equal(s.fighters[0].buffs[0].type,'byakugan');
 advance(s,7,[{weapon:true},{block:true}]);assert.equal(s.fighters[1].hp,925);
 advance(s,300);assert.equal(s.fighters[0].buffs.length,0);
});
test('bloodline actions are unavailable for Naruto and Orochimaru',()=>{
 for(const character of ['naruto','orochimaru']){
  const s=close(character);stepMatch(s,[{bloodline:true},{}]);assert.equal(s.fighters[0].action,null);assert.equal(s.fighters[0].chakra,100);
 }
});
test('weapon selection produces distinct attack definitions and survives rounds',()=>{
 for(const weapon of ['kunai','katana','shuriken']){
  const s=close('sasuke',weapon);assert.equal(moveFor(s.fighters[0],'weapon'),weapon);
  s.fighters[1].hp=0;stepMatch(s);nextRound(s);assert.equal(s.fighters[0].weapon,weapon);assert.equal(s.fighters[0].character,'sasuke');
 }
 const s=close('naruto','katana');advance(s,11,[{weapon:true},{}]);assert.equal(s.fighters[1].hp,900);
});
test('unrecognized loadouts are rejected',()=>{
 assert.throws(()=>createMatch([load('unknown'),load('sasuke')]));
 assert.throws(()=>createMatch([load('__proto__'),load('sasuke')]));
 assert.throws(()=>createMatch([load('naruto','unknown'),load('sasuke')]));
 assert.throws(()=>createMatch([load('naruto')]));
});
test('signature cooldown rejects a second press after recovery',()=>{
 const s=close('naruto');advance(s,46,[{special1:true},{}]);advance(s,1);const chakra=s.fighters[0].chakra;
 stepMatch(s,[{special1:true},{}]);assert.equal(s.fighters[0].action,null);assert.ok(s.fighters[0].chakra>=chakra);
});
test('every character can finish a simulated round and keep valid resources',()=>{
 for(const character of Object.keys(CHARACTERS)){
  const s=createMatch([load(character,'shuriken'),load('sasuke','katana')]);
  for(let t=0;t<5401&&s.status==='playing';t++)stepMatch(s,[{right:t%150<70,weapon:t%40===0,special1:t%160===0,special2:t%200===0,bloodline:t%700===0,jump:t%120===0},{}]);
  assert.notEqual(s.status,'playing');assert.ok(s.fighters.every(f=>f.hp>=0&&f.chakra>=0&&f.chakra<=100));
 }
});

test('reapplying poison refreshes one effect without resetting its next damage tick',()=>{
 const s=close('orochimaru');advance(s,15,[{special1:true},{}]);advance(s,200);
 const next=s.fighters[1].effects[0].nextTick;s.fighters[1].x=670;
 advance(s,15,[{special1:true},{}]);
 assert.equal(s.fighters[1].effects.length,1);assert.equal(s.fighters[1].effects[0].potency,9);
 assert.equal(s.fighters[1].effects[0].nextTick,next);assert.ok(s.fighters[1].effects[0].remaining>=350);
});

