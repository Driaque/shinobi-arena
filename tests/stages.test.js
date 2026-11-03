import {acceptStage} from './accept-stage.js';
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
 acceptStage(arena,clients[0],'frost');const match=messages[0].find(m=>m.type==='matched');assert.equal(match.state.stage,'frost');assert.equal(messages[1].find(m=>m.type==='matched').state.stage,'frost');
 arena.message(clients[2],{type:'watch',id:match.id,protocol:PROTOCOL_VERSION,rules:RULES_VERSION});assert.equal(messages[2].find(m=>m.type==='watching').state.stage,'frost');
 arena.advance();arena.advance();arena.disconnect(clients[0]);assert.ok(record.replay.frames.every(f=>f.state.stage==='frost'));arena.close();
});

test('casual stage agreement requires two matching votes, freezes combat and cancels on timeout',()=>{
 const records=[],arena=createArena({countdownTicks:1,onResult:r=>records.push(r)}),messages=[[],[]],clients=messages.map(list=>arena.connect(m=>list.push(structuredClone(m))));
 for(let i=0;i<2;i++)arena.message(clients[i],{type:'join',preparation:true,protocol:PROTOCOL_VERSION,rules:RULES_VERSION,profile:profile(i?'Winta':'Silent',i?'forge':'frost')});
 assert.equal(clients[0].match.phase,'preparing');const initial=structuredClone(clients[0].match.state);
 arena.message(clients[0],{type:'stageVote',choice:'frost'});arena.message(clients[1],{type:'stageVote',choice:'forge'});
 for(let i=0;i<30;i++)arena.advance();assert.deepEqual(clients[0].match.state,initial);assert.equal(clients[0].match.phase,'preparing');
 arena.message(clients[1],{type:'stageVote',choice:'frost'});assert.equal(clients[0].match.phase,'countdown');assert.equal(clients[1].match.state.stage,'frost');arena.close();
 const timed=createArena({onResult:r=>records.push(r)}),a=timed.connect(()=>{}),b=timed.connect(()=>{});
 for(const [i,c]of [a,b].entries())timed.message(c,{type:'join',preparation:true,protocol:PROTOCOL_VERSION,rules:RULES_VERSION,profile:profile(i?'Winta':'Silent','frost')});
 for(let i=0;i<3600;i++)timed.advance();assert.equal(a.match,null);assert.equal(records.at(-1).reason,'cancelled');assert.equal(records.at(-1).playedTicks,0);timed.close();
});
test('ranked and tournament stages are selected by the system rather than P1 preference',()=>{
 const arena=createArena(),a=arena.connect(()=>{}),b=arena.connect(()=>{});a.playerId='one';b.playerId='two';
 for(const [i,c]of [a,b].entries())arena.message(c,{type:'join',queue:'ranked',preparation:true,protocol:PROTOCOL_VERSION,rules:RULES_VERSION,profile:profile(i?'Winta':'Silent','frost')});
 assert.equal(a.match.phase,'countdown');assert.ok(STAGES.some(s=>s.id===a.match.state.stage));arena.close();
});
test('disconnect during stage preparation cancels without a misleading win or forfeit',()=>{
 const records=[],messages=[],arena=createArena({onResult:r=>records.push(r)}),a=arena.connect(m=>messages.push(m)),b=arena.connect(()=>{});
 for(const [i,c]of [a,b].entries())arena.message(c,{type:'join',protocol:PROTOCOL_VERSION,rules:RULES_VERSION,profile:profile(i?'Winta':'Silent','frost')});
 arena.disconnect(b);assert.equal(records[0].reason,'cancelled');assert.equal(records[0].winner,null);assert.equal(messages.at(-1).reason,'preparation-cancelled');assert.equal(messages.at(-1).winner,null);arena.close();
});
test('expired preparation frees capacity for the next queued pair',()=>{
 const arena=createArena({maxMatches:1}),clients=Array.from({length:4},()=>arena.connect(()=>{}));
 for(const [i,c]of clients.entries())arena.message(c,{type:'join',protocol:PROTOCOL_VERSION,rules:RULES_VERSION,profile:profile('Player '+i,'frost')});
 assert.equal(arena.stats().queued,2);for(let i=0;i<3600;i++)arena.advance();assert.equal(clients[0].match,null);assert.equal(clients[2].match.phase,'preparing');assert.equal(arena.stats().queued,0);arena.close();
});
