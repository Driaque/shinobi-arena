import test from 'node:test';import assert from 'node:assert/strict';
import {cursorStep,menuDirection} from '../packages/input/cursor.js';
const bounds={left:0,top:0,right:1000,bottom:800};
test('cursor is stationary at neutral and bounded on every edge',()=>{assert.deepEqual(cursorStep({x:50,y:50},{x:0,y:0},.02,1,bounds),{x:50,y:50});assert.deepEqual(cursorStep({x:0,y:800},{x:-1,y:1},1,2,bounds),{x:0,y:800});});
test('cursor motion is frame-rate independent and fine deflections move more slowly',()=>{const p={x:100,y:100},axis={x:1,y:0},one=cursorStep(p,axis,.032,1,bounds);let two=cursorStep(p,axis,.016,1,bounds);two=cursorStep(two,axis,.016,1,bounds);assert.ok(Math.abs(one.x-two.x)<.0001);assert.ok(cursorStep(p,{x:.3,y:0},.032,1,bounds).x<one.x);assert.equal(one.y,100);});
test('cursor caps long frames and respects speed and resized viewport bounds',()=>{const p={x:500,y:500},axis={x:1,y:0};assert.deepEqual(cursorStep(p,axis,2,1,bounds),cursorStep(p,axis,.05,1,bounds));assert.ok(cursorStep(p,axis,.02,2,bounds).x>cursorStep(p,axis,.02,1,bounds).x);assert.deepEqual(cursorStep(p,{x:0,y:0},.02,1,{left:0,top:0,right:200,bottom:300}),{x:200,y:300});});

test('menu focus follows D-pad buttons only, including held-key repeat direction',()=>{const buttons=Array(16).fill(false);assert.equal(menuDirection(buttons),0);for(const [key,expected] of [[12,-1],[13,1],[14,-1],[15,1]]){buttons[key]=true;assert.equal(menuDirection(buttons),expected);assert.equal(menuDirection(buttons),expected);buttons[key]=false;}assert.equal(menuDirection(),0);});
