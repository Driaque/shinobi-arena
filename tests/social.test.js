import test from 'node:test';
import assert from 'node:assert/strict';
import {createArena} from '../apps/server/arena.js';
import {PROTOCOL_VERSION,RULES_VERSION} from '../packages/network/protocol.js';
function setup(){let at=0;const a=createArena({countdownTicks:180,now:()=>at++});const make=name=>{const messages=[];const c=a.connect(m=>messages.push(structuredClone(m)));a.message(c,{type:'lounge',protocol:PROTOCOL_VERSION,rules:RULES_VERSION,profile:{name,character:'silent',weapon:'tachi'}});return {c,messages,last:type=>messages.findLast(m=>m.type===type)};};return {a,make};}
test('presence exposes guests and availability without credentials; duels require target acceptance and stay casual',()=>{
 const {a,make}=setup(),p=make('Silent'),q=make('Winta'),r=make('Other');
 assert.equal(p.last('presence').players.length,3);assert.equal(p.last('presence').players[0].kind,'guest');assert.equal(a.stats().queued,0);
 a.message(p.c,{type:'challenge',target:q.c.id});const ch=q.last('challenge');assert.ok(ch.id);assert.equal(a.stats().matches,0);
 a.message(r.c,{type:'challengeReply',id:ch.id,accept:true});assert.match(r.last('socialError').message,/not yours/);assert.equal(a.stats().matches,0);
 a.message(q.c,{type:'challengeReply',id:ch.id,accept:true});assert.equal(p.last('matched').id,q.last('matched').id);assert.equal(p.c.match.mode,'casual');assert.equal(r.last('presence').players.find(x=>x.id===p.c.id).status,'fighting');a.close();
});
test('challenge spam, decline, expiry, busy targets and disconnect are handled',()=>{
 const {a,make}=setup(),p=make('Silent'),q=make('Winta');a.message(p.c,{type:'challenge',target:p.c.id});assert.match(p.last('socialError').message,/unavailable/);
 a.message(p.c,{type:'challenge',target:q.c.id});const id=q.last('challenge').id;a.message(q.c,{type:'challengeReply',id,accept:false});assert.equal(p.last('challengeClosed').reason,'declined');
 a.message(p.c,{type:'challenge',target:q.c.id});assert.match(p.last('socialError').message,/five seconds/);
 for(let i=0;i<300;i++)a.advance();a.message(p.c,{type:'challenge',target:q.c.id});for(let i=0;i<1800;i++)a.advance();assert.equal(q.last('challengeClosed').reason,'expired');
 a.message(p.c,{type:'challenge',target:q.c.id});a.disconnect(q.c);assert.equal(p.last('challengeClosed').reason,'disconnected');assert.equal(p.last('presence').players.length,1);a.close();
});
test('gestures reach only opponents before and after fights; active combat and unknown gestures are rejected',()=>{
 const {a,make}=setup(),p=make('Silent'),q=make('Winta'),r=make('Other');a.message(p.c,{type:'challenge',target:q.c.id});a.message(q.c,{type:'challengeReply',id:q.last('challenge').id,accept:true});
 a.message(p.c,{type:'gesture',gesture:'invalid'});assert.match(p.last('socialError').message,/Unknown/);
 a.message(p.c,{type:'gesture',gesture:'bow'});assert.equal(q.last('gesture').gesture,'bow');assert.equal(r.last('gesture'),undefined);
 a.message(p.c,{type:'gesture',gesture:'wave'});assert.match(p.last('socialError').message,/Wait/);
 for(let i=0;i<180;i++)a.advance();a.message(q.c,{type:'gesture',gesture:'bow'});assert.match(q.last('socialError').message,/before and after/);
 const m=p.c.match;m.state.fighters[1].hp=0;a.advance();a.message(q.c,{type:'gesture',gesture:'goodFight'});assert.equal(p.last('gesture').gesture,'goodFight');
 m.phase='matchOver';for(let i=0;i<120;i++)a.advance();a.message(q.c,{type:'gesture',gesture:'wellPlayed'});assert.equal(p.last('gesture').gesture,'wellPlayed');a.message(r.c,{type:'gesture',gesture:'wellPlayed'});assert.ok(r.last('socialError'));a.close();
});

test('saved profile names validate authentication and preserve player identity and rating',async()=>{
 const {createOnlineServer}=await import('../apps/server/index.js');const app=createOnlineServer({port:0,host:'127.0.0.1'});await app.listen();const base=`http://127.0.0.1:${app.server.address().port}`;
 try{
  const created=await (await fetch(base+'/api/identity',{method:'POST',body:JSON.stringify({name:'Silent'})})).json();const headers={Authorization:`Bearer ${created.token}`};
  assert.equal((await fetch(base+'/api/me',{method:'POST',body:JSON.stringify({name:'Imposter'})})).status,401);
  assert.equal((await fetch(base+'/api/me',{headers,method:'POST',body:JSON.stringify({name:'<bad>'})})).status,400);
  assert.equal((await fetch(base+'/api/me',{headers,method:'POST',body:JSON.stringify({name:'Silent Prime'})})).status,200);
  const data=await (await fetch(base+'/api/me',{headers})).json();assert.equal(data.player.name,'Silent Prime');assert.equal(data.player.id,created.player.id);assert.equal(data.player.rating,created.player.rating);
 }finally{await app.close();}
});
