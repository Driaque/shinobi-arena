import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,sep,extname,dirname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {WebSocketServer,WebSocket} from 'ws';
import {createArena} from './arena.js';
import {createStore} from './store.js';
import {playerProfile} from '../../packages/network/protocol.js';
export function createOnlineServer({origins=[],port=Number(process.env.PORT||4175),host='0.0.0.0',staticDirectory='dist',store:providedStore,storeOptions={},storageExpiresAt=process.env.STORAGE_EXPIRES_AT??null,...arenaOptions}={}){
 const storeReady=providedStore?Promise.resolve(providedStore):createStore(storeOptions);let storageHealthy=true;
 const pending=new Map();
 function persist(record){if(pending.size>=100){storageHealthy=false;console.error('Result persistence backlog is full');return;}pending.set(record.id,{record,running:false});flush();}
 async function flush(){for(const [id,job]of pending){if(job.running)continue;job.running=true;try{const store=await storeReady;await store.save(job.record);pending.delete(id);storageHealthy=pending.size===0;}catch(e){job.running=false;storageHealthy=false;console.error('Result persistence failed:',e.code??e.name);}}}
 const retry=setInterval(flush,5000);retry.unref();
 const root=resolve(staticDirectory),arena=createArena({...arenaOptions,onResult:record=>{arenaOptions.onResult?.(record);persist(record);}}),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.jpg':'image/jpeg'};
 const allowed=new Set(origins),budgets=new Map();
 const trusted=req=>!req.headers.origin||req.headers.origin===`https://${req.headers.host}`||req.headers.origin===`http://${req.headers.host}`||allowed.has(req.headers.origin);
 const reply=(res,status,value)=>{if(!res.destroyed)res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'}).end(JSON.stringify(value));};
 const paging=url=>({offset:Math.max(0,Math.min(10000,Number(url.searchParams.get('offset'))||0))|0,limit:Math.max(1,Math.min(50,Number(url.searchParams.get('limit'))||20))|0});
 async function body(req){let text='';for await(const chunk of req){text+=chunk;if(Buffer.byteLength(text)>4096)throw new Error('Request is too large');}return JSON.parse(text||'{}');}
 const server=createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');const url=new URL(req.url,'http://localhost');
  if(trusted(req)&&req.headers.origin){res.setHeader('Access-Control-Allow-Origin',req.headers.origin);res.setHeader('Vary','Origin');}
  if(url.pathname.startsWith('/api/')){
   if(!trusted(req)){reply(res,403,{error:'Origin is not allowed'});return;}
   if(req.method==='OPTIONS'){res.writeHead(204,{'Access-Control-Allow-Headers':'Authorization, Content-Type','Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Max-Age':'600'}).end();return;}
   try{
    const store=await storeReady;
    if(req.method==='GET'&&url.pathname==='/api/status'){reply(res,200,{storage:store.kind,durable:store.durable,rankedAvailable:store.durable&&storageHealthy,expiresAt:storageExpiresAt,replayRetentionDays:14,maxReplays:200});return;}
    if(req.method==='GET'&&url.pathname==='/api/live'){reply(res,200,{matches:arena.list()});return;}
    if(req.method==='GET'&&url.pathname==='/api/leaderboard'){reply(res,200,{players:await store.leaderboard(paging(url))});return;}
    if(req.method==='GET'&&url.pathname==='/api/history'){reply(res,200,{matches:await store.history(paging(url))});return;}
    if(req.method==='GET'&&url.pathname.startsWith('/api/replays/')){const id=url.pathname.slice('/api/replays/'.length);if(!/^[a-f0-9-]{36}$/.test(id)){reply(res,400,{error:'Invalid replay ID'});return;}const archive=await store.replay(id);if(!archive){reply(res,404,{error:'Replay has expired or was not found'});return;}res.writeHead(200,{'Content-Type':'application/json','Content-Encoding':'gzip','Cache-Control':'no-store'}).end(archive);return;}
    if(req.method==='POST'&&url.pathname==='/api/identity'){
     const ip=req.socket.remoteAddress,at=Date.now();if(budgets.size>1000)for(const [key,b]of budgets)if(at-b.at>3600000)budgets.delete(key);const b=budgets.get(ip)??{at,n:0};if(at-b.at>3600000){b.at=at;b.n=0;}budgets.set(ip,b);if(++b.n>30){reply(res,429,{error:'Too many new profiles. Restore your existing profile or try later.'});return;}
     const value=await body(req);let profile;try{profile=playerProfile({name:value.name,character:'naruto',weapon:'kunai'});}catch(e){reply(res,400,{error:e.message});return;}reply(res,201,await store.createIdentity(profile.name));return;
    }
    if(req.method==='GET'&&url.pathname==='/api/me'){const player=await store.identity(req.headers.authorization?.replace(/^Bearer /,''));if(!player){reply(res,401,{error:'Restore or create your player profile'});return;}reply(res,200,{player,matches:await store.history({...paging(url),playerId:player.id})});return;}
    reply(res,404,{error:'Unknown endpoint'});
   }catch(e){console.error('Arena API failed:',e.code??e.name);reply(res,e instanceof SyntaxError||e.message==='Request is too large'?400:503,{error:e instanceof SyntaxError?'Invalid JSON':'Service is temporarily unavailable'});}return;
  }
  if(url.pathname==='/health'){res.writeHead(200,{'Content-Type':'application/json'}).end(JSON.stringify({ok:true,...arena.stats(),storageHealthy,pendingResults:pending.size}));return;}
  if(url.pathname==='/online-config.json'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'}).end('{"sameOrigin":true}');return;}
  try{
   const path=resolve(root,`.${url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname}`);if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}
   const data=await readFile(path);if(!res.destroyed)res.writeHead(200,{'Content-Type':types[extname(path)]??'application/octet-stream','Cache-Control':'no-cache'}).end(data);
  }catch(error){if(res.destroyed)return;if(res.headersSent){res.destroy();return;}const missing=['ENOENT','ENOTDIR','EISDIR'].includes(error.code);if(!missing)console.error('Static file request failed:',error.code??error.name);res.writeHead(missing?404:500,{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}).end(missing?'Not found':'Unable to serve this file');}
 });
 const wss=new WebSocketServer({noServer:true,maxPayload:8192,perMessageDeflate:false});
 server.on('upgrade',(req,socket,head)=>{if(req.url!=='/ws'||!trusted(req)||!req.headers.origin||arena.stats().connections>=200){socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');socket.destroy();return;}wss.handleUpgrade(req,socket,head,ws=>wss.emit('connection',ws,req));});
 wss.on('connection',ws=>{
  let alive=true,chain=Promise.resolve();
  const client=arena.connect(value=>{if(ws.readyState!==WebSocket.OPEN)return;if(ws.bufferedAmount>256*1024){ws.terminate();return;}ws.send(JSON.stringify(value));});if(!client){ws.close(1013,'Server full');return;}
  ws.on('message',data=>{chain=chain.then(async()=>{try{const msg=JSON.parse(data.toString());if(msg.type==='join'){
    const store=await storeReady;if(msg.queue==='ranked'&&(!store.durable||!storageHealthy))throw new Error('Ranked storage is temporarily unavailable. Casual play is available.');
    if(msg.token){const identity=await store.identity(msg.token);if(!identity)throw new Error('Player profile expired. Restore or create a profile.');client.playerId=identity.id;const profile=playerProfile(msg.profile);await store.rename(identity.id,profile.name);}
   }arena.message(client,msg);if(client.closed)ws.close(1008,'Rate limit exceeded');}catch(e){if(e instanceof SyntaxError)ws.close(1008,'Invalid JSON');else if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify({type:'error',message:e.message?.startsWith('Player profile')||e.message?.startsWith('Ranked storage')?e.message:'Unable to join. Check your profile and loadout.'}));}});});
  ws.on('pong',()=>{alive=true;});const handshakeTimeout=setTimeout(()=>{if(!client.profile&&!client.spectating)ws.close(1008,'Join timeout');},30000);handshakeTimeout.unref();const heartbeat=setInterval(()=>{if(!alive){ws.terminate();return;}alive=false;ws.ping();},10000);heartbeat.unref();
  ws.on('error',()=>{});ws.on('close',()=>{clearInterval(heartbeat);clearTimeout(handshakeTimeout);arena.disconnect(client);});
 });
 let last=performance.now(),accumulator=0;const timer=setInterval(()=>{const current=performance.now();accumulator+=Math.min(current-last,100);last=current;while(accumulator>=1000/60){arena.advance();accumulator-=1000/60;}},4);timer.unref();
 return {server,arena,storeReady,flushResults:flush,listen:async()=>{await storeReady;return new Promise(r=>server.listen(port,host,r));},close:async()=>{clearInterval(timer);clearInterval(retry);arena.close();for(const ws of wss.clients)ws.close(1001,'Server shutting down');const closing=new Promise(r=>{wss.close();server.close(r);setTimeout(()=>{for(const ws of wss.clients)ws.terminate();},100).unref();});await flush();const store=await storeReady;await store.close();await closing;}};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 if(process.env.RENDER&&!process.env.DATABASE_URL)throw new Error('DATABASE_URL is required on Render for persistent arena history');
 const filename=process.env.ARENA_DB_FILE||'data/arena.sqlite';if(!process.env.DATABASE_URL)await mkdir(dirname(resolve(filename)),{recursive:true});
 const app=createOnlineServer({origins:(process.env.ALLOWED_ORIGINS||'https://driaque.github.io').split(',').map(s=>s.trim()),storeOptions:{filename}});await app.listen();console.log(`Online arena listening on ${app.server.address().port}`);const shutdown=()=>{app.close().then(()=>process.exit(0));};process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
}
