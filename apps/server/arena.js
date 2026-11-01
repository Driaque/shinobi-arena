import {createCoopMatch,stepCoop} from '../../packages/engine/coop.js';
import {randomUUID} from 'node:crypto';
import {createMatch,stepMatch,nextRound,TICK_RATE,CHARACTERS,MOVES,AWAKENINGS} from '../../packages/engine/index.js';
import {playerProfile,cleanInput,PROTOCOL_VERSION,RULES_VERSION} from '../../packages/network/protocol.js';
export function createArena({countdownTicks=180,roundBreakTicks=180,maxClients=200,maxMatches=20,maxSpectators=40,onResult=()=>{},now=()=>Date.now()}={}){
 const clients=new Set(),queue=[],matches=new Set();let tick=0;
 const send=(c,value)=>{if(clients.has(c))c.send(value);};
 const queueStatus=()=>queue.forEach(c=>{const own=queue.filter(p=>p.queueMode===c.queueMode&&(c.queueMode!=='tournament'||p.tournament?.matchId===c.tournament?.matchId)&&(c.queueMode!=='coop'||p.room===c.room));send(c,{type:'queued',position:own.indexOf(c)+1,waiting:own.length,mode:c.queueMode});});
 function removeQueued(c){const i=queue.indexOf(c);if(i>=0){queue.splice(i,1);queueStatus();}}
 function unwatch(c){if(c.spectating){c.spectating.spectators.delete(c);c.spectating=null;}}
 const publicPlayers=m=>m.players.map(p=>({...p.profile,playerId:p.playerId??null}));
 const snapshot=m=>({type:'snapshot',id:m.id,players:publicPlayers(m),state:m.state,phase:m.phase,mode:m.mode,tournament:m.tournament?{id:m.tournament.id,pairId:m.tournament.pairId}:null,acks:m.players.map(c=>c.appliedSeq??-1),countdown:Math.ceil(m.remaining/TICK_RATE)});
 function frame(m){if(m.mode==='coop')return;const frames=m.replay.frames;if(frames.length>=4500){m.replay.truncated=true;return;}frames.push({at:tick-m.startedTick,phase:m.phase,state:structuredClone(m.state)});}
 function record(m,reason,winner){
  if(m.recorded)return;m.recorded=true;frame(m);
  m.replay.duration=tick-m.startedTick;m.replay.reason=reason;m.replay.winner=winner;
  const record={tournament:m.tournament??null,id:m.id,createdAt:m.createdAt,mode:m.mode,players:publicPlayers(m),winner,reason,wins:[...m.state.wins],playedTicks:m.playedTicks,replay:m.replay};
  if(m.mode!=='coop')onResult(record);
 }
 function end(m,reason,leaver=null){
  if(!matches.delete(m))return;
  if(!m.recorded)record(m,leaver&&(m.playedTicks>0||m.tournament)?reason:'cancelled',leaver&&(m.playedTicks>0||m.tournament)?(m.players.indexOf(leaver)===0?1:0):null);
  for(const c of m.spectators){c.spectating=null;send(c,{type:'ended',reason,id:m.id});}m.spectators.clear();
  for(const c of m.players){c.match=null;c.input={};c.pending=[];c.ready=false;send(c,{type:'ended',reason,winner:leaver?m.players.indexOf(leaver)===0?1:0:null,id:m.id});}
 }
 function pair(){
  for(const mode of ['casual','ranked','tournament','coop'])while(matches.size<maxMatches){
   const eligible=queue.filter(c=>c.queueMode===mode);if(eligible.length<2)break;
   let players=eligible.slice(0,2);if(mode==='coop'){players=null;for(const first of eligible){const second=eligible.find(c=>c!==first&&c.room===first.room&&(!first.playerId||c.playerId!==first.playerId));if(second){players=[first,second];break;}}if(!players)break;}if(mode==='tournament'){players=null;for(const first of eligible){const second=eligible.find(c=>c!==first&&c.playerId!==first.playerId&&c.tournament?.matchId===first.tournament?.matchId&&first.tournament.players.includes(c.playerId));if(second){players=[first,second];if(first.tournament.benchmark)players.sort((a,b)=>first.tournament.players.indexOf(a.playerId)-first.tournament.players.indexOf(b.playerId));break;}}if(!players)break;}for(const p of players)queue.splice(queue.indexOf(p),1);
   const state=(mode==='coop'?createCoopMatch:createMatch)(players.map(c=>c.profile)),id=players[0].tournament?.matchId??randomUUID(),createdAt=now();
   const m={tournament:players[0].tournament?structuredClone(players[0].tournament):null,id,createdAt,mode,players,state,spectators:new Set(),phase:'countdown',remaining:countdownTicks,startedTick:tick,playedTicks:0,recorded:false,replay:{schema:1,id,rules:RULES_VERSION,tickRate:TICK_RATE,createdAt,mode,players:players.map(c=>({...c.profile,playerId:c.playerId??null})),catalog:{characters:CHARACTERS,moves:MOVES,awakenings:AWAKENINGS},loadouts:structuredClone(state.loadouts),frames:[],inputs:[],rounds:[],truncated:false}};
   matches.add(m);frame(m);
   players.forEach((c,slot)=>{c.match=m;c.slot=slot;c.ready=false;c.input={};c.pending=[];send(c,{...snapshot(m),type:'matched',slot});});
  }
  queueStatus();
 }
 function connect(sendFn){if(clients.size>=maxClients)return null;const c={send:sendFn,match:null,spectating:null,input:{},pending:[],lastInput:tick,lastSeq:-1,budget:0,budgetAt:tick,profile:null,ready:false,playerId:null};clients.add(c);send(c,{type:'hello',protocol:PROTOCOL_VERSION,rules:RULES_VERSION});return c;}
 function message(c,msg){
  if(!clients.has(c))return;if(tick-c.budgetAt>=60){c.budget=0;c.budgetAt=tick;}if(++c.budget>180){disconnect(c);return;}
  try{
   if(!msg||typeof msg!=='object')throw new Error('Invalid message.');
   if(msg.type==='ping'){send(c,{type:'pong',sent:msg.sent});return;}
   if(msg.type==='watch'){
    if(c.match||queue.includes(c))throw new Error('Leave your match or queue before spectating.');
    if(msg.protocol!==PROTOCOL_VERSION||msg.rules!==RULES_VERSION)throw new Error('Game version changed. Refresh before watching.');
    const m=[...matches].find(m=>m.id===msg.id&&m.mode!=='coop');if(!m)throw new Error('Match has ended.');if(m.spectators.size>=maxSpectators)throw new Error('Spectator seats are full.');unwatch(c);c.spectating=m;m.spectators.add(c);send(c,{...snapshot(m),type:'watching'});return;
   }
   if(msg.type==='cancel'){unwatch(c);if(c.match)end(c.match,c.match.phase==='matchOver'?'match-complete':'opponent-left',c.match.phase==='matchOver'?null:c);removeQueued(c);send(c,{type:'cancelled'});pair();return;}
   if(c.spectating)throw new Error('Spectators are read-only.');
   if(msg.type==='join'){
    if(c.match||queue.includes(c))throw new Error('Already in a queue or match.');
    if(msg.protocol!==PROTOCOL_VERSION||msg.rules!==RULES_VERSION)throw new Error('Game version changed. Refresh before joining.');
    if(c.playerId&&[...clients].some(p=>p!==c&&p.playerId===c.playerId&&(p.match||queue.includes(p))))throw new Error('This player profile is already playing or queued.');
    if(msg.queue==='coop'&&!/^[A-Z0-9]{8}$/.test(msg.room??''))throw new Error('Use an eight-character co-op room code.');
    if(msg.queue==='coop'&&[...matches].some(m=>m.mode==='coop'&&m.players[0].room===msg.room&&m.phase!=='matchOver'))throw new Error('This co-op room is already playing. Create another room.');
    c.room=msg.queue==='coop'?msg.room:null;
    c.queueMode=c.tournament?'tournament':msg.queue==='coop'?'coop':msg.queue==='ranked'?'ranked':'casual';if(c.queueMode==='ranked'&&!c.playerId)throw new Error('Create or restore your player profile for ranked play.');
    c.profile=playerProfile(msg.profile);c.lastSeq=-1;queue.push(c);pair();
   }else if(msg.type==='input'){
    if(!c.match||c.match.phase!=='playing'||c.match.state.status!=='playing')return;
    if(!Number.isSafeInteger(msg.seq)||msg.seq<=c.lastSeq)return;c.lastSeq=msg.seq;c.lastInput=tick;const input=cleanInput(msg.input);c.pending.push({...input,_seq:msg.seq});if(c.pending.length>8)c.pending.shift();
   }else if(msg.type==='ready'){
    const m=c.match;if(!m||m.phase!=='roundOver')return;c.ready=true;
    if(m.players.every(p=>p.ready)){nextRound(m.state);m.phase='countdown';m.remaining=countdownTicks;m.replay.rounds.push({at:tick-m.startedTick,state:structuredClone(m.state)});frame(m);for(const p of m.players){p.input={};p.pending=[];p.ready=false;}}
   }else throw new Error('Unknown message.');
  }catch(error){send(c,{type:'error',message:error.message});}
 }
 function disconnect(c){if(!clients.has(c))return;unwatch(c);removeQueued(c);clients.delete(c);c.closed=true;if(c.match)end(c.match,c.match.phase==='matchOver'?'match-complete':'opponent-disconnected',c.match.phase==='matchOver'?null:c);pair();}
 function advance(){
  tick++;
  for(const m of matches){
   if(m.phase==='countdown'){if(--m.remaining<=0)m.phase='playing';}
   else if(m.phase==='playing'){
    const inputs=m.players.map(c=>{if(tick-c.lastInput>30){c.input={};c.pending=[];}const latest=c.pending.at(-1);if(c.pending.length)c.input=c.pending.shift();c.appliedSeq=c.input._seq??c.appliedSeq;const value=latest?{...c.input,moveX:latest.moveX,moveZ:latest.moveZ,left:latest.left,right:latest.right}:c.input;delete value._seq;c.input={...value,pressedActions:[]};delete c.input.dashDirection;return value;});
    if(m.mode!=='coop'&&m.replay.inputs.length<40000){const key=JSON.stringify(inputs),last=m.replay.inputs.at(-1);if(last&&m.lastInputKey===key)last.count++;else m.replay.inputs.push({tick:m.state.tick+1,count:1,inputs:structuredClone(inputs)});m.lastInputKey=key;}else m.replay.truncated=true;
    (m.mode==='coop'?stepCoop:stepMatch)(m.state,inputs);m.playedTicks++;
    if(m.state.status==='roundOver'){m.phase='roundOver';m.remaining=roundBreakTicks;frame(m);}
    if(m.state.status==='matchOver'){m.phase='matchOver';record(m,'completed',m.state.wins[0]>=2?0:1);}
   }
   if(!m.recorded&&tick%12===0)frame(m);
   if(tick%3===0){const value=snapshot(m);for(const c of [...m.players,...m.spectators])send(c,value);}
   if((m.phase==='roundOver'||m.phase==='matchOver')&&--m.remaining<=-TICK_RATE*120)end(m,'room-expired');
  }
 }
 function close(){for(const m of [...matches])end(m,'server-shutdown');clients.clear();queue.length=0;}
 function cancelTournamentQueue(id,pairId){for(const c of [...queue])if(c.tournament?.id===id&&c.tournament.pairId===pairId){removeQueued(c);c.tournament=null;send(c,{type:'ended',reason:'tournament-updated'});}pair();}
 return {isQueued:c=>queue.includes(c),hasTournamentMatch:(id,playerId)=>[...matches].some(m=>m.tournament?.id===id&&m.players.some(c=>c.playerId===playerId)&&m.phase!=='matchOver'),cancelTournamentQueue,connect,message,disconnect,advance,close,list:()=>[...matches].filter(m=>m.phase!=='matchOver'&&m.mode!=='coop').map(m=>({id:m.id,mode:m.mode,phase:m.phase,round:m.state.round,wins:m.state.wins,players:publicPlayers(m),spectators:m.spectators.size,capacity:maxSpectators})),stats:()=>({connections:clients.size,queued:queue.length,matches:matches.size,tick,spectators:[...clients].filter(c=>c.spectating).length})};
}
