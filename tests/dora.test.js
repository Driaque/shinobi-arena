import test from 'node:test';
import assert from 'node:assert/strict';
import {createMatch,stepMatch,nextRound,moveFor,activeAwakening,computerInput} from '../packages/engine/index.js';
import {playerProfile} from '../packages/network/protocol.js';
const advance=(s,n,inputs=[{},{}])=>{for(let i=0;i<n;i++)stepMatch(s,inputs);};
function duel(distance=70,opponent='sasuke'){const s=createMatch([{character:'dora',weapon:'fans',weapons:['fans','katana']},{character:opponent,weapon:'kunai'}]);s.fighters[0].x=600;s.fighters[1].x=600+distance;return s;}
test('Dora and both weapons validate for online play; fan basics connect with normal scaling',()=>{
 const profile=playerProfile({name:'AquaPrincess',character:'dora',weapon:'fans',weapons:['fans','katana']});assert.equal(profile.character,'dora');assert.deepEqual(profile.weapons,['fans','katana']);
 const s=duel();for(let t=0;t<28;t++)stepMatch(s,[{attack:[0,7,17].includes(t)},{}]);assert.equal(s.fighters[0].combo.hits,3);assert.equal(s.fighters[0].combo.damage,182);
});
test('Tidal Edict weakens clean hits for three seconds, and guard or Replacement prevents it',()=>{
 const s=duel(250);advance(s,40,[{special1:true},{}]);const f=s.fighters[1];assert.equal(f.hp,935);assert.equal(f.effects.find(e=>e.type==='weaken').potency,.25);
 advance(s,20);s.fighters[0].x=600;f.x=670;advance(s,6,[{},{attack:true}]);assert.equal(s.fighters[0].hp,951,'65 damage reduced by 25%, rounded up');advance(s,181);assert.equal(f.effects.length,0);
 for(const input of [{block:true},{replacement:true}]){const q=duel(250);advance(q,40,[{special1:true},input]);assert.equal(q.fighters[1].effects.length,0);}
});
test('weaken uses the same potency for ranged and melee attacks',()=>{
 const s=duel(250);s.fighters[0].effects=[{type:'weaken',remaining:180,potency:.25,nextTick:60}];advance(s,40,[{special1:true},{}]);assert.equal(s.fighters[1].hp,951);
});
test('Royal Tempest pulls and weakens into a committed heavy follow-up; one chakra charge',()=>{
 const s=duel(260);advance(s,21,[{special2:true},{}]);assert.equal(s.fighters[1].x,710);assert.equal(s.fighters[1].hp,965);assert.equal(s.fighters[0].action.move,'tempestFinish');assert.equal(s.fighters[1].effects[0].type,'weaken');
 advance(s,18);assert.equal(s.fighters[1].hp,835);assert.ok(s.fighters[1].vy>0);assert.ok(s.fighters[0].chakra>60&&s.fighters[0].chakra<63);assert.ok(s.fighters[0].cooldowns.special2>300);
});
test('Tempest never starts a follow-up on block, Replacement or a whiff',()=>{
 for(const [distance,input]of [[260,{block:true}],[260,{replacement:true}],[400,{}]]){const s=duel(distance);advance(s,21,[{special2:true},input]);assert.equal(s.fighters[0].action.move,'royalTempest');assert.equal(s.fighters[1].effects.length,0);}
});
test('a pulled opponent can guard, parry or replace before the heavy strike',()=>{
 const guard=duel(260);advance(guard,21,[{special2:true},{}]);advance(guard,18,[{},{block:true}]);assert.ok(guard.fighters[1].hp>900);assert.equal(guard.fighters[1].blockedHit,true);
 const parry=duel(260);advance(parry,21,[{special2:true},{}]);advance(parry,15);advance(parry,3,[{},{block:true}]);assert.ok(parry.events.some(e=>e.type==='parry'));assert.equal(parry.fighters[0].action,null);
 const replace=duel(260);advance(replace,21,[{special2:true},{}]);advance(replace,18,[{},{replacement:true}]);assert.equal(replace.fighters[1].hp,965);assert.equal(replace.fighters[1].stun,0);
});
test('Triune Flow requires a guarded hit and empowers one fan counter without reflect or healing',()=>{
 const s=duel();advance(s,25,[{bloodline:true},{}]);advance(s,6,[{block:true},{attack:true}]);assert.equal(s.fighters[0].hp,994);assert.equal(s.fighters[1].hp,1000);assert.ok(s.fighters[0].buffs.some(b=>b.type==='counter'));
 advance(s,30);s.fighters[1].x=670;advance(s,6,[{attack:true},{}]);assert.equal(s.fighters[1].hp,912);assert.ok(!s.fighters[0].buffs.some(b=>b.type==='counter'));
 const pierced=duel();advance(pierced,25,[{bloodline:true},{}]);advance(pierced,13,[{block:true},{special1:true}]);assert.ok(!pierced.fighters[0].buffs.some(b=>b.type==='counter'));assert.equal(pierced.fighters[0].hp,850);
});
test('Limit Release costs accumulated damage, changes wind/fire moves, expires and resets next round',()=>{
 const s=duel(260),f=s.fighters[0];stepMatch(s,[{awakening:true},{}]);assert.equal(activeAwakening(f),null);f.hp=600;f.damageTaken=400;stepMatch(s);stepMatch(s,[{awakening:true},{}]);assert.equal(activeAwakening(f).name,'Limit Release');assert.equal(f.hp,600);assert.equal(f.invulnerable,0);assert.equal(moveFor(f,'special1'),'royalGale');assert.equal(moveFor(f,'special2'),'releasedTempest');
 advance(s,40,[{special1:true},{}]);assert.ok(s.fighters[1].effects.some(e=>e.type==='burn'));advance(s,600);assert.equal(activeAwakening(f),null);assert.equal(moveFor(f,'special1'),'tidalEdict');assert.equal(f.awakeningUsed,true);s.fighters[1].hp=0;stepMatch(s);nextRound(s);assert.equal(f.awakeningUsed,true);assert.equal(s.fighters[0].awakeningUsed,false);
});
test('Dora mirrors and CPU fights remain deterministic with bounded resources',()=>{
 const a=duel(70,'dora'),b=duel(70,'dora');for(let t=0;t<1800;t++){const inputs=[{attack:t%32===0,special1:t%220===0,special2:t%400===0,bloodline:t%600===0,block:t%180<40,awakening:t%200===0},computerInput(a)];stepMatch(a,inputs);stepMatch(b,inputs);}assert.deepEqual(a,b);for(const f of a.fighters){assert.ok(Number.isFinite(f.hp)&&f.hp>=0&&f.hp<=1000);assert.ok(f.chakra>=0&&f.chakra<=100);}
});
