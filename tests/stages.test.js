import test from 'node:test';
import assert from 'node:assert/strict';
import {STAGES,stageFor,resolveStage} from '../packages/engine/stages.js';
import {stageShapes} from '../packages/presentation/stages.js';
import {createMatch,nextRound,stepMatch} from '../packages/engine/index.js';
import {createTraining,resetTraining} from '../packages/engine/training.js';
import {createArena} from '../apps/server/arena.js';
import {playerProfile,PROTOCOL_VERSION,RULES_VERSION} from '../packages/network/protocol.js';
const profile=(name,stage)=>({name,character:'silent',weapon:'tachi',stage});
test('stage catalog is bounded, unknown choices fall back and Random resolves to a real identity',()=>{
 assert.equal(STAGES.length,5);assert.equal(stageFor('__proto__').id,'skyglass');
 for(let i=0;i<5;i++)assert.equal(resolveStage('random',()=>i/5),STAGES[i].id);
 assert.equal(playerProfile(profile('Silent','frost')).stage,'frost');assert.equal(playerProfile(profile('Silent','bad')).stage,undefined);
});
test('stage identity survives rounds and training resets; mechanics stay equivalent',()=>{
 const base=createMatch(),other=createMatch(undefined,{stage:'forge'});assert.deepEqual(other.arena,base.arena);
 for(let i=0;i<60;i++){const input=[{right:true},{}];stepMatch(base,input);stepMatch(other,input);}
 assert.deepEqual(other.fighters,base.fighters);other.status='roundOver';nextRound(other);assert.equal(other.stage,'forge');
 const t=createTraining();t.stage='grove';assert.equal(resetTraining(t).stage,'grove');
});
test('all stage scenery is finite, distinct and stateless',()=>{
 const snapshots=STAGES.map(s=>JSON.stringify(stageShapes(s.id)));assert.equal(new Set(snapshots).size,5);
 for(const s of STAGES){assert.deepEqual(stageShapes(s.id),stageShapes(s.id));for(const shape of stageShapes(s.id)){for(const n of shape.points??[shape.x,shape.y,shape.rx,shape.ry])assert.ok(Number.isFinite(n));}}
});
test('server chooses P1 stage once for both players, spectator snapshots and recorded frames',()=>{
 let record;const arena=createArena({countdownTicks:1,onResult:r=>record=r}),messages=[[],[],[]],clients=messages.map(list=>arena.connect(m=>list.push(structuredClone(m))));
 for(let i=0;i<2;i++)arena.message(clients[i],{type:'join',protocol:PROTOCOL_VERSION,rules:RULES_VERSION,profile:profile(i?'Winta':'Silent',i?'forge':'frost')});
 const match=messages[0].find(m=>m.type==='matched');assert.equal(match.state.stage,'frost');assert.equal(messages[1].find(m=>m.type==='matched').state.stage,'frost');
 arena.message(clients[2],{type:'watch',id:match.id,protocol:PROTOCOL_VERSION,rules:RULES_VERSION});assert.equal(messages[2].find(m=>m.type==='watching').state.stage,'frost');
 arena.advance();arena.advance();arena.disconnect(clients[0]);assert.ok(record.replay.frames.every(f=>f.state.stage==='frost'));arena.close();
});
