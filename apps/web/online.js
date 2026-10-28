import {apiBase,ensureIdentity} from './arena-api.js';
import {PROTOCOL_VERSION,RULES_VERSION,playerProfile} from './packages/network/protocol.js';
export function createOnline({getProfile,onState,onEnd,onStatus}){
 let socket=null,generation=0,slot=0,phase='idle',seq=0,timeout,pingTimer,lastMessage=0,latency=null;
 const $=s=>document.querySelector(s),status=$('#online-status');
 const notify=text=>{status.textContent=text;onStatus?.(text);};
 try{$('#player-name').value=localStorage.getItem('shinobi-arena.player-name')||'';}catch{}
 let configured='',closing=Promise.resolve(true);
 fetch('./online-config.json',{cache:'no-store'}).then(r=>r.ok?r.json():{}).then(config=>{
  if(config.sameOrigin)configured=`${location.protocol==='https:'?'wss:':'ws:'}//${location.host}/ws`;
  else if(config.url)configured=config.url;
  if(!configured)notify('Online server not connected yet. Enter the deployed server address below to play online.');
  else if(phase==='idle')notify('Choose your fighter and weapon, then find an opponent.');
 }).catch(()=>notify('Enter the online server address below to connect.'));
 function serverURL(){
  const value=$('#online-server').value.trim()||configured;if(!value)throw new Error('Online needs its multiplayer server. Enter the deployed server address below.');
  const url=new URL(value);if(url.protocol==='https:')url.protocol='wss:';if(url.protocol==='http:')url.protocol='ws:';
  if(!['ws:','wss:'].includes(url.protocol)||url.username||url.password||url.search||url.hash)throw new Error('Use an HTTP(S) or WebSocket server address.');
  if(location.protocol==='https:'&&url.protocol!=='wss:')throw new Error('This secure page requires a secure (wss://) server.');
  if(url.pathname==='/')url.pathname='/ws';return url.href;
 }
 function cleanup(){
  clearTimeout(timeout);clearInterval(pingTimer);generation++;const old=socket;socket=null;
  if(old&&old.readyState!==WebSocket.CLOSED){
   // Cancel is processed before the close acknowledgement. Wait for that acknowledgement
   // before opening another socket, so latency cannot pair us with our old queue entry.
   closing=new Promise(resolve=>{
    const done=()=>{clearTimeout(limit);closing=Promise.resolve(true);resolve(true);};
    const limit=setTimeout(()=>resolve(false),10000);
    old.addEventListener('close',done,{once:true});
    if(old.readyState===WebSocket.OPEN)old.send(JSON.stringify({type:'cancel'}));
    old.close();
   });
  }
  $('#online-cancel').hidden=true;$('#online-leave').hidden=true;$('#player-name').disabled=false;$('#online-server').disabled=false;
  return closing;
 }
 function leave(){cleanup();phase='idle';onEnd('You left online play.');notify('Choose your fighter and find another opponent.');}
 async function join(){
  let profile,url;
  try{profile=playerProfile({...getProfile(),name:$('#player-name').value});url=serverURL();}catch(e){notify(e.message);return;}
  let token;try{token=await ensureIdentity(profile.name,await apiBase(url));}catch(e){notify(e.message);return;}
  const previousClosed=cleanup();phase='connecting';seq=0;latency=null;const current=generation;
  try{localStorage.setItem('shinobi-arena.player-name',profile.name);}catch{}
  $('#player-name').disabled=true;$('#online-server').disabled=true;$('#online-cancel').hidden=false;
  notify('Connecting to the arena…');
  const closed=await previousClosed;if(current!==generation)return;
  if(!closed){phase='idle';onEnd('Previous connection is still closing. Try again shortly.');notify('Previous connection is still closing. Try again shortly.');return;}
  const ws=socket=new WebSocket(url);
  timeout=setTimeout(()=>{if(current===generation){cleanup();phase='idle';notify('Connection timed out. Check the server address and try again.');onEnd('Unable to connect.');}},15000);
  ws.addEventListener('open',()=>{if(current!==generation)return;lastMessage=performance.now();
   pingTimer=setInterval(()=>{if(performance.now()-lastMessage>12000){cleanup();phase='idle';onEnd('Connection lost. Join the queue again.');notify('Connection lost. Join the queue again.');return;}if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify({type:'ping',sent:performance.now()}));},3000);
  });
  ws.addEventListener('message',event=>{
   if(current!==generation)return;lastMessage=performance.now();let msg;try{msg=JSON.parse(event.data);}catch{return;}
   if(msg.type==='hello'){
    if(msg.protocol!==PROTOCOL_VERSION||msg.rules!==RULES_VERSION){cleanup();phase='idle';notify('Server and game versions differ. Refresh the game.');onEnd('Version mismatch.');return;}
    ws.send(JSON.stringify({type:'join',protocol:PROTOCOL_VERSION,rules:RULES_VERSION,profile,token,queue:$('#online-queue')?.value??'casual'}));
   }else if(msg.type==='queued'){clearTimeout(timeout);phase='queued';notify(`Waiting for an opponent… Queue position ${msg.position}. You can cancel any time.`);}
   else if(msg.type==='matched'){clearTimeout(timeout);slot=msg.slot;phase=msg.phase;$('#online-cancel').hidden=true;$('#online-leave').hidden=false;onState(msg,slot);}
   else if(msg.type==='snapshot'){phase=msg.phase;onState(msg,slot);if(phase==='matchOver'){cleanup();phase='finished';}}
   else if(msg.type==='pong'){latency=Math.round(performance.now()-msg.sent);}
   else if(msg.type==='ended'){const text=msg.reason==='opponent-disconnected'||msg.reason==='opponent-left'?'Opponent left. You win by forfeit.':msg.reason==='server-shutdown'?'Server is restarting. Join again shortly.':msg.reason==='match-complete'?'Match complete. Find another opponent.':'Room expired. Join the queue again.';cleanup();phase='idle';onEnd(text);notify(text);}
   else if(msg.type==='error'){cleanup();phase='idle';onEnd(msg.message);notify(msg.message);}
  });
  ws.addEventListener('error',()=>{});
  ws.addEventListener('close',()=>{if(current!==generation)return;cleanup();phase='idle';const text='Connection closed. Check the server and join the queue again.';notify(text);onEnd(text);});
 }
 $('#online-cancel').addEventListener('click',leave);$('#online-leave').addEventListener('click',leave);
 return {join,leave,reset(){cleanup();phase='idle';},send(input){if(phase==='playing'&&socket?.readyState===WebSocket.OPEN)socket.send(JSON.stringify({type:'input',seq:seq++,input}));},ready(){if(phase==='roundOver'&&socket?.readyState===WebSocket.OPEN)socket.send(JSON.stringify({type:'ready'}));},get slot(){return slot;},get phase(){return phase;},get latency(){return latency;},get busy(){return ['connecting','queued'].includes(phase);}};
}
