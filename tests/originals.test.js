import test from 'node:test';
import assert from 'node:assert/strict';
import {createMatch,stepMatch,nextRound,MOVES,moveFor,activeAwakening} from '../packages/engine/index.js';
const advance=(s,n,inputs=[{},{}])=>{for(let i=0;i<n;i++)stepMatch(s,inputs);};
function duel(a='silent',b='winta'){const s=createMatch([{character:a,weapon:'tachi'},{character:b,weapon:'kaiken'}]);s.fighters[0].x=600;s.fighters[1].x=670;return s;}
function stance(s){advance(s,25,[{bloodline:true},{}]);}
test('each original has a sword chain with three connected, scaled hits',()=>{
 for(const name of ['silent','winta']){const s=duel(name);for(let t=0;t<28;t++)stepMatch(s,[{attack:[0,7,17].includes(t)},{}]);assert.equal(s.fighters[0].combo.hits,3);assert.equal(s.fighters[0].combo.damage,182);assert.ok(MOVES[moveFor(s.fighters[0],'attack')].sword);}
});
test('Tetsugan absorbs guarded chip, reflects without recursion and readies a counter',()=>{
 const s=duel();stance(s);advance(s,6,[{block:true},{attack:true}]);
 assert.equal(s.fighters[0].hp,995);assert.equal(s.fighters[1].hp,980);assert.ok(s.fighters[0].buffs.some(b=>b.type==='counter'));
 assert.ok(s.events.some(e=>e.type==='reflect'));
 // Recover, close the knockback gap, then consume one counter on a clean sword hit.
 advance(s,30);s.fighters[0].x=600;s.fighters[1].x=670;advance(s,6,[{attack:true},{}]);
 assert.equal(s.fighters[1].hp,892);assert.ok(!s.fighters[0].buffs.some(b=>b.type==='counter'));
});
test('Tetsugan does not reflect unguarded or fully piercing attacks',()=>{
 const unguarded=duel();stance(unguarded);advance(unguarded,6,[{}, {attack:true}]);assert.equal(unguarded.fighters[1].hp,1000);
 const pierced=duel('silent','sasuke');stance(pierced);advance(pierced,13,[{block:true},{special1:true}]);assert.equal(pierced.fighters[1].hp,1000);assert.equal(pierced.fighters[0].hp,850);assert.ok(!pierced.fighters[0].buffs.some(b=>b.type==='counter'));
});
test('counter expires and cannot empower another hit after its window',()=>{
 const s=duel();stance(s);advance(s,6,[{block:true},{attack:true}]);advance(s,91);assert.ok(!s.fighters[0].buffs.some(b=>b.type==='counter'));
});
test('Echoing Rift pulls, exposes only metal damage, and never ticks as damage over time',()=>{
 const s=duel();s.fighters[1].x=850;advance(s,17,[{special2:true},{}]);assert.equal(s.fighters[1].x,760);assert.equal(s.fighters[1].hp,930);assert.ok(s.fighters[1].effects.some(e=>e.type==='metalVulnerable'));
 advance(s,40);s.fighters[1].x=670;advance(s,6,[{attack:true},{}]);assert.equal(s.fighters[1].hp,852,'metal hit gains 20%');
 const hp=s.fighters[1].hp;advance(s,180);assert.equal(s.fighters[1].hp,hp);assert.equal(s.fighters[1].effects.length,0);
 const nonmetal=duel('winta','silent');nonmetal.fighters[1].effects=[{type:'metalVulnerable',remaining:180,potency:.2,nextTick:1}];advance(nonmetal,6,[{attack:true},{}]);assert.equal(nonmetal.fighters[1].hp,935);
});
test('ordinary guard and Replacement prevent the Rift pull and vulnerability',()=>{
 for(const input of [{block:true},{replacement:true}]){const s=duel();s.fighters[1].x=850;advance(s,17,[{special2:true},input]);assert.equal(s.fighters[1].effects.length,0);assert.ok(s.fighters[1].x>=850);}
});
test('Shinrai Ōu enhances lightning, but not water or equipped metal attacks',()=>{
 const s=duel('winta','silent');stance(s);advance(s,6,[{attack:true},{}]);assert.equal(s.fighters[1].hp,925);
 for(const [key,ticks,expected]of [['special2',14,900],['weapon',12,895]]){const q=duel('winta','silent');stance(q);advance(q,ticks,[{[key]:true},{}]);assert.equal(q.fighters[1].hp,expected);}
});
test('Eclipse Drain heals from actual clean damage, caps HP and preserves accumulated damage',()=>{
 const s=duel('winta','silent'),f=s.fighters[0];f.hp=500;f.damageTaken=500;advance(s,14,[{special2:true},{}]);assert.equal(f.hp,535);assert.equal(f.damageTaken,500);
 const guard=duel('winta','silent');guard.fighters[0].hp=500;advance(guard,14,[{special2:true},{block:true}]);assert.equal(guard.fighters[0].hp,500);
 const cap=duel('winta','silent');cap.fighters[0].hp=990;advance(cap,14,[{special2:true},{}]);assert.equal(cap.fighters[0].hp,1000);
 const overkill=duel('winta','silent');overkill.fighters[0].hp=500;overkill.fighters[1].hp=10;advance(overkill,14,[{special2:true},{}]);assert.equal(overkill.fighters[0].hp,503);
});
test('proposed awakenings change signatures, expire once per round and reset on the next round',()=>{
 for(const name of ['silent','winta']){const s=duel(name),f=s.fighters[0],normal=moveFor(f,'special1');f.hp=600;f.damageTaken=400;stepMatch(s,[{awakening:true},{}]);assert.equal(activeAwakening(f).proposed,true);assert.notEqual(moveFor(f,'special1'),normal);assert.equal(f.hp,600);advance(s,600);assert.equal(moveFor(f,'special1'),normal);assert.equal(f.awakeningUsed,true);s.fighters[1].hp=0;stepMatch(s);nextRound(s);assert.equal(s.fighters[0].awakeningUsed,false);assert.equal(s.fighters[0].buffs.length,0);}
});
test('new mechanics replay deterministically with finite bounded resources',()=>{
 const a=duel(),b=duel();for(let t=0;t<1800;t++){const inputs=[{block:t%100<40,bloodline:t%500===0,special1:t%130===0,special2:t%200===0,attack:t%35===0,awakening:t%150===0},{bloodline:t%600===0,special1:t%120===0,special2:t%190===0,attack:t%40===0,awakening:t%160===0}];stepMatch(a,inputs);stepMatch(b,inputs);}
 assert.deepEqual(a,b);for(const f of a.fighters){assert.ok(Number.isFinite(f.hp)&&f.hp>=0&&f.hp<=1000);assert.ok(f.chakra>=0&&f.chakra<=100);}
});

test('original awakenings speed sword chain timing',()=>{
 for(const name of ['silent','winta']){const normal=duel(name),form=duel(name);const f=form.fighters[0];f.hp=600;f.damageTaken=400;stepMatch(form,[{awakening:true},{}]);advance(normal,5,[{attack:true},{}]);advance(form,5,[{attack:true},{}]);assert.equal(normal.fighters[1].hp,1000);assert.ok(form.fighters[1].hp<1000);}
});
