import {test} from 'node:test';
import assert from 'node:assert/strict';
import {setup,createApi,botPermissions,sections,overwrites} from '../scripts/setup-discord-community.mjs';
const guild='111111111111111111',bot='222222222222222222';
function fake(){
 let next=333333333333333333n;
 const state={writes:[],roles:[{id:guild,name:'@everyone',permissions:'0',position:0},{id:'bot-role',name:'Bot',permissions:String(botPermissions),position:10}],channels:[],messages:[]};
 const api=async(method,path,body)=>{
  if(method==='GET'){
   if(path===`/guilds/${guild}`)return {name:'FabledRivals'};
   if(path==='/users/@me')return {id:bot,bot:true};
   if(path.includes('/members/'))return {roles:['bot-role']};
   if(path.endsWith('/roles'))return structuredClone(state.roles);
   if(path.endsWith('/channels'))return structuredClone(state.channels);
   if(path.includes('messages?'))return state.messages.filter(m=>m.channel_id===path.split('/')[2]);
   if(path.includes('/messages/'))return state.messages.find(m=>m.id===path.split('/').at(-1));
  }
  state.writes.push({method,path,body});
  if(method==='POST'){
   const item={...structuredClone(body),id:String(next++)};
   if(path.endsWith('/roles')){item.position=1;state.roles.push(item);}
   else if(path.endsWith('/channels'))state.channels.push(item);
   else if(path.endsWith('/messages')){item.author={id:bot};item.channel_id=path.split('/')[2];state.messages.push(item);}
   else throw Error('Unexpected POST '+path);
   return item;
  }
  if(method==='PATCH'){const channel=state.channels.find(c=>c.id===path.split('/')[2]);Object.assign(channel,body);return channel;}
  throw Error('Unexpected request '+method+' '+path);
 };
 return {api,state};
}
test('creates structure once, suppresses pings, keeps staff private, and survives reruns',async()=>{
 const {api,state}=fake();await setup(api,guild,{log:()=>{}});
 assert.equal(state.channels.length,sections.length+sections.flatMap(s=>s.channels).length);
 assert.equal(state.roles.length,6);
 const staff=state.channels.find(c=>c.name==='STAFF');assert.equal(staff.permission_overwrites[0].deny,'1024');
 const news=state.channels.find(c=>c.name==='announcements');assert.ok(BigInt(news.permission_overwrites[0].deny)&2048n);
 assert.ok(state.messages.length>10);for(const m of state.messages)assert.deepEqual(m.allowed_mentions,{parse:[]});
 const writes=state.writes.length;await setup(api,guild,{log:()=>{}});assert.equal(state.writes.length,writes);
});
test('refuses insufficient permissions and duplicate names before writing',async()=>{
 let {api,state}=fake();state.roles[1].permissions='0';await assert.rejects(setup(api,guild),/lacks/);assert.equal(state.writes.length,0);
 ({api,state}=fake());state.channels.push({name:'rules'},{name:'rules'});await assert.rejects(setup(api,guild),/Ambiguous/);assert.equal(state.writes.length,0);
});
test('leaves conflicting existing permissions unchanged',async()=>{
 const {api,state}=fake();await setup(api,guild,{log:()=>{}});const staff=state.channels.find(c=>c.name==='STAFF');staff.permission_overwrites=[];const before=state.writes.length;
 await assert.rejects(setup(api,guild,{log:()=>{}}),/differs/);assert.equal(state.writes.length,before);assert.deepEqual(staff.permission_overwrites,[]);
});
test('rejects unexpected server and malformed ID without writes',async()=>{
 const {api,state}=fake();await assert.rejects(setup(api,'bad'),/server ID/);
 await assert.rejects(setup(async(m,p,b)=>p===`/guilds/${guild}`?{name:'Other server'}:api(m,p,b),guild),/not named/);assert.equal(state.writes.length,0);
});
test('rate limits respect retry_after and secrets never appear in HTTP errors',async()=>{
 const delays=[];let calls=0;
 const api=createApi('secret-token',{wait:async ms=>delays.push(ms),request:async()=>++calls===1?{status:429,json:async()=>({retry_after:0.5})}:{status:200,ok:true,headers:new Headers(),json:async()=>({ok:true})}});
 assert.deepEqual(await api('GET','/users/@me'),{ok:true});assert.deepEqual(delays,[600]);
 const denied=createApi('secret-token',{request:async()=>({status:403,ok:false})});await assert.rejects(denied('POST','/guilds/123/roles',{}),e=>!e.message.includes('secret-token')&&e.message.includes('403'));
});
test('public read-only channels deny thread and direct posting; bot can still post',()=>{
 const rules=overwrites(guild,bot,'moderator',{readonly:true});assert.ok(BigInt(rules[0].deny)&(1n<<38n));assert.ok(BigInt(rules[1].allow)&2048n);
});
