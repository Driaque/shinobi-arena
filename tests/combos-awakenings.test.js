import test from 'node:test';
import assert from 'node:assert/strict';
import {createMatch,stepMatch,nextRound,moveFor,CHARACTERS,MOVES,AWAKENINGS,awakeningFor,awakeningReady,activeAwakening} from '../packages/engine/index.js';
import {freshSettings,readSettings,defaultLayout,layoutOverlaps} from '../packages/input/preferences.js';
const load=character=>({character,weapon:'kunai'});
const advance=(s,n,inputs=[{},{}])=>{for(let i=0;i<n;i++)stepMatch(s,inputs);return s;};
function close(){const s=createMatch();s.fighters[0].x=600;s.fighters[1].x=670;return s;}
function ready(character='naruto'){
 const s=createMatch([load(character),load('sasuke')]);s.fighters[0].hp=500;s.fighters[0].damageTaken=500;return s;
}
test('eighteen roster entries have valid unique identities, move slots and awakening definitions',()=>{
 assert.equal(Object.keys(CHARACTERS).length,18);
 assert.equal(Object.values(CHARACTERS).filter(c=>c.era==='Boruto').length,4);
 for(const [id,c]of Object.entries(CHARACTERS)){
  assert.equal(c.id,id);assert.equal(moveFor({character:id,weapon:'kunai',awakeningTicks:0},'awakening'),null);assert.ok(MOVES[c.special1]&&MOVES[c.special2]);if(c.bloodline)assert.ok(MOVES[c.bloodline]);
  if(c.awakening){const form=AWAKENINGS[c.awakening];assert.ok(form.threshold>0&&form.duration>0);for(const move of Object.values(form.overrides))assert.ok(MOVES[move]);}
 }
});
test('buffered basic taps link three hits, apply scaling and launch the finisher',()=>{
 const s=close();for(let t=0;t<28;t++)stepMatch(s,[{attack:[0,7,17].includes(t)},{}]);
 assert.equal(s.fighters[0].combo.hits,3);assert.equal(s.fighters[0].combo.damage,182);
 assert.equal(s.fighters[1].hp,818);assert.ok(s.fighters[1].y>0||s.fighters[1].vy>0);
});
test('holding basic does not auto-combo and a whiff cannot cancel into another stage',()=>{
 const s=close();advance(s,60,[{attack:true},{}]);assert.equal(s.fighters[1].hp,935);assert.equal(s.fighters[0].combo.hits,1);
 const whiff=createMatch();for(let t=0;t<20;t++)stepMatch(whiff,[{attack:t===0||t===7},{}]);assert.notEqual(whiff.fighters[0].action?.move,'attack2');assert.equal(whiff.fighters[0].combo.hits,0);
});
test('guarded basics do not qualify for hit-confirm chains',()=>{
 const s=close();for(let t=0;t<20;t++)stepMatch(s,[{attack:t===0||t===7},{block:true}]);
 assert.equal(s.fighters[0].combo.hits,0);assert.notEqual(s.fighters[0].action?.move,'attack2');
});
test('a confirmed basic can cancel into a weapon action',()=>{
 const s=close();for(let t=0;t<20;t++)stepMatch(s,[{attack:t===0,weapon:t===7},{}]);
 assert.equal(s.fighters[0].combo.hits,2);assert.equal(s.fighters[0].combo.damage,133);
});
test('recovered opponents start a new combo; Replacement breaks an existing combo',()=>{
 const s=close();advance(s,6,[{attack:true},{}]);advance(s,30);s.fighters[1].x=670;advance(s,6,[{attack:true},{}]);
 assert.equal(s.fighters[0].combo.hits,1);
 stepMatch(s,[{}, {replacement:true}]);assert.equal(s.fighters[0].combo.hits,0);
});
test('actual HP lost fills damage charge, excluding overkill',()=>{
 const s=close();s.fighters[0].hp=20;advance(s,6,[{}, {attack:true}]);assert.equal(s.fighters[0].damageTaken,20);assert.equal(s.fighters[0].hp,0);
 const guarded=close();advance(guarded,6,[{block:true},{attack:true}]);assert.equal(guarded.fighters[0].damageTaken,6);
});
test('Naruto unlocks Kurama from damage and activation does not heal or grant immunity',()=>{
 const s=close(),f=s.fighters[0];
 f.effects=[{type:'poison',remaining:300,potency:100,nextTick:1}];advance(s,181);
 assert.equal(f.hp,600);assert.equal(f.damageTaken,400);assert.ok(awakeningReady(f));f.effects=[];
 stepMatch(s,[{awakening:true},{}]);assert.equal(activeAwakening(f).name,'Kurama Chakra Mode');assert.equal(f.hp,600);assert.equal(f.invulnerable,0);
 assert.equal(f.awakeningUsed,true);assert.equal(moveFor(f,'special1'),'kuramaRasengan');assert.equal(moveFor(f,'special2'),'chakraClaw');
});
test('unready, in-hitstun and unsupported awakenings cannot activate',()=>{
 const normal=createMatch();stepMatch(normal,[{awakening:true},{}]);assert.equal(normal.fighters[0].awakeningTicks,0);
 const stunned=ready();stunned.fighters[0].stun=10;stepMatch(stunned,[{awakening:true},{}]);assert.equal(stunned.fighters[0].awakeningTicks,0);
 const unsupported=ready('hinata');stepMatch(unsupported,[{awakening:true},{}]);assert.equal(awakeningFor(unsupported.fighters[0]),null);assert.equal(unsupported.fighters[0].awakeningTicks,0);
});
test('forms expire, revert signature overrides and cannot be reused until next round',()=>{
 const s=ready();stepMatch(s,[{awakening:true},{}]);const f=s.fighters[0];advance(s,600);
 assert.equal(activeAwakening(f),null);assert.equal(moveFor(f,'special1'),'special1');assert.equal(awakeningReady(f),false);
 stepMatch(s,[{awakening:true},{}]);assert.equal(f.awakeningTicks,0);
 s.fighters[1].hp=0;stepMatch(s);nextRound(s);assert.equal(s.fighters[0].awakeningUsed,false);assert.equal(s.fighters[0].damageTaken,0);
});
test('awakening movement, damage and defence modifiers change gameplay',()=>{
 const s=ready();stepMatch(s,[{awakening:true},{}]);const f=s.fighters[0],x=f.x;stepMatch(s,[{right:true},{}]);assert.ok(Math.abs(f.x-x-5.6)<.001);
 f.x=600;s.fighters[1].x=670;advance(s,6,[{attack:true},{}]);assert.equal(s.fighters[1].hp,922);
 const defence=ready('sasuke');defence.fighters[0].x=600;defence.fighters[1].x=670;stepMatch(defence,[{awakening:true},{}]);
 advance(defence,6,[{}, {attack:true}]);assert.equal(defence.fighters[0].hp,451);
});
test('a combo with transformations and effects replays deterministically',()=>{
 const a=ready('boruto'),b=ready('boruto');
 for(let t=0;t<900;t++){const input=[{awakening:t===0,right:t%90<30,attack:t%40===0,special1:t%160===0,jump:t%100===0},{left:t%90<20,special2:t%200===0}];stepMatch(a,input);stepMatch(b,input);}
 assert.deepEqual(a,b);
});
test('version-one control settings retain custom layouts and keybindings when adding Awaken',()=>{
 const legacy=freshSettings();legacy.version=1;legacy.layouts.medium=defaultLayout(804,302);legacy.layouts.medium.attack.size=70;
 delete legacy.layouts.medium.awakening;delete legacy.keys[0].KeyT;delete legacy.keys[1].KeyY;
 legacy.keys[0].Space='jump';delete legacy.keys[0].KeyW;
 const upgraded=readSettings(JSON.stringify(legacy));assert.equal(upgraded.version,5);assert.equal(upgraded.keys[0].Space,'jump');assert.equal(upgraded.keys[0].KeyT,'awakening');assert.equal(upgraded.layouts.medium.attack.size,70);assert.ok(upgraded.layouts.medium.awakening);
 legacy.keys[0].KeyT='jump';delete legacy.keys[0].Space;const preserved=readSettings(JSON.stringify(legacy));assert.equal(preserved.keys[0].KeyT,'jump');assert.ok(!Object.values(preserved.keys[0]).includes('awakening'));
});

test('migration finds room for Awaken without moving a customized existing control',()=>{
 const legacy=freshSettings();legacy.version=1;legacy.layouts.medium=defaultLayout(804,302);
 legacy.layouts.medium.attack={...legacy.layouts.medium.awakening,size:64};delete legacy.layouts.medium.awakening;
 delete legacy.keys[0].KeyT;delete legacy.keys[1].KeyY;
 const result=readSettings(JSON.stringify(legacy));assert.deepEqual(result.layouts.medium.attack,legacy.layouts.medium.attack);
 assert.deepEqual(layoutOverlaps(result.layouts.medium,804,302),[]);
});

