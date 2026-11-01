import {connectionQuality} from './packages/network/prediction.js';
import {apiBase,ensureIdentity} from './arena-api.js';
import {PROTOCOL_VERSION,RULES_VERSION,playerProfile} from './packages/network/protocol.js';
export function createOnline({getProfile,onState,onEnd,onStatus,onSocial,onPhase},{identity=ensureIdentity,resolveBase=apiBase,Socket=WebSocket,now=()=>performance.now()}={}){
 let socket=null,generation=0,slot=0,phase='idle',seq=0,timeout,pingTimer,lastMessage=0,latency=null;const samples=[];
 const $=s=>document.querySelector(s),status=$('#online-status');
 const notify=text=>{onPhase?.(phase);status.textContent=text;onStatus?.(text);};
 try{$('#player-name').value=localStorage.getItem('shinobi-arena.player-name')||'';}catch{}
 let configured='',closing=Promise.resolve(true);
 fetch('./online-config.json',{cache:'no-store'}).then(r=>r.ok?r.json():{}).then(config=>{
  if(config.sameOrigin)configured=`${location.protocol==='https:'?'wss:':'ws:'}//${location.host}/ws`;
  else if(config.url)configured=config.url;
  if(!configured&&phase==='idle')notify('Online server not connected yet. Enter the deployed server address below to play online.');
  else if(phase==='idle')notify('Choose your fighter and weapon, then find an opponent.');
 }).catch(()=>{if(phase==='idle')notify('Enter the online server address below to connect.');});
 function serverURL(){
  const value=$('#online-server').value.trim()||configured;if(!value)throw new Error('Online needs its multiplayer server. Enter the deployed server address below.');
  const url=new URL(value);if(url.protocol==='https:')url.protocol='wss:';if(url.protocol==='http:')url.protocol='ws:';
  if(!['ws:','wss:'].includes(url.protocol)||url.username||url.password||url.search||url.hash)throw new Error('Use an HTTP(S) or WebSocket server address.');
  if(location.protocol==='https:'&&url.protocol!=='wss:')throw new Error('This secure page requires a secure (wss://) server.');
  if(url.pathname==='/')url.pathname='/ws';return url.href;
 }
 function cleanup(){
  clearTimeout(timeout);clearInterval(pingTimer);generation++;latency=null;samples.length=0;const old=socket;socket=null;
  if(old&&old.readyState!==Socket.CLOSED){
   // Cancel is processed before the close acknowledgement. Wait for that acknowledgement
   // before opening another socket, so latency cannot pair us with our old queue entry.
   let settle;
   const pending=new Promise(resolve=>{settle=resolve;});closing=pending;
   const done=()=>{clearTimeout(limit);if(closing===pending)closing=Promise.resolve(true);settle(true);};
   const limit=setTimeout(()=>settle(false),10000);
   old.addEventListener('close',done,{once:true});
   try{if(old.readyState===Socket.OPEN)old.send(JSON.stringify({type:'cancel'}));old.close();}catch{settle(false);}

  }
  $('#online-cancel').hidden=true;$('#online-leave').hidden=true;$('#player-name').disabled=false;$('#online-server').disabled=false;
  return closing;
 }
 function leave(){cleanup();phase='idle';onEnd('You left online play.');notify('Choose your fighter and find another opponent.');}
 function fail(text){cleanup();phase='idle';onEnd(text);notify(text);}
 async function join({tournamentId=null,lounge=false}={}){
  if(['connecting','queued','countdown','playing','roundOver'].includes(phase))return;
  let profile,url;
  try{profile=playerProfile({...getProfile(),name:$('#player-name').value});url=serverURL();}catch(e){notify(e.message);return;}
  const queue=$('#online-queue')?.value??'casual';
  const previousClosed=cleanup();phase='connecting';seq=0;const current=generation;
  $('#player-name').disabled=true;$('#online-server').disabled=true;$('#online-cancel').hidden=false;
  notify('Loading your profile and connecting to the arena…');
  timeout=setTimeout(()=>{if(current===generation)fail('Connection timed out. Check your connection and try again.');},15000);
  let token;
  try{token=await identity(profile.name,await resolveBase(url));}catch(e){if(current===generation)fail(e.message);return;}
  if(current!==generation)return;
  const closed=await previousClosed;if(current!==generation)return;
  if(!closed){fail('Previous connection is still closing. Try again shortly.');return;}
  try{localStorage.setItem('shinobi-arena.player-name',profile.name);}catch{}
  let ws;
  try{ws=socket=new Socket(url);}catch{fail('Could not connect to the arena. Check your connection and try again.');return;}
  ws.addEventListener('open',()=>{if(current!==generation)return;lastMessage=now();
   pingTimer=setInterval(()=>{if(now()-lastMessage>12000){fail('Connection lost. This fight cannot be resumed; join the queue again when connected.');return;}if(ws.readyState===Socket.OPEN)ws.send(JSON.stringify({type:'ping',sent:now()}));},3000);
  });
  ws.addEventListener('message',event=>{
   if(current!==generation)return;let msg;try{msg=JSON.parse(event.data);}catch{return;}
   if(!msg||typeof msg!=='object'||!['hello','queued','matched','snapshot','pong','ended','error','presence','challenge','challengeClosed','gesture','socialError'].includes(msg.type))return;
   lastMessage=now();
   if(msg.type==='hello'){
    if(msg.protocol!==PROTOCOL_VERSION||msg.rules!==RULES_VERSION){cleanup();phase='idle';notify('Server and game versions differ. Refresh the game.');onEnd('Version mismatch.');return;}
    ws.send(JSON.stringify({type:lounge?'lounge':'join',protocol:PROTOCOL_VERSION,rules:RULES_VERSION,profile,token,tournamentId,queue}));
   }else if(msg.type==='presence'){clearTimeout(timeout);if(!['countdown','playing','roundOver','matchOver'].includes(phase)){phase='lounge';notify('You are in the player lounge. Challenge an available rival.');}onSocial?.(msg);}
   else if(['challenge','challengeClosed','gesture'].includes(msg.type)){onSocial?.(msg);}
   else if(msg.type==='socialError'){onSocial?.(msg);status.textContent=msg.message;}
   else if(msg.type==='queued'){clearTimeout(timeout);phase='queued';notify(msg.mode==='tournament'?'Waiting for your bracket opponent to check in. Open the bracket to see the pairing.':`Waiting for an opponent… Queue position ${msg.position}. You can cancel any time.`);}
   else if(msg.type==='matched'){clearTimeout(timeout);slot=msg.slot;phase=msg.phase;onPhase?.(phase);$('#online-cancel').hidden=true;$('#online-leave').hidden=false;onState(msg,slot);}
   else if(msg.type==='snapshot'){if(phase==='matchOver'&&msg.phase==='matchOver')return;phase=msg.phase;onPhase?.(phase);onState(msg,slot);}
   else if(msg.type==='pong'&&Number.isFinite(msg.sent)&&msg.sent>=0&&msg.sent<=now()){latency=Math.round(now()-msg.sent);samples.push(latency);if(samples.length>12)samples.shift();}
   else if(msg.type==='ended'){const text=msg.reason==='tournament-updated'?'Tournament bracket updated. Open Arena → Tournaments.':msg.reason==='opponent-disconnected'||msg.reason==='opponent-left'?'Opponent left. You win by forfeit.':msg.reason==='server-shutdown'?'Server is restarting. Join again shortly.':msg.reason==='match-complete'?'Match complete. Find another opponent.':'Room expired. Join the queue again.';cleanup();phase='idle';onEnd(text);notify(text);}
   else if(msg.type==='error'){cleanup();phase='idle';onEnd(msg.message);notify(msg.message);}
  });
  ws.addEventListener('error',()=>{if(current===generation)fail('Could not reach the arena. Check your connection and try again.');});
  ws.addEventListener('close',()=>{if(current!==generation)return;cleanup();phase='idle';const text='Connection closed. Check the server and join the queue again.';notify(text);onEnd(text);});
 }
 $('#online-cancel').addEventListener('click',leave);$('#online-leave').addEventListener('click',leave);
 return {join,leave,social(message){if(socket?.readyState===Socket.OPEN)socket.send(JSON.stringify(message));},reset(){cleanup();phase='idle';onPhase?.(phase);},send(input){if(phase==='playing'&&socket?.readyState===Socket.OPEN){const sent=seq++;socket.send(JSON.stringify({type:'input',seq:sent,input}));return sent;}return null;},ready(){if(phase==='roundOver'&&socket?.readyState===Socket.OPEN)socket.send(JSON.stringify({type:'ready'}));},get slot(){return slot;},get phase(){return phase;},get quality(){return connectionQuality(samples);},get latency(){return latency;},get busy(){return ['connecting','queued'].includes(phase);}};
}
