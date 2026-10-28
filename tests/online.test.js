import test from 'node:test';
import assert from 'node:assert/strict';
import {createArena} from '../apps/server/arena.js';
import {playerProfile,cleanInput,PROTOCOL_VERSION,RULES_VERSION} from '../packages/network/protocol.js';
import {createOnlineServer} from '../apps/server/index.js';
import {WebSocket} from 'ws';
const profile=(name='Silent')=>({name,character:'silent',weapon:'tachi'});
const join=(a,c,name)=>a.message(c,{type:'join',protocol:PROTOCOL_VERSION,rules:RULES_VERSION,profile:profile(name)});
function fixture(options={}){const a=createArena({countdownTicks:1,...options});const make=()=>{const messages=[];const c=a.connect(msg=>messages.push(structuredClone(msg)));return {c,messages,last:type=>messages.findLast(m=>m.type===type)};};return {a,make};}
function paired(){const f=fixture(),p=f.make(),q=f.make();join(f.a,p.c,'Silent');join(f.a,q.c,'Winta');f.a.advance();return {...f,p,q};}
test('online profiles validate names and catalog values without accepting inherited keys',()=>{
 assert.equal(playerProfile(profile('  Éowyn  2 ')).name,'Éowyn 2');
 for(const name of ['x','<script>','a'.repeat(21),'a\n\0b'])assert.throws(()=>playerProfile(profile(name)));
 assert.throws(()=>playerProfile({...profile(),character:'constructor'}));assert.throws(()=>playerProfile({...profile(),weapon:'__proto__'}));
 const input=cleanInput({attack:true,hp:9999,moveX:999,dashDirection:9,pressedActions:['attack','attack','hp']});assert.equal(input.hp,undefined);assert.equal(input.moveX,1);assert.deepEqual(input.pressedActions,['attack']);assert.equal(input.dashDirection,undefined);
});
test('FIFO matchmaking waits, cancels and pairs names with immutable loadouts and slots',()=>{
 const {a,make}=fixture(),p=make(),q=make(),r=make();join(a,p.c,'One');assert.equal(p.last('queued').position,1);
 a.message(p.c,{type:'cancel'});assert.equal(a.stats().queued,0);join(a,q.c,'Two');join(a,r.c,'Three');assert.equal(q.last('matched').slot,0);assert.equal(r.last('matched').slot,1);assert.deepEqual(q.last('matched').players.map(p=>p.name),['Two','Three']);assert.equal(p.last('matched'),undefined);
 a.message(q.c,{type:'join',protocol:PROTOCOL_VERSION,rules:RULES_VERSION,profile:profile('Four')});assert.match(q.last('error').message,/Already/);a.close();
});
test('server rejects wrong versions and malformed profiles without taking a queue slot',()=>{
 const {a,make}=fixture(),p=make();a.message(p.c,{type:'join',profile:profile(),protocol:0});assert.match(p.last('error').message,/version/);assert.equal(a.stats().queued,0);join(a,p.c,'<bad>');assert.equal(a.stats().queued,0);a.close();
});
test('countdown freezes combat; only valid sequenced input moves the owning fighter',()=>{
 const {a,make}=fixture({countdownTicks:6}),p=make(),q=make();join(a,p.c,'One');join(a,q.c,'Two');const m=p.c.match;
 a.message(p.c,{type:'input',seq:1,input:{moveX:1,hp:9999}});for(let i=0;i<6;i++)a.advance();assert.equal(m.state.tick,0);
 a.message(q.c,{type:'input',seq:1,input:{moveX:-1,hp:9999}});a.advance();assert.equal(m.state.fighters[0].x,360);assert.ok(m.state.fighters[1].x<920);assert.equal(m.state.fighters[1].hp,1000);
 const previousX=m.state.fighters[1].x;a.message(q.c,{type:'input',seq:1,input:{moveX:1}});a.advance();assert.ok(m.state.fighters[1].x<previousX);a.close();
});
test('one-shot jump and dash packets execute once; stale movement releases automatically',()=>{
 const {a,p}=paired(),m=p.c.match;a.message(p.c,{type:'input',seq:1,input:{jump:true,pressedActions:['jump']}});a.advance();for(let i=0;i<3;i++)a.advance();assert.equal(m.state.fighters[0].jumps,1);
 a.message(p.c,{type:'input',seq:2,input:{moveX:1,dashDirection:1}});a.advance();assert.ok(m.state.fighters[0].dash);for(let i=0;i<40;i++)a.advance();const x=m.state.fighters[0].x;for(let i=0;i<10;i++)a.advance();assert.equal(m.state.fighters[0].x,x);a.close();
});
test('round transition requires both players ready and retains scores',()=>{
 const {a,p,q}=paired(),m=p.c.match;m.state.fighters[1].hp=0;a.advance();assert.equal(m.phase,'roundOver');assert.deepEqual(m.state.wins,[1,0]);a.message(p.c,{type:'ready'});assert.equal(m.phase,'roundOver');a.message(q.c,{type:'ready'});assert.equal(m.phase,'countdown');assert.equal(m.state.round,2);assert.equal(m.state.fighters[1].hp,1000);assert.deepEqual(m.state.wins,[1,0]);a.close();
});
test('disconnect forfeits the match, frees capacity and permits requeue',()=>{
 const {a,p,q}=paired();a.disconnect(p.c);assert.equal(q.last('ended').reason,'opponent-disconnected');assert.equal(q.last('ended').winner,1);assert.equal(a.stats().matches,0);join(a,q.c,'Again');assert.equal(q.last('queued').position,1);a.close();
});
test('client and input budgets are bounded and rooms expire',()=>{
 const {a,make}=fixture({maxClients:1});const p=make();assert.equal(a.connect(()=>{}),null);for(let i=0;i<181;i++)a.message(p.c,{type:'ping'});assert.equal(a.stats().connections,0);a.close();
 const f=paired();f.p.c.match.phase='matchOver';f.p.c.match.remaining=0;for(let i=0;i<7201;i++)f.a.advance();assert.equal(f.a.stats().matches,0);f.a.close();
});
test('real WebSocket transport shares matches and rejects cross-origin connections',async()=>{
 const app=createOnlineServer({port:0,host:'127.0.0.1',origins:['http://game.test'],countdownTicks:1});await app.listen();const port=app.server.address().port,url=`ws://127.0.0.1:${port}/ws`;
 const sockets=[];
 try{
  const health=await fetch(`http://127.0.0.1:${port}/health`);assert.equal((await health.json()).ok,true);
  const open=()=>new Promise((resolve,reject)=>{const ws=new WebSocket(url,{origin:'http://game.test'});sockets.push(ws);const messages=[];ws.on('error',reject);ws.on('message',raw=>{const msg=JSON.parse(raw);messages.push(msg);if(msg.type==='hello')resolve({ws,messages});});});
  const [p,q]=await Promise.all([open(),open()]);for(const [i,c]of [p,q].entries())c.ws.send(JSON.stringify({type:'join',protocol:PROTOCOL_VERSION,rules:RULES_VERSION,profile:profile(`Player ${i}`)}));
  await new Promise((resolve,reject)=>{const limit=setTimeout(()=>reject(new Error('No shared match')),2000);const poll=setInterval(()=>{if(p.messages.some(m=>m.type==='snapshot')&&q.messages.some(m=>m.type==='snapshot')){clearTimeout(limit);clearInterval(poll);resolve();}},10);});
  assert.equal(p.messages.find(m=>m.type==='matched').id,q.messages.find(m=>m.type==='matched').id);
  await new Promise(resolve=>{const bad=new WebSocket(url,{origin:'https://evil.test'});bad.on('unexpected-response',(_,res)=>{assert.equal(res.statusCode,403);res.resume();bad.terminate();resolve();});bad.on('error',()=>{});});
 }finally{for(const ws of sockets)ws.terminate();await app.close();}
});
