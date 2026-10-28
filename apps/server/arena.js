import {createMatch,stepMatch,nextRound,TICK_RATE} from '../../packages/engine/index.js';
import {playerProfile,cleanInput,PROTOCOL_VERSION,RULES_VERSION} from '../../packages/network/protocol.js';
// One process owns the queue and every match. Clients send intentions, never combat state.
export function createArena({countdownTicks=180,roundBreakTicks=180,maxClients=200,maxMatches=80}={}){
 const clients=new Set(),queue=[],matches=new Set();let tick=0,nextId=1;
 const send=(client,value)=>{if(clients.has(client))client.send(value);};
 const queueStatus=()=>queue.forEach((c,i)=>send(c,{type:'queued',position:i+1,waiting:queue.length}));
 function removeQueued(c){const i=queue.indexOf(c);if(i>=0){queue.splice(i,1);queueStatus();}}
 function end(match,reason,leaver=null){
  if(!matches.delete(match))return;
  for(const c of match.players){c.match=null;c.input={};c.pending=[];c.ready=false;send(c,{type:'ended',reason,winner:leaver?match.players.indexOf(leaver)===0?1:0:null});}
 }
 function pair(){
  while(queue.length>=2&&matches.size<maxMatches){
   const players=queue.splice(0,2),state=createMatch(players.map(c=>c.profile));
   const match={id:`match-${nextId++}`,players,state,phase:'countdown',remaining:countdownTicks};matches.add(match);
   players.forEach((c,slot)=>{c.match=match;c.slot=slot;c.ready=false;c.input={};c.pending=[];send(c,{type:'matched',id:match.id,slot,players:players.map(p=>p.profile),state,phase:match.phase,countdown:Math.ceil(match.remaining/TICK_RATE)});});
  }
  queueStatus();
 }
 function connect(sendFn){
  if(clients.size>=maxClients)return null;
  const c={send:sendFn,match:null,input:{},pending:[],lastInput:tick,lastSeq:-1,budget:0,budgetAt:tick,profile:null,ready:false};clients.add(c);
  send(c,{type:'hello',protocol:PROTOCOL_VERSION,rules:RULES_VERSION});return c;
 }
 function message(c,msg){
  if(!clients.has(c))return;
  if(tick-c.budgetAt>=60){c.budget=0;c.budgetAt=tick;}
  if(++c.budget>180){disconnect(c);return;}
  try{
   if(!msg||typeof msg!=='object')throw new Error('Invalid message.');
   if(msg.type==='join'){
    if(c.match||queue.includes(c))throw new Error('Already in a queue or match.');
    if(msg.protocol!==PROTOCOL_VERSION||msg.rules!==RULES_VERSION)throw new Error('Game version changed. Refresh before joining.');
    c.profile=playerProfile(msg.profile);c.lastSeq=-1;queue.push(c);pair();
   }else if(msg.type==='cancel'){if(c.match)end(c.match,'opponent-left',c);removeQueued(c);send(c,{type:'cancelled'});pair();}
   else if(msg.type==='input'){
    if(!c.match||c.match.phase!=='playing'||c.match.state.status!=='playing')return;
    if(!Number.isSafeInteger(msg.seq)||msg.seq<=c.lastSeq)return;
    c.lastSeq=msg.seq;c.lastInput=tick;
    const input=cleanInput(msg.input);
    // Keep a bounded ordered set of edge packets until the next simulation tick.
    // Repeating held state must not repeat a one-shot press/dash.
    c.pending.push(input);if(c.pending.length>8)c.pending.shift();
   }else if(msg.type==='ready'){
    const m=c.match;if(!m||m.phase!=='roundOver')return;c.ready=true;
    if(m.players.every(p=>p.ready)){nextRound(m.state);m.phase='countdown';m.remaining=countdownTicks;for(const p of m.players){p.input={};p.pending=[];p.ready=false;}}
   }else if(msg.type==='ping')send(c,{type:'pong',sent:msg.sent});
  }catch(error){send(c,{type:'error',message:error.message});}
 }
 function disconnect(c){
  if(!clients.has(c))return;removeQueued(c);clients.delete(c);c.closed=true;if(c.match)end(c.match,c.match.phase==='matchOver'?'match-complete':'opponent-disconnected',c.match.phase==='matchOver'?null:c);pair();
 }
 function advance(){
  tick++;
  for(const m of matches){
   if(m.phase==='countdown'){
    if(--m.remaining<=0)m.phase='playing';
   }else if(m.phase==='playing'){
    const inputs=m.players.map(c=>{
     if(tick-c.lastInput>30){c.input={};c.pending=[];}
     if(c.pending.length){c.input=c.pending.shift();}
     const value=c.input;c.input={...value,pressedActions:[]};delete c.input.dashDirection;return value;
    });
    stepMatch(m.state,inputs);
    if(m.state.status==='roundOver'){m.phase='roundOver';m.remaining=roundBreakTicks;}
    if(m.state.status==='matchOver')m.phase='matchOver';
   }
   if(tick%3===0){for(const c of m.players)send(c,{type:'snapshot',state:m.state,phase:m.phase,countdown:Math.ceil(m.remaining/TICK_RATE)});}
   // Finished rooms expire even if a player never presses Leave.
   if((m.phase==='roundOver'||m.phase==='matchOver')&&--m.remaining<=-TICK_RATE*120)end(m,'room-expired');
  }
 }
 function close(){for(const m of [...matches])end(m,'server-shutdown');clients.clear();queue.length=0;}
 return {connect,message,disconnect,advance,close,stats:()=>({connections:clients.size,queued:queue.length,matches:matches.size,tick})};
}
