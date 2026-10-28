import test from 'node:test';
import assert from 'node:assert/strict';
import {createMatch,stepMatch,activeAwakening} from '../packages/engine/index.js';
import {createTraining,stepTraining,resetTraining,chargeTrainingAwakening,dummyInput,DRILLS,actionPhase,trainingReadout} from '../packages/engine/training.js';
const advance=(s,n,input={})=>{for(let t=0;t<n;t++)stepTraining(s,input);};
test('free practice validates options and keeps selected characters/weapons',()=>{
 const s=createTraining([{character:'silent',weapon:'tachi'},{character:'winta',weapon:'kaiken'}],{dummy:'bad',drill:'__proto__',unlimitedResources:false,refillHealth:false});assert.equal(s.training.drill,'free');assert.equal(s.training.dummy,'idle');assert.equal(s.training.unlimitedResources,false);assert.equal(s.fighters[0].character,'silent');assert.equal(s.fighters[1].weapon,'kaiken');assert.throws(()=>createTraining([{character:'bad',weapon:'kunai'},{}]));
});
test('training has no time expiry, knockouts or wins even without health refill',()=>{
 const s=createTraining(undefined,{dummy:'attack',refillHealth:false});advance(s,6500);assert.equal(s.tick,6500);assert.equal(s.remainingTicks,5400);assert.equal(s.status,'playing');assert.equal(s.fighters[0].hp,1);assert.deepEqual(s.wins,[0,0]);
 const regular=createMatch();regular.fighters[0].hp=0;stepMatch(regular);assert.equal(regular.status,'roundOver');
});
test('infinite resource and health toggles are independent of ordinary costs',()=>{
 const infinite=createTraining();advance(infinite,6,{attack:true});assert.equal(infinite.fighters[0].stamina,100);assert.equal(infinite.fighters[1].hp,1000);assert.equal(infinite.training.stats.damage,65);
 const finite=createTraining(undefined,{unlimitedResources:false,refillHealth:false});advance(finite,6,{attack:true});assert.equal(finite.fighters[0].stamina,88);assert.equal(finite.fighters[1].hp,935);
});
test('instant cooldowns are optional and do not bypass the one-air-dash rule',()=>{
 const a=createTraining(undefined,{instantCooldowns:true});stepTraining(a,{weapon:true});assert.deepEqual(a.fighters[0].cooldowns,{});
 const b=createTraining(undefined,{instantCooldowns:false});stepTraining(b,{weapon:true});assert.ok(b.fighters[0].cooldowns.weapon>0);
 const c=createTraining(undefined,{instantCooldowns:true});stepTraining(c,{jump:true,dashForward:true});advance(c,9);stepTraining(c,{dashForward:true});assert.equal(c.fighters[0].dash,null);
});
test('reset clears positions, effects, projectiles and progress while preserving configuration',()=>{
 const s=createTraining([{character:'silent',weapon:'tachi'},{character:'winta',weapon:'kaiken'}],{drill:'movement',unlimitedResources:false,instantCooldowns:true,showRanges:false});stepTraining(s,{jump:true});s.fighters[0].effects.push({type:'poison',remaining:120,potency:9,nextTick:60});s.projectiles.push({});const reset=resetTraining(s);assert.equal(reset.training.step,0);assert.equal(reset.fighters[0].y,0);assert.equal(reset.fighters[0].x,600);assert.equal(reset.fighters[1].x,670);assert.equal(reset.training.showRanges,false);assert.equal(reset.training.unlimitedResources,false);assert.equal(reset.fighters[0].weapon,'tachi');assert.deepEqual(reset.projectiles,[]);assert.deepEqual(reset.fighters[0].effects,[]);
});
test('dummy idle, guarding and attacking use legal predictable inputs',()=>{
 assert.deepEqual(dummyInput(createTraining()),{});assert.deepEqual(dummyInput(createTraining(undefined,{dummy:'guard'})),{block:true});
 const s=createTraining(undefined,{dummy:'attack'});advance(s,60);assert.deepEqual(dummyInput(s),{attack:true});advance(s,7);assert.ok(s.fighters[0].damageTaken>0);assert.equal(s.fighters[0].hp,1000);
});
test('movement drill requires double jump and dash in the same airborne sequence',()=>{
 const s=createTraining(undefined,{drill:'movement'});stepTraining(s,{jump:true});advance(s,7);stepTraining(s,{jump:true});stepTraining(s,{dashForward:true});assert.equal(s.training.completed,true);assert.equal(s.training.step,3);
 const failed=createTraining(undefined,{drill:'movement'});stepTraining(failed,{jump:true});advance(failed,100);assert.equal(failed.training.step,0);assert.equal(failed.training.completed,false);
 const wrongOrder=createTraining(undefined,{drill:'movement'});stepTraining(wrongOrder,{jump:true,dashForward:true});advance(wrongOrder,5);stepTraining(wrongOrder,{jump:true});advance(wrongOrder,1);assert.equal(wrongOrder.training.completed,false);
});
test('combo drill recognizes actual three-stage confirms, not held basic or a weapon follow-up',()=>{
 const s=createTraining(undefined,{drill:'combo'});for(let t=0;t<28;t++)stepTraining(s,{attack:[0,7,17].includes(t)});assert.equal(s.training.completed,true);assert.equal(s.training.stats.bestCombo,3);assert.equal(s.training.stats.damage,182);
 const hold=createTraining(undefined,{drill:'combo'});advance(hold,80,{attack:true});assert.equal(hold.training.completed,false);assert.equal(hold.training.step,0);
 const weapon=createTraining(undefined,{drill:'combo'});for(let t=0;t<30;t++)stepTraining(weapon,{attack:t===0,weapon:t===7});assert.equal(weapon.training.completed,false);
});
test('counter drill needs a real guard/parry followed by a timely equipped hit',()=>{
 const s=createTraining(undefined,{drill:'counter'});assert.equal(s.fighters[1].weapon,'katana');for(let t=0;t<100&&!s.training.completed;t++)stepTraining(s,{block:t<75,weapon:t===75});assert.equal(s.training.completed,true);
 const skipped=createTraining(undefined,{drill:'counter'});advance(skipped,7,{weapon:true});assert.equal(skipped.training.step,0);assert.equal(skipped.training.completed,false);
 const late=createTraining(undefined,{drill:'counter'});advance(late,75,{block:true});assert.equal(late.training.step,1);advance(late,70);assert.equal(late.training.step,0);
});
test('awakening drill fills from damage and only completes on legal activation',()=>{
 const s=createTraining(undefined,{drill:'awakening'});stepTraining(s,{awakening:true});assert.equal(s.training.completed,false);assert.equal(chargeTrainingAwakening(s),false);
 for(let t=0;t<700&&!s.training.completed;t++)stepTraining(s,{awakening:s.training.step===1&&s.fighters[0].stun===0});assert.equal(s.training.completed,true);assert.ok(s.fighters[0].damageTaken>=400);assert.equal(activeAwakening(s.fighters[0]).name,'Kurama Chakra Mode');assert.equal(s.fighters[0].hp,1000);
});
test('awakening drill falls back to Naruto only when the chosen fighter has no form',()=>{
 const original=[{character:'hinata',weapon:'katana'},{character:'winta',weapon:'kaiken'}],s=createTraining(original,{drill:'awakening'});assert.equal(s.fighters[0].character,'naruto');assert.equal(s.fighters[0].weapon,'katana');assert.match(s.training.note,/Naruto/);assert.equal(original[0].character,'hinata');
 const silent=createTraining([{character:'silent',weapon:'tachi'},{character:'winta',weapon:'katana'}],{drill:'awakening'});assert.equal(silent.fighters[0].character,'silent');
});
test('free-practice form charging cannot complete a guided challenge',()=>{
 const free=createTraining();assert.equal(chargeTrainingAwakening(free),true);stepTraining(free,{awakening:true});assert.equal(activeAwakening(free.fighters[0]).name,'Kurama Chakra Mode');assert.equal(free.training.completed,false);
 const noForm=createTraining([{character:'hinata',weapon:'kunai'},{character:'sasuke',weapon:'kunai'}]);assert.equal(chargeTrainingAwakening(noForm),false);
});
test('coach explains misses, unavailable techniques, resources and motion limits',()=>{
 const miss=createTraining();miss.fighters[1].x=1000;advance(miss,10,{attack:true});assert.match(miss.training.feedback,/Missed.*reach/);
 const absent=createTraining();stepTraining(absent,{bloodline:true});assert.match(absent.training.feedback,/no technique/);
 const empty=createTraining(undefined,{unlimitedResources:false});empty.fighters[0].chakra=0;stepTraining(empty,{special1:true});assert.match(empty.training.feedback,/Not enough chakra/);
 const air=createTraining();stepTraining(air,{jump:true});stepTraining(air,{});stepTraining(air,{block:true});assert.match(air.training.feedback,/Guard works on the ground/);
});
test('phase readout shows real ranges, costs and recovery ticks',()=>{
 const s=createTraining();assert.equal(trainingReadout(s).distance,70);assert.equal(trainingReadout(s).range,90);assert.equal(trainingReadout(s).stamina,12);
 stepTraining(s,{weapon:true});assert.equal(trainingReadout(s).stamina,16);assert.equal(actionPhase(s.fighters[0]).name,'Startup');advance(s,11);assert.equal(actionPhase(s.fighters[0]).name,'Recovery');assert.ok(actionPhase(s.fighters[0]).remaining>0);
});
test('training replays deterministically and completed drills stay complete until retry',()=>{
 for(const drill of Object.keys(DRILLS)){const a=createTraining(undefined,{drill}),b=createTraining(undefined,{drill});for(let t=0;t<800;t++){const input={jump:t===0||t===8,dashForward:t===10,attack:t%60===0,block:t%150<75,weapon:t%150===75,awakening:t%80===0};stepTraining(a,input);stepTraining(b,input);}assert.deepEqual(a,b);}
 const s=createTraining(undefined,{drill:'movement'});for(let t=0;t<12;t++)stepTraining(s,{jump:t===0||t===8,dashForward:t===10});advance(s,120);assert.equal(s.training.completed,true);assert.equal(resetTraining(s).training.completed,false);
});
