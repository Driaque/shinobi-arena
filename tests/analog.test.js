import test from 'node:test';
import assert from 'node:assert/strict';
import {createStickGestures} from '../packages/input/analog.js';
import {createInput} from '../packages/input/index.js';
import {createMatch,stepMatch} from '../packages/engine/index.js';
import {freshSettings,readSettings,rebind} from '../packages/input/preferences.js';
const neutral={x:0,y:0};
function adapter(){const g=createStickGestures(),i=createInput(),s=createMatch();return {g,i,s,update(x,y,time){const intent=g.update({x,y},time);i.setAxis('stick',intent.moveX);if(intent.jump){i.press('jump','stick-jump');i.release('stick-jump');}if(intent.crouch)i.press('crouch','stick-crouch');else i.release('stick-crouch');if(intent.dashDirection)i.dash(intent.dashDirection);stepMatch(s,[i.consume(),{}]);return intent;}};}
test('up pulls jump and double jump, holding never repeats and a third jump is rejected',()=>{
 const a=adapter();a.update(0,-1,0);assert.equal(a.s.fighters[0].jumps,1);a.update(0,-1,20);assert.equal(a.s.fighters[0].jumps,1);a.update(0,0,40);a.update(0,-1,60);assert.equal(a.s.fighters[0].jumps,2);a.update(0,0,80);a.update(0,-1,100);assert.equal(a.s.fighters[0].jumps,2);
});
test('two centered horizontal pulls emit an absolute dash in either screen direction',()=>{
 for(const d of [-1,1]){const a=adapter();a.s.fighters[1].x=a.s.fighters[0].x-d*200;a.s.fighters[0].facing=-d;a.update(d,0,0);assert.equal(a.s.fighters[0].dash,null);a.update(0,0,50);a.update(d,0,150);assert.equal(a.s.fighters[0].dash.direction,d);}
});
test('double pulls also work across normal releases, but cancellation clears history',()=>{
 const g=createStickGestures();g.update({x:1,y:0},0);g.release();assert.equal(g.update({x:1,y:0},150).dashDirection,1);g.reset();assert.equal(g.update({x:1,y:0},180).dashDirection,0);
});
test('holding, jitter, slow pulls and opposite directions do not create repeat dashes',()=>{
 const g=createStickGestures();g.update({x:1,y:0},0);for(let t=10;t<300;t+=10)assert.equal(g.update({x:.7,y:0},t).dashDirection,0);
 g.update(neutral,350);assert.equal(g.update({x:1,y:0},400).dashDirection,0);g.update({x:-1,y:0},420);assert.equal(g.update({x:1,y:0},450).dashDirection,0);
 const jitter=createStickGestures();assert.equal(jitter.update({x:.2,y:-.2},0).jump,false);assert.equal(jitter.update({x:.2,y:.2},10).crouch,false);
});
test('up diagonals jump while preserving analog movement; horizontal drift does not jump',()=>{
 const g=createStickGestures();const diagonal=g.update({x:.7,y:-.7},0);assert.equal(diagonal.jump,true);assert.equal(diagonal.moveX,.7);g.reset();assert.equal(g.update({x:.99,y:-.4},20).jump,false);
});
test('holding down crouches and stops ground movement; neutral stands, up jumps out',()=>{
 const a=adapter(),x=a.s.fighters[0].x;a.update(.2,1,0);assert.equal(a.s.fighters[0].crouching,true);assert.equal(a.s.fighters[0].x,x);a.update(0,0,20);assert.equal(a.s.fighters[0].crouching,false);a.update(0,1,40);a.update(0,-1,60);assert.ok(a.s.fighters[0].y>0);assert.equal(a.s.fighters[0].crouching,false);
});
test('crouching cannot block automatically, dodge melee or exceed air jump/dash rules',()=>{
 const s=createMatch();s.fighters[0].x=600;s.fighters[1].x=670;for(let t=0;t<6;t++)stepMatch(s,[{crouch:true},{attack:true}]);assert.equal(s.fighters[0].hp,935);assert.equal(s.fighters[0].crouching,false);
 const air=adapter();air.update(0,-1,0);air.update(0,1,20);assert.equal(air.s.fighters[0].crouching,false);
});
test('crouched projectile hurtbox can duck a high shot without avoiding a body-height shot',()=>{
 for(const [height,expected]of [[90,1000],[65,945]]){const s=createMatch();s.fighters[0].x=600;s.fighters[1].x=800;s.projectiles=[{id:1,owner:1,x:614,y:height,direction:-1,life:20,move:'shuriken',power:1,weak:1,pierce:0}];stepMatch(s,[{crouch:true},{}]);assert.equal(s.fighters[0].hp,expected);}
});
test('dash pulses consume once and reset drops pending gestures without clearing another held action',()=>{
 const i=createInput();i.press('attack','finger');i.dash(-1);assert.equal(i.consume().dashDirection,-1);assert.equal(i.consume().dashDirection,undefined);assert.equal(i.snapshot().attack,true);i.dash(1);i.reset();assert.equal(i.consume().dashDirection,undefined);assert.throws(()=>i.dash(0));
});
test('existing preferences retain keys/layouts and add crouch without stealing custom S',()=>{
 const old=freshSettings();old.version=3;delete old.keys[0].KeyS;delete old.keys[1].ArrowDown;const updated=readSettings(JSON.stringify(old));assert.equal(updated.version,6);assert.equal(updated.keys[0].KeyS,'crouch');assert.equal(updated.keys[1].ArrowDown,'crouch');
 old.keys=rebind(old.keys,0,'attack','KeyS');const custom=readSettings(JSON.stringify(old));assert.equal(custom.keys[0].KeyS,'attack');assert.equal(Object.values(custom.keys[0]).includes('crouch'),false);
});
