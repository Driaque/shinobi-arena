import test from 'node:test';
import assert from 'node:assert/strict';
import {createMatch,stepMatch,nextRound,computerInput,DIFFICULTIES,difficultyFor,CHARACTERS} from '../packages/engine/index.js';
function run(difficulty,ticks=900){const s=createMatch(undefined,{difficulty});let maxCombo=0;const errors=[];for(let t=0;t<ticks&&s.status==='playing';t++){stepMatch(s,[{},computerInput(s)]);maxCombo=Math.max(maxCombo,s.fighters[1].combo.hits);errors.push(...s.events.filter(e=>['empty','cooldown','exhausted'].includes(e.type)));}return {s,maxCombo,errors};}
test('four named difficulty policies default safely to Easy',()=>{
 assert.deepEqual(Object.keys(DIFFICULTIES),['easy','medium','difficult','xtreme']);assert.equal(createMatch().difficulty,'easy');
 for(const invalid of ['bad','constructor','__proto__',null,undefined])assert.equal(difficultyFor(invalid).id,'easy');
 assert.equal(createMatch(undefined,{difficulty:'bad'}).difficulty,'easy');
});
test('difficulty never changes fighter HP, damage, stamina, chakra or cooldown rules',()=>{
 const fighters=createMatch().fighters;for(const difficulty of Object.keys(DIFFICULTIES))assert.deepEqual(createMatch(undefined,{difficulty}).fighters,fighters);
});
test('Easy leaves the opening three seconds clear, then begins playing',()=>{
 const s=createMatch();for(let t=0;t<180;t++){assert.deepEqual(computerInput(s),{});stepMatch(s,[{},computerInput(s)]);assert.equal(s.fighters[0].hp,1000);}
 let moved=false;for(let t=0;t<240;t++){const x=s.fighters[1].x;stepMatch(s,[{},computerInput(s)]);moved ||=s.fighters[1].x!==x;}assert.ok(moved);
});
test('Easy leaves at least 90 ticks after completed attacks before attacking again',()=>{
 const s=createMatch();let checked=0;for(let t=0;t<1800&&s.status==='playing';t++){const ended=s.fighters[1].lastActionEnd,started=s.fighters[1].actionsStarted;stepMatch(s,[{},computerInput(s)]);if(ended>=0&&s.fighters[1].actionsStarted>started){assert.ok(s.tick-ended>=90);checked++;}}assert.ok(checked>=3);
});
test('Easy uses single hits, Medium limits combos to two and harder modes use full chains',()=>{
 const a=run('easy'),b=run('medium'),c=run('difficult'),d=run('xtreme');assert.equal(a.maxCombo,1);assert.equal(b.maxCombo,2);assert.equal(c.maxCombo,3);assert.equal(d.maxCombo,3);
 assert.ok(a.s.fighters[0].hp>b.s.fighters[0].hp);assert.ok(b.s.fighters[0].hp>c.s.fighters[0].hp);
});
test('reaction thresholds distinguish Xtreme reads from Easy learning gaps',()=>{
 const s=createMatch();s.tick=360;s.fighters[0].x=600;s.fighters[1].x=670;s.fighters[0].action={move:'attack',age:4};
 assert.equal(computerInput(s,1,'xtreme').block,true);assert.notEqual(computerInput(s,1,'easy').block,true);
 s.fighters[0].action={move:'special1',age:16};assert.equal(computerInput(s,1,'medium').block,true);assert.notEqual(computerInput(s,1,'easy').block,true);
});
test('a learner using spaced basics can win on Easy',()=>{
 const s=createMatch();for(let t=0;t<5401&&s.status==='playing';t++)stepMatch(s,[{right:true,attack:t%60===0},computerInput(s)]);assert.equal(s.result,'player1');
});
test('all difficulty/character combinations respect attack budgets',()=>{
 for(const difficulty of Object.keys(DIFFICULTIES))for(const character of Object.keys(CHARACTERS)){
  const s=createMatch([{character:'naruto',weapon:'kunai'},{character,weapon:'katana'}],{difficulty});
  for(let t=0;t<900&&s.status==='playing';t++){stepMatch(s,[{},computerInput(s)]);assert.ok(!s.events.some(e=>['empty','cooldown','exhausted'].includes(e.type)),`${difficulty}/${character} overspent`);for(const f of s.fighters){assert.ok(f.stamina>=0&&f.stamina<=100);assert.ok(f.chakra>=0&&f.chakra<=100);}}
 }
});
test('difficulty and paced AI replay deterministically without mutating state during decisions',()=>{
 for(const difficulty of Object.keys(DIFFICULTIES)){const a=createMatch(undefined,{difficulty}),b=createMatch(undefined,{difficulty});for(let t=0;t<1200&&a.status==='playing';t++){const snapshot=JSON.stringify(a),cpu=computerInput(a);assert.equal(JSON.stringify(a),snapshot);const input=[{right:t%200<60,attack:t%90===0},cpu];stepMatch(a,input);stepMatch(b,input);}assert.deepEqual(a,b);}
});
test('difficulty survives new rounds and can be changed without resetting fighters',()=>{
 const s=createMatch(undefined,{difficulty:'medium'});s.fighters[0].hp=750;s.difficulty='easy';assert.equal(s.fighters[0].hp,750);s.fighters[1].hp=0;stepMatch(s);nextRound(s);assert.equal(s.difficulty,'easy');
});
