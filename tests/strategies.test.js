import test from 'node:test';import assert from 'node:assert/strict';
import {createMatch,stepMatch,nextRound,MOVES,JUTSUS,moveFor,validateLoadout,defaultJutsus} from '../packages/engine/index.js';
import {cleanInput} from '../packages/network/protocol.js';
const advance=(s,n,inputs=[{},{}])=>{for(let i=0;i<n;i++)stepMatch(s,inputs);};
const duel=(jutsus=[],distance=180)=>{const s=createMatch([{character:'naruto',weapon:'kunai',jutsus},{character:'sasuke',weapon:'kunai'}]);s.fighters[0].x=600;s.fighters[1].x=600+distance;return s;};
test('64 real techniques, seven unique slots, two weapons and four items are server validated',()=>{
 assert.equal(Object.keys(JUTSUS).length,64);for(const [id,j]of Object.entries(JUTSUS))assert.ok(MOVES[id]&&j.description);
 const l=validateLoadout({character:'naruto',weapons:['kunai'],items:['paperBomb'],jutsus:['emberField']});assert.equal(l.jutsus.length,7);assert.equal(l.items.length,4);assert.deepEqual(l.weapons,['kunai',null]);
 for(const bad of [{jutsus:Array(8).fill('emberField')},{jutsus:['emberField','emberField']},{jutsus:['tetsugan']},{jutsus:['constructor']},{weapons:['kunai','katana','tachi']},{items:Array(5).fill('paperBomb')}])assert.throws(()=>validateLoadout({character:'naruto',weapon:'kunai',...bad}));
 const s=duel(['fireball','chakraSiphon','stoneWard','emberField','bindingThreads','innerPeace','purifyingCurrent']);for(const [key,id]of Object.entries({special1:'fireball',special2:'chakraSiphon',bloodline:'stoneWard',jutsu4:'emberField',jutsu5:'bindingThreads',jutsu6:'innerPeace',jutsu7:'purifyingCurrent'}))assert.equal(moveFor(s.fighters[0],key),id);
 const input=cleanInput({jutsu7:true,charge:true,jutsus:['tetsugan'],hp:999});assert.equal(input.jutsu7,true);assert.equal(input.charge,true);assert.equal(input.jutsus,undefined);
});
test('awakening only upgrades a native technique actually equipped, including a later slot',()=>{
 const s=duel(['emberField','fireball',null,'special1']);s.fighters[0].damageTaken=400;stepMatch(s,[{awakening:true},{}]);assert.equal(moveFor(s.fighters[0],'special1'),'emberField');assert.equal(moveFor(s.fighters[0],'jutsu4'),'kuramaRasengan');nextRound(s);assert.ok(defaultJutsus('naruto').includes('special1'));
});
test('ground fields apply themed effects only in radius and near the floor; friendly fighter is safe',()=>{
 for(const [id,effect]of [['emberField','burn'],['floodField','slow'],['stoneSnare','bind'],['venomMist','poisonslow']]){const s=duel([id]);advance(s,27,[{special1:true},{}]);assert.equal(s.zones[0].kind,'elemental');assert.ok(s.fighters[1].effects.some(e=>e.type===effect));assert.equal(s.fighters[0].hp,1000);assert.equal(s.fighters[1].stun,0);}
 const air=duel(['emberField']);air.fighters[1].y=220;air.fighters[1].vy=10;advance(air,27,[{special1:true},{}]);assert.equal(air.fighters[1].hp,1000);
 const far=duel(['emberField'],500);advance(far,27,[{special1:true},{}]);assert.equal(far.fighters[1].effects.length,0);advance(far,260);assert.equal(far.zones.length,0);
});
test('poison-slow does periodic damage and reduces movement; bind stops movement, jumps and dash but allows guard',()=>{
 const s=duel();s.fighters[0].effects=[{type:'poisonslow',remaining:120,potency:6,nextTick:60}];const x=s.fighters[0].x;stepMatch(s,[{right:true},{}]);assert.equal(s.fighters[0].x-x,3);advance(s,60);assert.equal(s.fighters[0].hp,994);
 const bind=duel();bind.fighters[0].effects=[{type:'bind',remaining:45,potency:1,nextTick:60}];const bx=bind.fighters[0].x;advance(bind,10,[{right:true,jump:true,dashForward:true,block:true},{}]);assert.equal(bind.fighters[0].x,bx);assert.equal(bind.fighters[0].y,0);assert.equal(bind.fighters[0].dash,null);assert.equal(bind.fighters[0].blocking,true);advance(bind,50);stepMatch(bind,[{right:true},{}]);assert.ok(bind.fighters[0].x>bx);
});
test('active chakra charging costs stamina, is stationary, cannot work while stunned and leaves a punish opening',()=>{
 const s=duel([],70),f=s.fighters[0];f.chakra=20;advance(s,60,[{charge:true},{}]);assert.ok(f.chakra>39&&f.chakra<41);assert.ok(f.stamina<89);assert.equal(f.x,600);assert.equal(f.charging,true);
 stepMatch(s,[{charge:true,right:true},{}]);assert.equal(f.charging,false);f.stun=20;const chakra=f.chakra;advance(s,5,[{charge:true},{}]);assert.ok(f.chakra-chakra<1);
 const hit=duel([],70);hit.fighters[0].chakra=20;advance(hit,6,[{charge:true},{attack:true}]);assert.equal(hit.fighters[0].hp,922);assert.equal(hit.fighters[0].charging,false);
});
test('chakra drain requires a clean hit and transfers only available chakra without exceeding cap',()=>{
 const s=duel(['chakraSiphon']);s.fighters[0].chakra=50;s.fighters[1].chakra=5;advance(s,40,[{special1:true},{}]);assert.ok(s.fighters[1].chakra<2);assert.ok(s.fighters[0].chakra<40&&s.fighters[0].chakra>35);
 const guard=duel(['chakraSiphon']);advance(guard,40,[{special1:true},{block:true}]);assert.equal(guard.fighters[1].chakra,100);
});
test('projectile absorption needs front guard and excludes bombs, full pierce and melee',()=>{
 const s=duel(['waterAbsorption'],250),f=s.fighters[0];f.chakra=50;advance(s,35,[{special1:true},{}]);const energy=f.chakra;s.projectiles.push({owner:1,x:655,y:65,direction:-1,life:30,move:'itemKunai',pierce:0});advance(s,3,[{block:true},{}]);assert.equal(f.hp,1000);assert.ok(f.chakra>energy+11);assert.equal(s.projectiles.length,0);
 const q=duel(['waterAbsorption'],70);advance(q,35,[{special1:true},{}]);advance(q,6,[{block:true},{attack:true}]);assert.ok(q.fighters[0].hp<1000);
});
test('healing and cleanse commit to startup; ward and haste are timed, non-stacking buffs',()=>{
 const heal=duel(['innerPeace']);heal.fighters[0].hp=500;advance(heal,35,[{special1:true},{}]);assert.equal(heal.fighters[0].hp,500);advance(heal,2);assert.equal(heal.fighters[0].hp,620);
 const interrupted=duel(['innerPeace'],70);interrupted.fighters[0].hp=500;advance(interrupted,40,[{special1:true},{attack:true}]);assert.ok(interrupted.fighters[0].hp<500);
 const cleanse=duel(['purifyingCurrent']);cleanse.fighters[0].effects=[{type:'burn',remaining:200,potency:10,nextTick:60}];advance(cleanse,14,[{special1:true},{}]);assert.equal(cleanse.fighters[0].effects.length,0);
 const ward=duel(['stoneWard'],70);advance(ward,45,[{special1:true},{}]);advance(ward,6,[{},{attack:true}]);assert.equal(ward.fighters[0].hp,951);advance(ward,250);assert.equal(ward.fighters[0].buffs.length,0);
});
test('knockback and bleed have distinct counterplay; strategy loadouts simulate deterministically',()=>{
 const push=duel(['galePush']);advance(push,40,[{special1:true},{}]);assert.ok(push.fighters[1].x>=920);
 const a=duel(['emberField','venomDart','stoneWard','bindingThreads','chakraSiphon','innerPeace','razorTorrent']),b=duel(['emberField','venomDart','stoneWard','bindingThreads','chakraSiphon','innerPeace','razorTorrent']);for(let t=0;t<1800;t++){const input=[{special1:t%450===0,special2:t%330===0,bloodline:t%650===0,jutsu4:t%380===0,jutsu5:t%350===0,jutsu6:t%700===0,jutsu7:t%340===0,charge:t%200<70},{block:t%180<40,left:t%300<20}];stepMatch(a,input);stepMatch(b,input);}assert.deepEqual(a,b);
});

test('Winta Mizukumi dashes into range and both named signatures transfer chakra on clean hits',()=>{
 for(const [key,distance]of [['special1',220],['special2',70]]){const s=createMatch([{character:'winta',weapon:'katana'},{character:'sasuke',weapon:'kunai'}]);s.fighters[0].x=600;s.fighters[1].x=600+distance;s.fighters[0].chakra=50;s.fighters[0].hp=500;s.fighters[1].chakra=50;advance(s,20,[{[key]:true},{}]);assert.ok(s.fighters[1].hp<1000);assert.ok(s.fighters[1].chakra<45);assert.ok(s.fighters[0].chakra>30);if(key==='special1')assert.ok(s.fighters[0].x>600);else assert.equal(s.fighters[0].hp,535);}
});
