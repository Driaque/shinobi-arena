import test from 'node:test';import assert from 'node:assert/strict';import {canControlSetup} from '../packages/input/setup-ownership.js';
test('paired controllers can edit only their own setup fields and dialog',()=>{for(const slot of [0,1]){assert.equal(canControlSetup(slot,String(slot),true),true);assert.equal(canControlSetup(slot,String(1-slot),true),false);}});
test('only player one navigates shared menus and starts a local match',()=>{assert.equal(canControlSetup(0,null,true),true);assert.equal(canControlSetup(1,null,true),false);});
test('single-pad CPU and keyboard setups retain player-one editing of both fighters',()=>{assert.equal(canControlSetup(0,'1',false),true);assert.equal(canControlSetup(1,'1',false),false);});
