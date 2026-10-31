import test from 'node:test';import assert from 'node:assert/strict';
import {startDiscord} from '../apps/web/discord-account.js';
const base='https://arena.example',oldToken='g'.repeat(43),newToken='s'.repeat(43),flush=()=>new Promise(r=>setImmediate(r));
async function setup(t,{conflict=false,blocked=false,busy=false}={}){
 t.mock.timers.enable({apis:['setTimeout','setInterval']});
 const events=new EventTarget(),storage=new Map([['shinobi.profile.v1.'+base,oldToken]]),calls=[],errors=[],done=[],saved=new Map();
 const popup={closed:false,location:{href:'about:blank'},close(){this.closed=true;}};
 const win={addEventListener:(...a)=>events.addEventListener(...a),removeEventListener:(...a)=>events.removeEventListener(...a),open:()=>blocked?null:popup};
 const fakeFetch=async(url,options)=>{
  calls.push({url,options});
  if(url.endsWith('/start'))return {ok:true,json:async()=>({flow:'test-flow',url:base+'/auth/discord/authorize?flow=test-flow'})};
  if(url.endsWith('/complete'))return {ok:!conflict,json:async()=>conflict?{error:'No progress was changed.'}:{token:newToken,player:{id:'linked-id'}}};
  return {ok:true,json:async()=>({player:{id:'linked-id'}})};
 };
 for(const [key,value]of Object.entries({window:win,localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},fetch:fakeFetch})){
  saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});
 }
 t.after(()=>{popup.closed=true;t.mock.timers.tick(1000);for(const [key,d]of saved)if(d)Object.defineProperty(globalThis,key,d);else delete globalThis[key];});
 const start=()=>startDiscord({base,mode:'link',isBusy:()=>busy,onError:m=>errors.push(m),onDone:p=>done.push(p)});
 const message=(overrides={})=>{const event=new Event('message');Object.assign(event,{source:popup,origin:base,data:{type:'fabled-discord',flow:'test-flow',proof:'proof'},...overrides});events.dispatchEvent(event);};
 return {popup,storage,calls,errors,done,start,message};
}
test('only matching popup, origin and flow can finish sign-in and replace a credential',async t=>{
 const f=await setup(t);f.start();await flush();assert.match(f.popup.location.href,/auth\/discord\/authorize/);
 for(const override of [{source:{}},{origin:'https://evil.example'},{data:{type:'fabled-discord',flow:'wrong',proof:'proof'}}])f.message(override);
 await flush();assert.equal(f.calls.filter(c=>c.url.endsWith('/complete')).length,0);assert.equal(f.storage.get('shinobi.profile.v1.'+base),oldToken);
 f.message();await flush();await flush();assert.equal(f.storage.get('shinobi.profile.v1.'+base),newToken);assert.equal(f.done[0].id,'linked-id');assert.equal(f.popup.closed,true);assert.deepEqual(f.errors,[]);
 const request=JSON.parse(f.calls.find(c=>c.url.endsWith('/complete')).options.body);assert.equal(request.requestKey.length,43);
});
test('conflicting profiles preserve the original browser credential',async t=>{
 const f=await setup(t,{conflict:true});f.start();await flush();f.message();await flush();assert.equal(f.storage.get('shinobi.profile.v1.'+base),oldToken);assert.deepEqual(f.done,[]);assert.match(f.errors[0],/No progress/);
});
test('profile changes during authorization prevent stale account replacement',async t=>{
 const f=await setup(t);f.start();await flush();f.storage.set('shinobi.profile.v1.'+base,'x'.repeat(43));f.message();await flush();assert.equal(f.calls.filter(c=>c.url.endsWith('/complete')).length,0);assert.match(f.errors[0],/profile or match changed/);
});
test('active matches and blocked popups do not begin authorization',async t=>{
 const f=await setup(t,{busy:true});f.start();assert.equal(f.calls.length,0);assert.match(f.errors[0],/Leave your match/);
});
test('blocked popups show a useful retry message',async t=>{
 const f=await setup(t,{blocked:true});f.start();assert.equal(f.calls.length,0);assert.match(f.errors[0],/Allow popups/);
});
