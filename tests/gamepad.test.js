import test from 'node:test';
import assert from 'node:assert/strict';
import {createInput} from '../packages/input/index.js';
import {createGamepads,padIntent} from '../packages/input/gamepad.js';
function rig(){
 const inputs=[createInput(),createInput()],pad=index=>({index,id:'Xbox '+index,connected:true,axes:[0,0,0,0],buttons:Array.from({length:16},()=>({pressed:false}))});
 const a=pad(0),b=pad(1);let pads=[a,b],playing=true,local=true,activity=0;const connections=[];
 const adapter=createGamepads({inputs,settings:()=>({}),getPads:()=>pads,isPlaying:()=>playing,isLocal:()=>local,onPause:()=>{playing=false;},onActivity:()=>activity++,onConnection:(i,p)=>connections.push([i,!!p])});
 return {inputs,a,b,adapter,connections,get activity(){return activity;},set pads(value){pads=value;},set playing(value){playing=value;},set local(value){local=value;}};
}
test('all seven abilities use the modifier without leaking base attacks',()=>{
 const r=rig();r.a.buttons[5].pressed=true;
 for(const [button,action]of [[0,'special1'],[1,'special2'],[2,'bloodline'],[3,'jutsu4'],[12,'jutsu5'],[13,'jutsu6'],[14,'jutsu7']]){
  r.a.buttons[button].pressed=true;r.adapter.poll();const frame=r.inputs[0].consume();assert.equal(frame[action],true);assert.equal(frame.attack,false);assert.equal(frame.jump,false);
  r.a.buttons[button].pressed=false;r.adapter.poll();r.inputs[0].consume();
 }
});
test('disconnect never promotes player two and cancels pending controller actions only',()=>{
 const r=rig();r.adapter.poll();r.a.buttons[2].pressed=true;r.b.axes[0]=1;r.inputs[0].press('block','keyboard');r.adapter.poll();r.pads=[r.b];r.adapter.poll();
 const frame=r.inputs[0].consume();assert.equal(frame.attack,false);assert.equal(frame.block,true);assert.equal(frame.moveX,0);assert.equal(r.inputs[1].consume().moveX,1);
 assert.deepEqual(r.connections,[[0,true],[1,true],[0,false]]);
});
test('controller two cannot control the local player in online or solo modes',()=>{const r=rig();r.local=false;r.b.buttons[2].pressed=true;r.adapter.poll();assert.equal(r.inputs[1].consume().attack,false);assert.equal(r.activity,0);});
test('touch can stay active while a controller is held steady',()=>{const r=rig();r.a.axes[0]=.8;r.adapter.poll();assert.equal(r.activity,1);r.adapter.poll();assert.equal(r.activity,1);r.a.buttons[0].pressed=true;r.adapter.poll();assert.equal(r.activity,2);});
test('confirm held across a menu transition cannot jump until released and pressed again',()=>{
 const r=rig();r.playing=false;r.a.buttons[0].pressed=true;r.adapter.poll();r.playing=true;r.adapter.poll();assert.equal(r.inputs[0].consume().jump,false);
 r.adapter.poll();assert.equal(r.inputs[0].consume().jump,false);r.a.buttons[0].pressed=false;r.adapter.poll();r.a.buttons[0].pressed=true;r.adapter.poll();assert.equal(r.inputs[0].consume().jump,true);
});
test('pause fires once and clearing controller sources preserves a simultaneous keyboard tap',()=>{const r=rig();r.a.buttons[9].pressed=true;r.adapter.poll();r.inputs[0].press('jump','keyboard');r.inputs[0].release('keyboard');r.adapter.poll();assert.equal(r.inputs[0].consume().jump,true);});
test('dead zone filters drift, trigger values work, and right stick aim is available',()=>{const pad={axes:[.1,-1,.8,-.8],buttons:[{value:1}]},v=padIntent(pad);assert.equal(v.moveX,0);assert.equal(v.moveZ,-1);assert.equal(v.buttons[0],true);assert.ok(v.aimX>0&&v.aimZ<0);});
test('polling with no controller preserves touch aim and cancelling a pad removes only its aim',()=>{
 const r=rig();r.pads=[];r.inputs[0].aim(.4,.8);r.adapter.poll();assert.equal(r.inputs[0].consume().aimX,.4);
 r.pads=[r.a];r.a.axes[2]=1;r.adapter.poll();r.pads=[];r.adapter.poll();assert.equal(r.inputs[0].consume().aimX,undefined);
});
test('a replacement controller occupies the empty player slot without moving the surviving pad',()=>{
 const r=rig();r.adapter.poll();r.pads=[r.b];r.adapter.poll();const c={...r.a,index:3,id:'Replacement'};r.pads=[r.b,c];r.adapter.poll();assert.deepEqual(r.adapter.slots,[3,1]);
});
