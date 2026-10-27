import test from 'node:test';
import assert from 'node:assert/strict';
import {createMatch,stepMatch,computerInput,nextRound} from '../packages/engine/index.js';
import {createInput} from '../packages/input/index.js';
import {defaultDockLayout,projectControl,layoutOverlaps,freshSettings,readSettings,rebind,CONTROL_DECK_HEIGHT} from '../packages/input/preferences.js';
const advance=(s,n,inputs=[{},{}])=>{for(let i=0;i<n;i++)stepMatch(s,inputs);};
function close(){const s=createMatch();s.fighters[0].x=600;s.fighters[1].x=670;return s;}
test('jump and dash combine in either order, including a jump that cancels an active dash',()=>{
 const a=createMatch();stepMatch(a,[{jump:true,dashForward:true},{}]);assert.ok(a.fighters[0].y>0);assert.ok(a.fighters[0].dash?.air);assert.ok(a.fighters[0].x>360);
 const b=createMatch();stepMatch(b,[{dashForward:true},{}]);stepMatch(b,[{jump:true},{}]);assert.ok(b.fighters[0].y>0);assert.equal(b.fighters[0].dash,null);
});
test('an airborne dash works once until landing, and does not grant invulnerability',()=>{
 const s=createMatch();stepMatch(s,[{jump:true},{}]);stepMatch(s,[{dashBack:true},{}]);assert.equal(s.fighters[0].dash.direction,-1);assert.equal(s.fighters[0].invulnerable,0);
 advance(s,25);stepMatch(s,[{dashForward:true},{}]);assert.equal(s.fighters[0].dash,null);advance(s,100);assert.equal(s.fighters[0].airDashUsed,false);
 stepMatch(s,[{jump:true,dashForward:true},{}]);assert.ok(s.fighters[0].dash?.air);
});
test('a quick jump just before attack recovery ends is buffered, not discarded',()=>{
 const s=close();stepMatch(s,[{attack:true},{}]);advance(s,18);stepMatch(s,[{jump:true},{}]);advance(s,4);assert.ok(s.fighters[0].y>0);
});
test('distinct fast taps on consecutive simulation frames still double jump',()=>{
 const s=createMatch(),input=createInput();input.press('jump','finger');input.release('finger');stepMatch(s,[input.consume(),{}]);
 input.press('jump','finger');input.release('finger');stepMatch(s,[input.consume(),{}]);assert.equal(s.fighters[0].jumps,2);
 const vy=s.fighters[0].vy;stepMatch(s,[input.consume(),{}]);assert.ok(s.fighters[0].vy<vy);
});
test('stamina limits repeated basics but recovers after a pause; holding does not repeat',()=>{
 const s=createMatch();for(let t=0;t<500;t++)stepMatch(s,[{attack:t%2===0},{}]);assert.ok(s.fighters[0].stamina<12);const stamina=s.fighters[0].stamina;
 advance(s,160);assert.ok(s.fighters[0].stamina>stamina);assert.ok(s.fighters[0].stamina<=100);
 const held=close();advance(held,80,[{attack:true},{}]);assert.equal(held.fighters[1].hp,935);
});
test('insufficient stamina rejects attacks and dash without spending chakra or starting a cooldown',()=>{
 for(const action of ['attack','weapon','dashForward']){const s=close();s.fighters[0].stamina=0;s.fighters[0].lastExertion=0;stepMatch(s,[{[action]:true},{}]);assert.equal(s.fighters[0].action,null);assert.equal(s.fighters[0].dash,null);assert.equal(s.fighters[0].chakra,100);assert.equal(s.fighters[0].cooldowns.weapon??0,0);assert.ok(s.events.some(e=>e.type==='exhausted'));}
});
test('a timed parry stops a non-piercing hit and opens a real punish window',()=>{
 const s=close();stepMatch(s,[{attack:true},{}]);advance(s,3);stepMatch(s,[{}, {block:true}]);stepMatch(s,[{}, {block:true}]);
 assert.equal(s.fighters[1].hp,1000);assert.ok(s.fighters[0].stun>=24);assert.equal(s.fighters[0].action,null);assert.ok(s.events.some(e=>e.type==='parry'));
 advance(s,7,[{}, {weapon:true}]);assert.equal(s.fighters[0].hp,925);
});
test('parry cannot be spammed during cooldown or stop full pierce',()=>{
 const s=close();s.fighters[1].parryCooldown=60;stepMatch(s,[{attack:true},{}]);advance(s,3);advance(s,2,[{}, {block:true}]);assert.equal(s.fighters[1].hp,994);
 const p=createMatch([{character:'sasuke',weapon:'kunai'},{character:'naruto',weapon:'kunai'}]);p.fighters[0].x=600;p.fighters[1].x=670;stepMatch(p,[{special1:true},{}]);advance(p,10);advance(p,2,[{}, {block:true}]);assert.equal(p.fighters[1].hp,850);assert.ok(!p.events.some(e=>e.type==='parry'));
});
test('sustained guard breaks under pressure and cannot form an infinite safe turtle',()=>{
 const s=close();s.fighters[1].guard=20;advance(s,6,[{attack:true},{block:true}]);assert.equal(s.fighters[1].hp,935);assert.ok(s.fighters[1].stun>=42);assert.equal(s.fighters[1].blocking,false);assert.ok(s.events.some(e=>e.type==='guardBreak'));
});
test('a weapon depletes guard faster than a basic, and guard recovers outside combat',()=>{
 const a=close(),b=close();advance(a,6,[{attack:true},{block:true}]);advance(b,7,[{weapon:true},{block:true}]);assert.ok(b.fighters[1].guard<a.fighters[1].guard);advance(b,200);assert.equal(b.fighters[1].guard,100);
});
test('a blocked basic leaves enough recovery to punish before another basic can start',()=>{
 const s=close();advance(s,6,[{attack:true},{block:true}]);advance(s,8);advance(s,7,[{attack:true},{weapon:true}]);assert.equal(s.fighters[0].hp,910,'weapon gets +20% during recovery');assert.ok(s.events.some(e=>e.type==='punish'));
});
test('whiffs have longer recovery, and a clean recovery hit earns 20 percent',()=>{
 const s=createMatch();advance(s,24,[{attack:true},{}]);assert.ok(s.fighters[0].action);s.fighters[0].x=600;s.fighters[1].x=670;advance(s,6,[{}, {attack:true}]);assert.equal(s.fighters[0].hp,922);
});
test('basic-only rushing loses to CPU counterplay at several tapping rates',()=>{
 for(const period of [2,8,16,24,32,48]){const s=createMatch();let cpu={};for(let t=0;t<5401&&s.status==='playing';t++){if(t%4===0)cpu=computerInput(s);stepMatch(s,[{right:true,attack:t%period===0},cpu]);}assert.equal(s.result,'player2',`tap period ${period}`);}
});
test('tactical meters and air actions reset between rounds',()=>{
 const s=createMatch();s.fighters[0].stamina=1;s.fighters[0].guard=1;s.fighters[0].airDashUsed=true;s.fighters[1].hp=0;stepMatch(s);nextRound(s);assert.equal(s.fighters[0].stamina,100);assert.equal(s.fighters[0].guard,100);assert.equal(s.fighters[0].airDashUsed,false);
});
test('docked controls stay below the fight viewport without overlap at supported landscape sizes',()=>{
 for(const [w,h]of [[627,287],[627,325],[804,344],[1238,684]]){const layout=defaultDockLayout(w,h);assert.deepEqual(layoutOverlaps(layout,w,h,'dock'),[]);for(const [id,c]of Object.entries(layout)){const p=projectControl(c,w,h,id,'dock');assert.ok(p.y-p.size/2>=h-CONTROL_DECK_HEIGHT);assert.ok(p.y+p.size/2<=h-8);assert.ok(p.x-p.size/2>=8&&p.x+p.size/2<=w-8);}}
});
test('opacity, placement, dock edits and custom keys survive persistence and old-version migration',()=>{
 const value=freshSettings();value.opacity=.35;value.placement='overlay';value.keys=rebind(value.keys,0,'jump','Space');value.layouts.medium=defaultDockLayout(804,344);value.dockLayouts.medium=defaultDockLayout(804,344);assert.deepEqual(readSettings(JSON.stringify(value)),value);
 const legacy={...value,version:2};delete legacy.opacity;delete legacy.placement;delete legacy.dockLayouts;const result=readSettings(JSON.stringify(legacy));assert.equal(result.opacity,.65);assert.equal(result.placement,'dock');assert.equal(result.keys[0].Space,'jump');assert.deepEqual(result.layouts,value.layouts);
 assert.equal(readSettings(JSON.stringify({...value,opacity:0})).opacity,.25);assert.equal(readSettings(JSON.stringify({...value,opacity:999})).opacity,1);
});

test('migration adds missing P2 dash keys without stealing a custom binding',()=>{
 const legacy=freshSettings();legacy.version=2;delete legacy.keys[1].BracketLeft;delete legacy.keys[1].BracketRight;
 const upgraded=readSettings(JSON.stringify(legacy));assert.equal(upgraded.keys[1].BracketLeft,'dashBack');assert.equal(upgraded.keys[1].BracketRight,'dashForward');
 legacy.keys=rebind(legacy.keys,0,'jump','BracketLeft');const custom=readSettings(JSON.stringify(legacy));assert.equal(custom.keys[0].BracketLeft,'jump');assert.equal(custom.keys[1].BracketLeft,undefined);
});
