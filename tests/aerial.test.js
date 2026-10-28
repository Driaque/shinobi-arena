import test from 'node:test';
import assert from 'node:assert/strict';
import {createMatch,stepMatch,MOVES,JUTSUS} from '../packages/engine/index.js';
import {fighterPose,interpolateFighter} from '../apps/web/motion.js';
const duel=()=>{const s=createMatch([{character:'silent',weapon:'katana',jutsus:['risingGale','skyCleave','divingFlame','aerialSenbon','emberField']},{character:'sasuke',weapon:'kunai'}]);s.fighters[0].x=600;s.fighters[1].x=670;return s;};
const advance=(s,n,inputs=[{},{}])=>{for(let t=0;t<n;t++)stepMatch(s,inputs);};
const route=(s,t)=>{const keys={0:'special1',11:'jump',13:'attack',21:'attack',29:'special2',40:'bloodline'};stepMatch(s,[keys[t]?{[keys[t]]:true}:{},{}]);};
test('aerial-only and grounded techniques reject the wrong environment before spending resources',()=>{
 const s=duel(),f=s.fighters[0];stepMatch(s,[{special2:true},{}]);assert.equal(f.action,null);assert.equal(f.chakra,100);assert.equal(f.cooldowns.special2,undefined);assert.equal(s.events[0].type,'aerialBlocked');
 f.y=100;stepMatch(s,[{jutsu5:true},{}]);assert.equal(f.action,null);assert.equal(f.chakra,100);assert.equal(s.zones.length,0);
 assert.ok(JUTSUS.skyCleave.tags.includes('AERIAL ONLY'));assert.ok(JUTSUS.skyCleave.tags.includes('AIR COMBO'));assert.ok(JUTSUS.risingGale.tags.includes('LAUNCHER'));
});
test('launcher confirms chase into a five-hit aerial route, scaled damage and downward finisher',()=>{
 const s=duel(),events=[];for(let t=0;t<54;t++){route(s,t);events.push(...s.events);}
 assert.ok(events.some(e=>e.type==='airChase'));assert.ok(events.some(e=>e.move==='airAttack1'));assert.ok(events.some(e=>e.move==='airAttack2'));assert.ok(events.some(e=>e.move==='skyCleave'));assert.ok(events.some(e=>e.type==='airFinish'));assert.ok(events.some(e=>e.type==='airEscape'));
 assert.equal(s.fighters[0].combo.hits,5);assert.equal(s.fighters[0].airAttacks,4);assert.equal(s.fighters[1].hp,710);assert.ok(s.fighters[1].vy<0);
});
test('whiffed, guarded and bound launchers cannot cancel recovery into a chase',()=>{
 for(const kind of ['whiff','guard','bind']){const s=duel(),f=s.fighters[0];if(kind==='whiff')s.fighters[1].x=1000;if(kind==='bind')f.effects=[{type:'bind',remaining:100,potency:1,nextTick:60}];
 for(let t=0;t<15;t++)stepMatch(s,[{special1:t===0,jump:t===11},kind==='guard'?{block:true}:{}]);assert.equal(f.y,0);assert.equal(f.action?.move,'risingGale');}
});
test('air attack budget survives double jump and resets only on landing',()=>{
 const s=duel(),f=s.fighters[0];f.y=300;f.airAttacks=4;f.jumps=1;stepMatch(s,[{jump:true,attack:true},{}]);assert.equal(f.jumps,2);assert.equal(f.airAttacks,4);assert.equal(f.action,null);assert.equal(f.stamina,100);advance(s,100);assert.equal(f.airAttacks,0);stepMatch(s,[{jump:true,attack:true},{}]);assert.equal(f.action.move,'airAttack1');assert.equal(f.airAttacks,1);
});
test('four-hit juggle recovery rejects further air hits and clears on landing',()=>{
 const s=duel(),target=s.fighters[1];target.y=350;target.juggleHits=3;s.projectiles.push({owner:0,x:target.x-10,y:target.y+65,direction:1,life:5,move:'aerialSenbon',pierce:0});stepMatch(s);assert.equal(target.airTech,true);const hp=target.hp;
 s.projectiles.push({owner:0,x:target.x-10,y:target.y+65,direction:1,life:5,move:'aerialSenbon',pierce:0});stepMatch(s);assert.equal(target.hp,hp);stepMatch(s,[{},{replacement:true}]);assert.equal(target.stun,0);advance(s,80);assert.equal(target.airTech,false);assert.equal(target.juggleHits,0);
});
test('landing interrupts aerial startup and enforces recovery without a ground hit',()=>{
 const s=duel(),f=s.fighters[0];f.y=2;f.vy=-8;stepMatch(s,[{special2:true},{}]);assert.equal(f.y,0);assert.equal(f.action,null);assert.equal(f.landingRecovery,6);assert.equal(s.fighters[1].hp,1000);stepMatch(s,[{attack:true},{}]);assert.equal(f.action,null);advance(s,6);stepMatch(s,[{},{}]);stepMatch(s,[{attack:true},{}]);assert.ok(f.action);
});
test('aerial routes and air steering remain deterministic and do not reset air dash allowance',()=>{
 const a=duel(),b=duel();for(let t=0;t<240;t++){route(a,t);route(b,t);}assert.deepEqual(a,b);
 const s=duel(),f=s.fighters[0];f.y=100;f.airDashUsed=true;stepMatch(s,[{right:true},{}]);const first=f.vx;stepMatch(s,[{right:true},{}]);assert.ok(f.vx>first&&f.vx<4.5);stepMatch(s,[{jump:true},{}]);assert.equal(f.airDashUsed,true);
});
test('cosmetic poses blend anticipation and recovery; interpolation never mutates fighters or smears teleports',()=>{
 const s=duel(),f=s.fighters[0];f.action={move:'skyCleave',age:3};const before=structuredClone(f),windup=fighterPose(f,10,MOVES.skyCleave);f.action.age=9;const active=fighterPose(f,11,MOVES.skyCleave);assert.ok(active.armX>windup.armX);const quiet=fighterPose({...f,action:null},11,null,true);assert.equal(quiet.bob,0);
 const mid=interpolateFighter({...before,x:100,y:0},{...before,x:200,y:100},.5);assert.equal(mid.x,150);assert.equal(mid.y,50);assert.equal(interpolateFighter({...before,x:100},{...before,x:800},.5).x,800);assert.equal(before.action.age,3);
});

test('simultaneous projectiles cannot bypass the four-hit juggle limit',()=>{
 const s=duel(),target=s.fighters[1];target.y=300;target.juggleHits=3;
 for(let i=0;i<3;i++)s.projectiles.push({owner:0,id:i,x:target.x-10,y:target.y+65,direction:1,life:5,move:'aerialSenbon',pierce:0});
 stepMatch(s);assert.equal(target.hp,972);assert.equal(target.juggleHits,4);assert.equal(target.airTech,true);
});
