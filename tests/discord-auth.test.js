import test from 'node:test';import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createDiscordAuth} from '../apps/server/discord-auth.js';
const requestKey='r'.repeat(43),origin='https://arena.example';
function fixture({mode='signin',playerId=null}={}){
 let clock=1000;const calls=[],connections=[];
 const auth=createDiscordAuth({clientId:'123456789012345678',clientSecret:'test-client-secret',publicOrigin:origin,now:()=>clock,request:async(url,options)=>{
  calls.push({url,options});return {ok:true,json:async()=>url.includes('/oauth2/token')?{access_token:'test-access-token',refresh_token:'test-refresh-token',token_type:'Bearer',scope:'identify'}:{id:'111111111111111111',username:'Tester'}};
 }});
 const start=()=>auth.start({mode,playerId,requestKey,returnOrigin:origin});
 const callback=async(started)=>{const redirect=auth.authorize(started.flow);const params=new URLSearchParams({state:started.flow,code:'test-code',iss:'https://discord.com'});return auth.callback(params,redirect.cookie.split(';')[0]);};
 const accounts={connect:async(user,opts)=>{connections.push({user,opts});return {token:'game-session'};}};
 const payload=html=>JSON.parse(html.body.match(/postMessage\((\{.*?\}),/)[1]);
 return {auth,calls,connections,start,callback,accounts,payload,setClock:n=>clock=n};
}
test('authorization uses minimal scope, state and S256; the provider secret and tokens stay server-side',async()=>{
 const f=fixture(),start=f.start(),redirect=f.auth.authorize(start.flow),url=new URL(redirect.url);
 assert.equal(url.searchParams.get('scope'),'identify');assert.equal(url.searchParams.get('code_challenge_method'),'S256');assert.equal(url.searchParams.get('state'),start.flow);assert.match(redirect.cookie,/HttpOnly; SameSite=Lax/);assert.match(redirect.cookie,/Secure/);
 const result=await f.auth.callback(new URLSearchParams({state:start.flow,code:'test-code',iss:'https://discord.com'}),redirect.cookie.split(';')[0]);
 const form=f.calls[0].options.body;assert.equal(form.get('redirect_uri'),origin+'/auth/discord/callback');assert.equal(createHash('sha256').update(form.get('code_verifier')).digest('base64url'),url.searchParams.get('code_challenge'));
 assert.equal(form.get('client_secret'),'test-client-secret');assert.equal(f.calls[1].options.headers.Authorization,'Bearer test-access-token');
 assert.match(f.calls[0].options.headers['User-Agent'],/^DiscordBot \(https:\/\/github.com\/Driaque\/shinobi-arena, [\d.]+\)$/);assert.equal(f.calls[1].options.headers['User-Agent'],f.calls[0].options.headers['User-Agent']);
 const output=JSON.stringify({start,result});for(const secret of ['test-access-token','test-refresh-token','test-client-secret'])assert.equal(output.includes(secret),false);
 const payload=f.payload(result.html);assert.equal(payload.flow,start.flow);assert.ok(payload.proof);assert.equal(f.connections.length,0,'callback cannot link or sign in without browser confirmation');
});
test('callback is browser-bound, expires, rejects issuer mismatches and is single-use',async()=>{
 const f=fixture(),start=f.start(),redirect=f.auth.authorize(start.flow),params=new URLSearchParams({state:start.flow,code:'test-code',iss:'https://discord.com'});
 await assert.rejects(f.auth.callback(params,''),/browser verification/);assert.equal(f.calls.length,0);
 await f.auth.callback(params,redirect.cookie.split(';')[0]);await assert.rejects(f.auth.callback(params,redirect.cookie.split(';')[0]),/already used/);
 const second=f.start(),r=f.auth.authorize(second.flow);await assert.rejects(f.auth.callback(new URLSearchParams({state:second.flow,code:'test-code',iss:'https://evil.example'}),r.cookie.split(';')[0]),/Invalid Discord/);assert.equal(f.calls.length,2);
 const third=f.start();f.setClock(601001);assert.throws(()=>f.auth.authorize(third.flow),/expired/);
});
test('proof redemption requires request secret, return origin and original linked player',async()=>{
 const f=fixture({mode:'link',playerId:'guest-id'}),start=f.start(),result=await f.callback(start),payload=f.payload(result.html);
 const data={...payload,requestKey,returnOrigin:origin,playerId:'guest-id'};
 for(const patch of [{requestKey:'x'.repeat(43)},{returnOrigin:'https://evil.example'},{playerId:'different-id'}])await assert.rejects(f.auth.complete({...data,...patch},f.accounts));
 assert.deepEqual(await f.auth.complete(data,f.accounts),{token:'game-session'});assert.equal(f.connections[0].opts.playerId,'guest-id');
 await assert.rejects(f.auth.complete(data,f.accounts));assert.equal(f.connections.length,1);
});
test('denial and expired proofs never create account sessions',async()=>{
 const f=fixture(),start=f.start(),r=f.auth.authorize(start.flow);
 const denied=await f.auth.callback(new URLSearchParams({state:start.flow,error:'access_denied'}),r.cookie.split(';')[0]);assert.match(f.payload(denied.html).error,/cancelled/);assert.equal(f.calls.length,0);
 const next=f.start(),result=await f.callback(next),payload=f.payload(result.html);f.setClock(61001);
 await assert.rejects(f.auth.complete({...payload,requestKey,returnOrigin:origin},f.accounts));assert.equal(f.connections.length,0);
});
test('disabled configuration and anonymous linking fail safely',()=>{
 // Explicitly disable the fixture even when a deploy build has production OAuth env vars.
 const disabled=createDiscordAuth({clientId:null,clientSecret:null,publicOrigin:null});assert.equal(disabled.enabled,false);assert.throws(()=>disabled.start({}),/not configured/);
 const f=fixture();assert.throws(()=>f.auth.start({mode:'link',requestKey,returnOrigin:origin}),/Restore your player profile/);
});
test('provider errors are sanitized and cannot be replayed',async()=>{
 const auth=createDiscordAuth({clientId:'123456789012345678',clientSecret:'secret',publicOrigin:origin,request:async()=>{throw Error('private-provider-token');}});
 const start=auth.start({mode:'signin',requestKey,returnOrigin:origin}),r=auth.authorize(start.flow),params=new URLSearchParams({state:start.flow,code:'code',iss:'https://discord.com'});
 await assert.rejects(auth.callback(params,r.cookie.split(';')[0]),e=>e.status===502&&!e.message.includes('private-provider-token'));
 await assert.rejects(auth.callback(params,r.cookie.split(';')[0]),/already used/);
});
test('provider diagnostics expose only stage, HTTP status and timeout, never response bodies or credentials',async()=>{
 for(const failure of ['token','profile','timeout']){
  const diagnostics=[];
  const auth=createDiscordAuth({clientId:'123456789012345678',clientSecret:'private-client-secret',publicOrigin:origin,onFailure:value=>diagnostics.push(value),request:async url=>{
   if(failure==='timeout')throw Object.assign(Error('private-code'),{name:'TimeoutError'});
   if(failure==='token'||url.endsWith('/users/@me'))return {ok:false,status:failure==='token'?400:403,json:async()=>({error:'private-response-body'})};
   return {ok:true,status:200,json:async()=>({access_token:'private-access-token',token_type:'Bearer',scope:'identify'})};
  }});
  const start=auth.start({mode:'signin',requestKey,returnOrigin:origin}),r=auth.authorize(start.flow);
  await assert.rejects(auth.callback(new URLSearchParams({state:start.flow,code:'private-code',iss:'https://discord.com'}),r.cookie.split(';')[0]),/could not verify/);
  assert.deepEqual(diagnostics,[{stage:failure==='profile'?'profile_request':'token_request',status:failure==='timeout'?null:failure==='token'?400:403,timeout:failure==='timeout'}]);
  assert.equal(JSON.stringify(diagnostics).includes('private'),false);
 }
});
