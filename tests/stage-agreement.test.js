import test from 'node:test';import assert from 'node:assert/strict';
import {agreeStage} from '../packages/network/stage-agreement.js';
test('stage resolution never treats inactivity or different choices as consent',()=>{
 assert.equal(agreeStage(['frost','forge'],['frost',null]),null);
 assert.equal(agreeStage(['frost','forge'],['frost','forge']),null);
 assert.equal(agreeStage(['frost','forge'],['court','court']),null);
 assert.equal(agreeStage(['frost','forge'],['between','between'],()=>0.9),'forge');
 assert.equal(agreeStage(['random','random'],['random','random'],()=>0),'skyglass');
});
