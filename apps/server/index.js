import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {WebSocketServer,WebSocket} from 'ws';
import {createArena} from './arena.js';
export function createOnlineServer({origins=[],port=Number(process.env.PORT||4175),host='0.0.0.0',...arenaOptions}={}){
 const root=resolve('dist'),arena=createArena(arenaOptions),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.jpg':'image/jpeg'};
 const server=createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.url==='/health'){res.writeHead(200,{'Content-Type':'application/json'}).end(JSON.stringify({ok:true,...arena.stats()}));return;}
  if(req.url==='/online-config.json'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'}).end('{"sameOrigin":true}');return;}
  try{
   const url=new URL(req.url,'http://localhost'),path=resolve(root,`.${url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname}`);
   if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}
   res.writeHead(200,{'Content-Type':types[extname(path)]??'application/octet-stream','Cache-Control':'no-cache'}).end(await readFile(path));
  }catch{res.writeHead(404).end('Not found');}
 });
 const wss=new WebSocketServer({noServer:true,maxPayload:4096,perMessageDeflate:false});
 const allowed=new Set(origins);
 server.on('upgrade',(req,socket,head)=>{
  const sameOrigin=req.headers.origin===`https://${req.headers.host}`||req.headers.origin===`http://${req.headers.host}`;
  if(req.url!=='/ws'||(!sameOrigin&&!allowed.has(req.headers.origin))||arena.stats().connections>=200){socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');socket.destroy();return;}
  wss.handleUpgrade(req,socket,head,ws=>wss.emit('connection',ws,req));
 });
 wss.on('connection',ws=>{
  let alive=true;
  const client=arena.connect(value=>{if(ws.readyState!==WebSocket.OPEN)return;if(ws.bufferedAmount>256*1024){ws.terminate();return;}ws.send(JSON.stringify(value));});
  if(!client){ws.close(1013,'Server full');return;}
  ws.on('message',data=>{try{arena.message(client,JSON.parse(data.toString()));if(client.closed)ws.close(1008,'Rate limit exceeded');}catch{ws.close(1008,'Invalid JSON');}});
  ws.on('pong',()=>{alive=true;});
  const handshakeTimeout=setTimeout(()=>{if(!client.profile)ws.close(1008,'Join timeout');},30000);handshakeTimeout.unref();
  const heartbeat=setInterval(()=>{if(!alive){ws.terminate();return;}alive=false;ws.ping();},10000);heartbeat.unref();
  ws.on('error',()=>{});ws.on('close',()=>{clearInterval(heartbeat);clearTimeout(handshakeTimeout);arena.disconnect(client);});
 });
 // Fixed simulation steps, bounded catch-up, no client-provided time or HP.
 let last=performance.now(),accumulator=0;
 const timer=setInterval(()=>{const now=performance.now();accumulator+=Math.min(now-last,100);last=now;while(accumulator>=1000/60){arena.advance();accumulator-=1000/60;}},4);timer.unref();
 return {server,arena,listen:()=>new Promise(r=>server.listen(port,host,r)),close:()=>new Promise(r=>{clearInterval(timer);arena.close();for(const ws of wss.clients)ws.close(1001,'Server shutting down');wss.close();server.close(r);setTimeout(()=>{for(const ws of wss.clients)ws.terminate();},100).unref();})};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const app=createOnlineServer({origins:(process.env.ALLOWED_ORIGINS||'https://driaque.github.io').split(',').map(s=>s.trim())});
 await app.listen();console.log(`Online arena listening on ${app.server.address().port}`);
 const shutdown=()=>{app.close().then(()=>process.exit(0));};process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
}
