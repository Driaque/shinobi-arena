import test from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {WebSocket} from 'ws';import {createOnlineServer} from '../apps/server/index.js';
import {PROTOCOL_VERSION,RULES_VERSION} from '../packages/network/protocol.js';
const origin='http://127.0.0.1:4199',requestKey='a'.repeat(43);
async function setup(t){
 const dir=await mkdtemp(join(tmpdir(),'fr-discord-http-'));
 const app=createOnlineServer({host:'127.0.0.1',port:0,origins:[origin],storeOptions:{filename:join(dir,'profiles.sqlite')},discordOptions:{publicOrigin:origin,clientId:'123456789012345678',clientSecret:'test-secret',request:async(url)=>({ok:true,json:async()=>url.includes('/oauth2/token')?{access_token:'test-access',token_type:'Bearer',scope:'identify'}:{id:'111111111111111111',username:'Discord tester'}})}});
 await app.listen();const base='http://127.0.0.1:'+app.server.address().port;
 t.after(async()=>{await app.close();await rm(dir,{recursive:true,force:true});});
 const post=async(path,body,token)=>fetch(base+path,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});
 const finish=async(mode,token)=>{
  const start=await (await post('/api/auth/discord/start',{mode,requestKey},token)).json();assert.ok(start.flow);
  const authorize=await fetch(base+'/auth/discord/authorize?flow='+start.flow,{redirect:'manual'});assert.equal(authorize.status,302);
  const cookie=authorize.headers.get('set-cookie').split(';')[0];
  const callback=await fetch(base+'/auth/discord/callback?'+new URLSearchParams({state:start.flow,code:'test-code',iss:'https://discord.com'}),{headers:{Cookie:cookie}});assert.equal(callback.status,200);
  assert.match(callback.headers.get('content-security-policy'),/frame-ancestors 'none'/);assert.equal(callback.headers.get('referrer-policy'),'no-referrer');const html=await callback.text();assert.equal(html.includes('test-access'),false);
  const payload=JSON.parse(html.match(/postMessage\((\{.*?\}),/)[1]);
  return post('/api/auth/discord/complete',{flow:payload.flow,proof:payload.proof,requestKey},token);
 };
 return {app,base,post,finish};
}
test('HTTP linking preserves guest ID; a second browser signs into it; sessions log out independently',async t=>{
 const f=await setup(t);assert.equal((await (await fetch(f.base+'/api/status')).json()).discordAvailable,true);
 const guest=await (await f.post('/api/identity',{name:'Silent'})).json();
 const linked=await (await f.finish('link',guest.token)).json(),second=await (await f.finish('signin')).json();assert.equal(linked.player.id,guest.player.id);assert.equal(second.player.id,guest.player.id);
 const me=await (await fetch(f.base+'/api/me',{headers:{Authorization:'Bearer '+linked.token}})).json();assert.equal(me.auth.provider,'discord');assert.equal(me.auth.session,true);assert.equal(me.auth.label,'Discord tester');assert.equal(me.player.name,'Silent');
 // Session logout also closes an already-authenticated WebSocket in another tab.
 const ws=new WebSocket(f.base.replace('http:','ws:')+'/ws',{origin});t.after(()=>ws.terminate());
 await new Promise((resolve,reject)=>{ws.on('error',reject);ws.on('message',raw=>{const m=JSON.parse(raw);if(m.type==='hello')ws.send(JSON.stringify({type:'join',protocol:PROTOCOL_VERSION,rules:RULES_VERSION,profile:{name:'Silent',character:'silent',weapon:'tachi'},token:linked.token}));if(m.type==='queued')resolve();});});
 const closed=new Promise(resolve=>ws.once('close',resolve));assert.equal((await f.post('/api/auth/discord/logout',{},linked.token)).status,200);await closed;
 assert.equal((await fetch(f.base+'/api/me',{headers:{Authorization:'Bearer '+linked.token}})).status,401);
 for(const token of [second.token,guest.token])assert.equal((await fetch(f.base+'/api/me',{headers:{Authorization:'Bearer '+token}})).status,200);
 const publicData=JSON.stringify(await (await fetch(f.base+'/api/history')).json());for(const secret of [linked.token,second.token,guest.token])assert.equal(publicData.includes(secret),false);
});
test('auth POSTs reject absent and forged origins, and links require profile ownership',async t=>{
 const f=await setup(t);
 for(const headers of [{},{Origin:'http://evil.example',Host:'evil.example'}])assert.equal((await fetch(f.base+'/api/auth/discord/start',{method:'POST',headers:{'Content-Type':'application/json',...headers},body:JSON.stringify({mode:'signin',requestKey})})).status,403);
 assert.equal((await f.post('/api/auth/discord/start',{mode:'link',requestKey})).status,401);
 const first=await (await f.finish('signin')).json(),other=await (await f.post('/api/identity',{name:'Other'})).json();
 const conflict=await f.finish('link',other.token);assert.equal(conflict.status,409);assert.match((await conflict.json()).error,/No progress was changed/);
 assert.equal((await (await fetch(f.base+'/api/me',{headers:{Authorization:'Bearer '+other.token}})).json()).auth.provider,null);
 assert.equal((await (await fetch(f.base+'/api/me',{headers:{Authorization:'Bearer '+first.token}})).json()).auth.provider,'discord');
});
