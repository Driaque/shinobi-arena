import test from 'node:test';
import assert from 'node:assert/strict';
import {createInput} from '../packages/input/index.js';
import {createMatch,stepMatch} from '../packages/engine/index.js';
import {stickVector,defaultLayout,defaultDockLayout,layoutOverlaps,projectControl,readSettings,freshSettings,rebind,keyForAction,layoutProfile} from '../packages/input/preferences.js';
test('analog dead zone prevents drift; deflection scales and clamps movement',()=>{
 assert.deepEqual(stickVector(2,1,40),{x:0,y:0});
 const half=stickVector(23.6,0,40);assert.ok(Math.abs(half.x-.5)<.001);
 assert.equal(stickVector(100,0,40).x,1);assert.equal(stickVector(-100,0,40).x,-1);
 assert.equal(stickVector(0,40,40).x,0);
 assert.throws(()=>stickVector(NaN,0,40));
});
test('analog reset and pointer release clear movement independently of attack',()=>{
 const i=createInput();i.setAxis('stick',.5);i.press('attack',2);i.release('stick');
 assert.equal(i.consume().moveX,0);assert.equal(i.snapshot().attack,true);
 i.setAxis('stick',1);i.reset();assert.equal(i.snapshot().moveX,0);
});
test('horizontal axis moves proportionally without generating a jump by itself',()=>{
 const s=createMatch(),x=s.fighters[0].x;stepMatch(s,[{moveX:.5},{}]);assert.equal(s.fighters[0].x-x,2.5);assert.equal(s.fighters[0].y,0);
 stepMatch(s,[{moveX:100},{}]);assert.equal(s.fighters[0].x-x,7.5);
});
test('keyboard and analog do not double movement speed; opposite keys stay neutral',()=>{
 const s=createMatch(),x=s.fighters[0].x;stepMatch(s,[{right:true,moveX:1},{}]);assert.equal(s.fighters[0].x-x,5);
 stepMatch(s,[{left:true,right:true,moveX:1},{}]);assert.equal(s.fighters[0].x-x,5);
});
test('default layouts fit three landscape sizes without overlapping',()=>{
 for(const [w,h]of [[627,287],[804,302],[1238,684]]){
  const layout=defaultLayout(w,h);assert.deepEqual(layoutOverlaps(layout,w,h),[]);
  for(const [id,c]of Object.entries(layout)){const p=projectControl(c,w,h,id);assert.ok(p.x-p.size/2>=8&&p.x+p.size/2<=w-8);assert.ok(p.y-p.size/2>=82&&p.y+p.size/2<=h-8);}
 }
});
test('offscreen positions and oversized controls are clamped',()=>{
 const p=projectControl({x:-20,y:40,size:900},627,287,'attack');assert.equal(p.size,90);assert.ok(p.x>=53&&p.y<=234);
});
test('overlap detection rejects conflicting touch locations',()=>{
 const layout=defaultLayout(804,302);layout.weapon={...layout.attack};assert.ok(layoutOverlaps(layout,804,302).some(p=>p.includes('weapon')&&p.includes('attack')));
});
test('rebinding removes old key and rejects cross-player duplicates or reserved keys',()=>{
 const keys=freshSettings().keys,newKeys=rebind(keys,0,'jump','Space');
 assert.equal(newKeys[0].KeyW,undefined);assert.equal(newKeys[0].Space,'jump');assert.equal(keys[0].KeyW,'jump');
 assert.throws(()=>rebind(keys,1,'jump','KeyA'));assert.throws(()=>rebind(keys,0,'jump','Escape'));assert.throws(()=>rebind(keys,0,'jump','KeyP'));
 assert.equal(keyForAction(rebind(keys,0,'jump',null),0,'jump'),null);
});
test('settings round trip preserves keys and layout profile edits',()=>{
 const s=freshSettings();s.layouts.medium=defaultLayout(804,302);s.layouts.medium.stick.size=120;s.keys=rebind(s.keys,0,'attack','Semicolon');
 assert.deepEqual(readSettings(JSON.stringify(s)),s);assert.equal(layoutProfile(667),'small');assert.equal(layoutProfile(844),'medium');
});
test('corrupt, incompatible and duplicate persisted settings fall back safely',()=>{
 for(const value of ['not json','null','{"version":999}',JSON.stringify({version:1,keys:[{KeyA:'left'},{KeyA:'right'}],layouts:{}})])assert.deepEqual(readSettings(value),freshSettings());
});


test('portrait deck fits narrow phones and its saved edits do not overwrite landscape',()=>{
 for(const width of [320,375,390,430]){
  const height=680, layout=defaultDockLayout(width,height);
  assert.deepEqual(layoutOverlaps(layout,width,height,'dock'),[],String(width));
  for(const [id,c]of Object.entries(layout)){const p=projectControl(c,width,height,id,'dock');assert.ok(p.x-p.size/2>=0&&p.x+p.size/2<=width);assert.ok(p.y-p.size/2>=height-300);}
 }
 const settings=freshSettings();settings.dockLayouts.small=defaultDockLayout(667,375);settings.dockLayouts.portrait=defaultDockLayout(390,680);
 settings.dockLayouts.portrait.attack.x=.7;const restored=readSettings(JSON.stringify(settings));
 assert.equal(restored.dockLayouts.portrait.attack.x,.7);assert.deepEqual(restored.dockLayouts.small,settings.dockLayouts.small);
});
