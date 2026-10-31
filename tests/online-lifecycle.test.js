import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PROTOCOL_VERSION,RULES_VERSION} from '../packages/network/protocol.js';
import {ensureIdentity} from '../apps/web/arena-api.js';

// Run the actual browser client with its native-module URLs resolved for Node.
const root=new URL('../',import.meta.url).href;
const source=(await readFile(new URL('../apps/web/online.js',import.meta.url),'utf8'))
 .replaceAll("from './packages/",`from '${root}packages/`)
 .replace("from './arena-api.js'",`from '${root}apps/web/arena-api.js'`);
const {createOnline}=await import('data:text/javascript,'+encodeURIComponent(source+'\n//# sourceURL=online-client.test-module.js'));
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
async function setup(t,{identity=async()=> 'test-profile',delayedClose=false}={}){
 const fields=new Map();
 for(const id of ['online-status','player-name','online-server','online-cancel','online-leave','online-queue'])fields.set('#'+id,Object.assign(new EventTarget(),{value:'',hidden:false,disabled:false,textContent:''}));
 fields.get('#online-server').value='https://arena.example';fields.get('#online-queue').value='casual';
 const storage=new Map(),saved=new Map();let client;
 for(const [key,value]of Object.entries({document:{querySelector:s=>fields.get(s)},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,v)},location:{protocol:'https:',host:'arena.example'},fetch:async()=>({ok:true,json:async()=>({url:'https://arena.example'})})})){
  saved.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{configurable:true,writable:true,value});
 }
 t.after(()=>{client?.reset();for(const [key,descriptor]of saved)if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];});
 const sockets=[],ended=[],states=[];let clock=100,identityCalls=0;
 class Socket extends EventTarget{
  static OPEN=1;static CLOSED=3;readyState=0;sent=[];
  constructor(url){super();this.url=url;sockets.push(this);}
  send(text){this.sent.push(JSON.parse(text));}
  open(){this.readyState=1;this.dispatchEvent(new Event('open'));}
  message(value){this.dispatchEvent(new MessageEvent('message',{data:JSON.stringify(value)}));}
  ackClose(){this.readyState=3;this.dispatchEvent(new Event('close'));}
  close(){this.readyState=2;if(!delayedClose)this.ackClose();}
 }
 client=createOnline({getProfile:()=>({character:'silent',weapon:'tachi'}),onState:m=>states.push(m),onEnd:m=>ended.push(m)},
 {identity:(...args)=>{identityCalls++;return identity(...args);},resolveBase:async()=> 'https://arena.example',Socket,now:()=>clock});
 fields.get('#player-name').value='Silent';await flush();
 return {client,sockets,fields,ended,states,storage,Socket,get identityCalls(){return identityCalls;},setClock:n=>{clock=n;},hello:s=>{s.open();s.message({type:'hello',protocol:PROTOCOL_VERSION,rules:RULES_VERSION});}};
}
function unlocked(f){assert.equal(f.client.busy,false);assert.equal(f.fields.get('#player-name').disabled,false);assert.equal(f.fields.get('#online-server').disabled,false);assert.equal(f.fields.get('#online-cancel').hidden,true);}

test('cancel during slow profile loading cannot open a late socket',async t=>{
 const identity=deferred(),f=await setup(t,{identity:()=>identity.promise});const join=f.client.join();await flush();
 assert.equal(f.client.busy,true);assert.equal(f.fields.get('#online-cancel').hidden,false);
 f.client.leave();unlocked(f);identity.resolve('profile');await join;
 assert.equal(f.sockets.length,0);assert.equal(f.ended.length,1);
});
test('duplicate joins share one attempt; reset invalidates late identity errors',async t=>{
 const identity=deferred(),f=await setup(t,{identity:()=>identity.promise});const join=f.client.join();await f.client.join();await flush();assert.equal(f.identityCalls,1);
 f.client.reset();identity.reject(Error('late failure'));await join;
 unlocked(f);assert.equal(f.ended.length,0);assert.equal(f.sockets.length,0);
});
test('identity failure restores controls and a retry joins with captured queue settings',async t=>{
 let fail=true;const f=await setup(t,{identity:async()=>{if(fail)throw Error('Profile service unavailable');return 'profile';}});
 await f.client.join();unlocked(f);assert.match(f.ended[0],/Profile service/);
 fail=false;f.fields.get('#online-queue').value='ranked';await f.client.join();f.fields.get('#online-queue').value='casual';f.hello(f.sockets[0]);
 assert.equal(f.sockets[0].sent[0].queue,'ranked');assert.equal(f.sockets[0].sent[0].token,'profile');
});
test('connection budget includes stalled identity work and ignores its late completion',async t=>{
 t.mock.timers.enable({apis:['setTimeout','setInterval']});const identity=deferred(),f=await setup(t,{identity:()=>identity.promise});const join=f.client.join();await flush();
 t.mock.timers.tick(15000);unlocked(f);assert.match(f.ended[0],/timed out/);identity.resolve('profile');await join;assert.equal(f.sockets.length,0);
});
test('an unacknowledged old socket blocks retries without leaving controls disabled',async t=>{
 t.mock.timers.enable({apis:['setTimeout','setInterval']});const f=await setup(t,{delayedClose:true});await f.client.join();const old=f.sockets[0];f.hello(old);old.message({type:'queued',position:1});f.client.leave();
 const retry=f.client.join();await flush();t.mock.timers.tick(10000);await retry;
 unlocked(f);assert.equal(f.sockets.length,1);assert.match(f.ended.at(-1),/still closing/);
 old.ackClose();await f.client.join();assert.equal(f.sockets.length,2);
 old.message({type:'matched',slot:1,phase:'playing'});assert.equal(f.states.length,0);
 f.sockets[1].ackClose();
});
test('socket errors finish once and clear quality; malformed messages do not crash',async t=>{
 const f=await setup(t);await f.client.join();const s=f.sockets[0];f.hello(s);
 s.message(null);s.message('junk');s.message({type:'pong',sent:80});assert.equal(f.client.latency,20);
 s.message({type:'pong',sent:Infinity});assert.equal(f.client.latency,20);
 s.dispatchEvent(new Event('error'));unlocked(f);assert.equal(f.ended.length,1);assert.equal(f.client.latency,null);assert.equal(f.client.quality.label,'Measuring');
 s.message({type:'queued',position:1});assert.equal(f.client.phase,'idle');
});
test('heartbeat loss unlocks requeue and never promises in-match reconnection',async t=>{
 t.mock.timers.enable({apis:['setTimeout','setInterval']});const f=await setup(t);await f.client.join();const s=f.sockets[0];f.hello(s);s.message({type:'queued',position:1});
 f.setClock(13101);t.mock.timers.tick(3000);unlocked(f);assert.match(f.ended[0],/cannot be resumed/);
});
test('concurrent guest identity requests cannot overwrite each other; failures allow retry',async t=>{
 const f=await setup(t),gate=deferred();let calls=0;
 globalThis.fetch=async()=>{calls++;return gate.promise;};
 const a=ensureIdentity('Silent','https://unique.example'),b=ensureIdentity('Silent','https://unique.example');assert.equal(a,b);
 gate.resolve({ok:true,json:async()=>({token:'one-profile'})});assert.equal(await a,'one-profile');assert.equal(await b,'one-profile');assert.equal(calls,1);
 assert.equal(f.storage.get('shinobi.profile.v1.https://unique.example'),'one-profile');
 globalThis.fetch=async()=>{throw Error('offline');};await assert.rejects(ensureIdentity('Silent','https://retry.example'));
 globalThis.fetch=async()=>({ok:true,json:async()=>({token:'retry-profile'})});assert.equal(await ensureIdentity('Silent','https://retry.example'),'retry-profile');
});
