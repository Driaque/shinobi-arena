import test from 'node:test';
import assert from 'node:assert/strict';
import { createMatch, stepMatch, nextRound, computerInput, ARENA } from '../packages/engine/index.js';
function advance(s,n,inputs=[{},{}]){for(let i=0;i<n;i++)stepMatch(s,inputs);return s;}
function closeMatch(){const s=createMatch();s.fighters[0].x=600;s.fighters[1].x=670;return s;}
test('movement is bounded and opposite directions cancel',()=>{
 const s=createMatch();advance(s,500,[{left:true},{}]);assert.equal(s.fighters[0].x,ARENA.margin);
 const x=s.fighters[0].x;advance(s,10,[{left:true,right:true},{}]);assert.equal(s.fighters[0].x,x);
});
test('jump lands and holding jump cannot trigger another jump',()=>{
 const s=createMatch();advance(s,1,[{jump:true},{}]);assert.ok(s.fighters[0].y>0);
 advance(s,100,[{jump:true},{}]);assert.equal(s.fighters[0].y,0);
 advance(s,1);advance(s,1,[{jump:true},{}]);assert.ok(s.fighters[0].y>0);
});
test('melee damage occurs after startup and only once per swing',()=>{
 const s=closeMatch();advance(s,5,[{attack:true},{}]);assert.equal(s.fighters[1].hp,1000);
 advance(s,1,[{attack:true},{}]);assert.equal(s.fighters[1].hp,935);
 advance(s,40,[{attack:true},{}]);assert.equal(s.fighters[1].hp,935);
});
test('a second distinct press can start the next attack',()=>{
 const s=closeMatch();advance(s,30,[{attack:true},{}]);advance(s,1);
 s.fighters[1].x=670;advance(s,6,[{attack:true},{}]);assert.equal(s.fighters[1].hp,870);
});
test('grounded guard reduces damage and airborne guard does not',()=>{
 const blocked=closeMatch();advance(blocked,6,[{attack:true},{block:true}]);assert.equal(blocked.fighters[1].hp,994);
 const air=closeMatch();air.fighters[1].y=20;air.fighters[1].vy=0;
 advance(air,6,[{attack:true},{block:true}]);assert.equal(air.fighters[1].hp,935);
});
test('same-tick hits trade and double knockout awards no win',()=>{
 const s=closeMatch();s.fighters.forEach(f=>f.hp=65);
 advance(s,6,[{attack:true},{attack:true}]);assert.deepEqual(s.fighters.map(f=>f.hp),[0,0]);
 assert.equal(s.result,'draw');assert.deepEqual(s.wins,[0,0]);assert.equal(s.status,'roundOver');
});
test('special rejects insufficient chakra and holding does not repeatedly spend',()=>{
 const s=createMatch();s.fighters[0].chakra=5;advance(s,1,[{special1:true},{}]);assert.equal(s.fighters[0].action,null);
 s.fighters[0].chakra=100;advance(s,1);advance(s,1,[{special1:true},{}]);assert.ok(s.fighters[0].chakra<71);
 advance(s,100,[{special1:true},{}]);assert.ok(s.fighters[0].chakra>70);assert.equal(s.fighters[0].action,null);
});
test('fireball damages once and is removed',()=>{
 const s=createMatch();s.fighters[0].x=400;s.fighters[1].x=800;
 advance(s,50,[{}, {special2:true}]);assert.equal(s.fighters[0].hp,890);assert.equal(s.projectiles.length,0);
});
test('a sufficiently high jump avoids a fireball',()=>{
 const s=createMatch();s.fighters[0].x=400;s.fighters[1].x=800;
 stepMatch(s,[{}, {special2:true}]);advance(s,20);stepMatch(s,[{jump:true},{}]);advance(s,20);
 assert.equal(s.fighters[0].hp,1000);
});
test('hitstun interrupts a slower attack',()=>{
 const s=closeMatch();advance(s,6,[{attack:true},{special1:true}]);assert.equal(s.fighters[1].action,null);
 assert.ok(s.fighters[1].stun>0);assert.equal(s.fighters[0].hp,1000);
});
test('first to two round wins ends the match; next round resets resources',()=>{
 const s=createMatch();s.fighters[1].hp=0;stepMatch(s);
 assert.equal(s.status,'roundOver');assert.equal(s.wins[0],1);assert.ok(nextRound(s));
 assert.equal(s.round,2);assert.equal(s.fighters[1].hp,1000);assert.equal(s.remainingTicks,5400);
 s.fighters[1].hp=0;stepMatch(s);assert.equal(s.status,'matchOver');assert.equal(s.wins[0],2);assert.equal(nextRound(s),false);
 const tick=s.tick;stepMatch(s);assert.equal(s.tick,tick);
});
test('timer expiry resolves a round and stops simulation',()=>{
 const s=createMatch();s.remainingTicks=1;s.fighters[1].hp=999;stepMatch(s);
 assert.equal(s.result,'player1');assert.equal(s.status,'roundOver');
});
test('input replay produces identical complete simulation state',()=>{
 const a=createMatch(),b=createMatch();
 for(let t=0;t<2000;t++){
  const input=[{right:t%120<60,attack:t%30===0,jump:t%180===0,special1:t%240===0},computerInput(a)];
  stepMatch(a,input);stepMatch(b,input);
 }
 assert.deepEqual(a,b);
});
test('computer opponent completes a round against an idle player',()=>{
 const s=createMatch();let cpu={};
 for(let t=0;t<5401&&s.status==='playing';t++){if(s.tick%8===0)cpu=computerInput(s);stepMatch(s,[{},cpu]);}
 assert.equal(s.status,'roundOver');assert.equal(s.result,'player2');
});
test('body collision prevents two grounded fighters passing through each other',()=>{
 const s=closeMatch();advance(s,50,[{right:true},{left:true}]);assert.ok(s.fighters[1].x-s.fighters[0].x>=52);
});
