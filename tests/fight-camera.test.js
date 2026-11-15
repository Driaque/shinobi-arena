import test from 'node:test';
import assert from 'node:assert/strict';
import {baseZoomFor,cameraForScene,createFightCamera,fightCameraTarget,fightViewport} from '../packages/presentation/camera.js';
import {impactPauseMs,KO_HOLD_MS} from '../packages/presentation/impact.js';
import {ARENA,createMatch,stepMatch} from '../packages/engine/index.js';

const sizes=[{worldWidth:1600,viewHeight:472},{worldWidth:1600,viewHeight:306},{worldWidth:1600,viewHeight:720},{worldWidth:1280,viewHeight:640}];
const fighter=(x,y=0,hp=100)=>({x,y,hp});
// Visible engine-space bounds of a viewport.
const bounds=v=>({left:-v.tx/v.zoom,right:(v.worldWidth-v.tx)/v.zoom,top:-v.ty/v.zoom,bottom:(v.viewHeight-v.ty)/v.zoom});

test('fight camera closes in on a grounded exchange and returns to the base view when fighters separate',()=>{
 for(const size of sizes){
  const base=baseZoomFor(size.viewHeight),mid=size.worldWidth/2;
  const close=fightCameraTarget([fighter(mid-60),fighter(mid+60)],size),wide=fightCameraTarget([fighter(ARENA.margin),fighter(size.worldWidth-ARENA.margin)],size);
  assert.ok(close.zoom>base*1.25,'close exchange is framed tighter');
  assert.ok(close.zoom<=base*2.1+1e-9);
  assert.ok(wide.zoom>=base&&wide.zoom<close.zoom&&wide.zoom<=Math.max(base,size.worldWidth/(size.worldWidth-2*ARENA.margin+500))+1e-9,'separated fighters get the whole arena');assert.equal(wide.centerX,mid);
 }
});

test('fight camera keeps every living fighter, their head and the floor inside the frame',()=>{
 for(const size of sizes)for(const [a,b] of [[100,220],[700,820],[1400,1550],[46,size.worldWidth-46],[300,900]])for(const air of [0,80,165,330]){
  const edge=size.worldWidth-ARENA.margin,fighters=[fighter(Math.min(a,edge-120),air),fighter(Math.min(b,edge))],view=bounds(fightViewport(fightCameraTarget(fighters,size),size));
  for(const f of fighters){
   assert.ok(f.x-40>=view.left-1e-6&&f.x+40<=view.right+1e-6,'body inside horizontally');
   assert.ok(ARENA.floor-f.y-110>=view.top-1e-6,'head inside the frame');
  }
  assert.ok(ARENA.floor<view.bottom,'floor stays visible');
 }
});

test('fight camera never shows more than the base view, so stage art sized for it always covers',()=>{
 for(const size of sizes){
  const widest=bounds(fightViewport({zoom:baseZoomFor(size.viewHeight),centerX:size.worldWidth/2},size));
  for(const [a,b] of [[46,120],[46,size.worldWidth-46],[size.worldWidth-200,size.worldWidth-46],[600,640]])for(const air of [0,330]){
   const view=bounds(fightViewport(fightCameraTarget([fighter(a,air),fighter(b)],size),size));
   assert.ok(view.left>=widest.left-1e-6&&view.right<=widest.right+1e-6);
   assert.ok(view.top>=widest.top-1e-6&&view.bottom<=widest.bottom+1e-6);
  }
 }
});

test('fight camera ignores defeated fighters and tolerates an empty arena',()=>{
 const size=sizes[0];
 assert.deepEqual(fightCameraTarget([fighter(200),fighter(1500,0,0),fighter(320)],size),fightCameraTarget([fighter(200),fighter(320)],size));
 assert.deepEqual(fightCameraTarget([],size),{zoom:baseZoomFor(size.viewHeight),centerX:size.worldWidth/2});
});

test('smoothed camera snaps on reset, pulls back faster than it closes in and holds still when fixed',()=>{
 const size=sizes[0],base=baseZoomFor(size.viewHeight),near=[fighter(740),fighter(860)],far=[fighter(100),fighter(1500)],wide=fightCameraTarget(far,size).zoom;
 const camera=createFightCamera();
 const start=camera.update(far,size,{snap:true});
 assert.equal(start.zoom,wide);
 const closing=camera.update(near,size,{dt:.1}).zoom;
 const target=fightCameraTarget(near,size).zoom;
 assert.ok(closing>wide&&closing<target,'eases toward the exchange');
 for(let i=0;i<120;i++)camera.update(near,size,{dt:1/60});
 const settled=camera.update(near,size,{dt:1/60}).zoom;
 assert.ok(Math.abs(settled-target)<.02);
 const pulled=camera.update(far,size,{dt:.1}).zoom;
 assert.ok((settled-pulled)/(settled-wide)>(closing-wide)/(target-wide),'pull-back is quicker than the close-in');
 assert.equal(camera.update(near,size,{dt:.1,snap:true}).zoom,target);
 const fixed=camera.update(near,size,{dt:.1,fixed:true});
 assert.equal(fixed.zoom,base);assert.ok(Math.abs(fixed.tx-size.worldWidth*.5*(1-base))<1e-9);
 // A long frame never overshoots.
 assert.ok(camera.update(near,size,{dt:30}).zoom<=target+1e-9);
});

test('impact punch scales the picture without moving the floor line; sprite and overlay cameras agree',()=>{
 const size=sizes[0],camera={zoom:1.2,centerX:800},plain=fightViewport(camera,size),punched=fightViewport(camera,size,.04);
 assert.ok(Math.abs(punched.zoom-1.2*1.04)<1e-12);
 assert.ok(Math.abs((plain.ty+ARENA.floor*plain.zoom)-(punched.ty+ARENA.floor*punched.zoom))<1e-9);
 // The sprite layer derives the same screen position for an engine point.
 const view={...plain,shakeX:3,shakeY:-2},lab=cameraForScene({viewport:view},size.worldWidth,size.viewHeight);
 const engineX=640,labFloor=650;
 assert.ok(Math.abs(lab.x+engineX*lab.scale-(view.tx+(engineX+view.shakeX)*view.zoom))<1e-9);
 assert.ok(Math.abs(lab.y+labFloor*lab.scale-(view.ty+(ARENA.floor+view.shakeY)*view.zoom))<1e-9);
});

test('impact pause grows with the blow, holds the finishing hit and ignores status ticks',()=>{
 assert.equal(impactPauseMs([]),0);assert.equal(impactPauseMs(),0);
 assert.equal(impactPauseMs([{type:'poison',damage:40},{type:'burn',damage:40}]),0);
 const light=impactPauseMs([{type:'hit',damage:20}]),heavy=impactPauseMs([{type:'hit',damage:90}]);
 assert.ok(light>=30&&light<heavy&&heavy<=115);
 assert.ok(impactPauseMs([{type:'block',damage:10,move:'basic'}])<light);
 assert.ok(impactPauseMs([{type:'guardBreak',damage:80,move:'basic'}])>heavy);
 assert.equal(impactPauseMs([{type:'guardBreak',damage:80}]),0,'guard breaks from field ticks stay fluid');
 assert.equal(impactPauseMs([{type:'hit',damage:50},{type:'roundEnd',result:0}]),KO_HOLD_MS);
 assert.ok(impactPauseMs([{type:'roundEnd',result:'draw'}])<KO_HOLD_MS);
 assert.ok(impactPauseMs([{type:'guardBreak',damage:999,move:'x'},{type:'airFinish'},{type:'parry'}])<=170);
});

test('impact pause reads real engine events without changing the match',()=>{
 const state=createMatch();state.fighters[1].x=state.fighters[0].x+70;
 let longest=0;
 for(let i=0;i<90&&state.status==='playing';i++){
  stepMatch(state,[{attack:i%20===0},{}]);
  const before=structuredClone(state),pause=impactPauseMs(state.events);
  assert.deepEqual(state,before);longest=Math.max(longest,pause);
 }
 assert.ok(longest>0&&longest<KO_HOLD_MS,'a landed basic attack pauses briefly');
});
