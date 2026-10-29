// Explicit operator command: node scripts/run-character-benchmark.mjs https://your-arena.example
// Creates eight SIM profiles and one persistent benchmark event. Never submits winners.
import WebSocket from 'ws';import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {computerInput,CHARACTERS,validateLoadout} from '../packages/engine/index.js';import {starterBuild} from '../packages/engine/tactics.js';import {PROTOCOL_VERSION,RULES_VERSION} from '../packages/network/protocol.js';
const base=new URL(process.argv[2]??'http://127.0.0.1:4175').origin;
const folder=process.env.BENCHMARK_DIRECTORY??'data/character-benchmark-group1';await mkdir(folder,{recursive:true});
let agent;if(process.env.HTTPS_PROXY&&base.startsWith('https:')){const {HttpsProxyAgent}=await import(process.env.BENCHMARK_PROXY_MODULE??'https-proxy-agent');agent=new HttpsProxyAgent(process.env.HTTPS_PROXY);}
const request=async(path,{body,token}={})=>{const r=await fetch(base+path,{...(body?{method:'POST',body:JSON.stringify(body)}:{}),headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},signal:AbortSignal.timeout(60000)});const data=await r.json();if(!r.ok)throw new Error(`${r.status}: ${data.error}`);return data;};
const availability=await request('/api/status');if(!availability.characterBenchmarksAvailable)throw new Error('This server does not yet support character benchmarks.');
const roster=Object.keys(CHARACTERS).slice(0,8),profiles=roster.map(character=>({name:'SIM '+CHARACTERS[character].name,...validateLoadout({character,weapon:'tachi',weapons:['tachi','kunai'],items:['paperBomb','throwingKunai','throwingShuriken','smokeBomb'],jutsus:starterBuild(character,'balanced')})}));
let checkpoint={base,identities:[],eventId:null};try{checkpoint=JSON.parse(await readFile(folder+'/private.json','utf8'));}catch{}
if(checkpoint.base!==base)throw new Error('Checkpoint belongs to another server. Choose a new BENCHMARK_DIRECTORY.');
const save=()=>writeFile(folder+'/private.json',JSON.stringify(checkpoint),{mode:0o600});
for(let i=checkpoint.identities.length;i<8;i++){checkpoint.identities.push(await request('/api/identity',{body:{name:profiles[i].name}}));await save();}
const owner=checkpoint.identities[0];
if(!checkpoint.eventId){const {tournament}=await request('/api/tournaments',{body:{name:'Group 1 - Akatsuki AI Benchmark',capacity:8,format:'league-knockout',benchmark:true},token:owner.token});checkpoint.eventId=tournament.id;await save();}
const endpoint='/api/tournaments/'+checkpoint.eventId;
let event=(await request(endpoint)).tournament;
if(event.status==='registration'){for(const m of checkpoint.identities.slice(1))await request(endpoint+'/join',{body:{},token:m.token});event=(await request(endpoint+'/start',{body:{},token:owner.token})).tournament;}
console.log('EVENT',JSON.stringify({id:event.id,name:event.name,roster,ai:'xtreme',rules:RULES_VERSION,loadouts:profiles}));
const byId=new Map(checkpoint.identities.map((m,i)=>[m.player.id,{...m,profile:profiles[i]}]));const sockets=new Set();
async function fight(pair){return new Promise((resolve,reject)=>{
 let done=false,lastReport=Date.now();const clients=[],timer=setTimeout(()=>finish(new Error('Pair exceeded eight minutes: '+pair.id)),480000);
 function finish(error,value){if(done)return;done=true;clearTimeout(timer);for(const ws of clients){sockets.delete(ws);ws.close();}error?reject(error):resolve(value);}
 for(const playerId of pair.players){const member=byId.get(playerId);if(!member){finish(new Error('Unknown entrant'));break;}let seq=0;const ws=new WebSocket(base.replace(/^http/,'ws')+'/ws',{origin:base,agent});clients.push(ws);sockets.add(ws);ws.on('error',e=>finish(e));ws.on('close',()=>{if(!done)finish(new Error('Connection interrupted; pairing will reopen.'));});
  ws.on('message',raw=>{if(done)return;try{const m=JSON.parse(raw);if(m.type==='hello'){if(m.rules!==RULES_VERSION||m.protocol!==PROTOCOL_VERSION)throw new Error('Server version differs.');ws.send(JSON.stringify({type:'join',protocol:PROTOCOL_VERSION,rules:RULES_VERSION,tournamentId:event.id,token:member.token,profile:member.profile}));}
   if(m.type==='error')throw new Error(m.message);
   if(m.type==='snapshot'||m.type==='matched'){
    if((pair.matchId&&m.id!==pair.matchId)||m.tournament?.id!==event.id||m.tournament?.pairId!==pair.id||m.players.some(p=>!pair.players.includes(p.playerId)))throw new Error('Unexpected pairing; stopping.');
    const slot=m.players.findIndex(p=>p.playerId===playerId);if(slot<0)throw new Error('Missing entrant');
    if(m.players.map(p=>p.playerId).join('|')!==pair.players.join('|'))throw new Error('Benchmark starting sides differ from the schedule.');
    if(m.type==='matched'&&slot===0)console.log('LIVE',JSON.stringify({stage:pair.stage??'knockout',id:m.id,names:m.players.map(p=>p.name)}));
    if(m.phase==='roundOver')ws.send(JSON.stringify({type:'ready'}));
    if(m.phase==='playing'){const state={...m.state,tick:Math.floor(m.state.tick/4)*4},input=computerInput(state,slot,'xtreme');ws.send(JSON.stringify({type:'input',seq:seq++,input}));}
    if(slot===0&&Date.now()-lastReport>30000){lastReport=Date.now();console.log('FIGHT',JSON.stringify({id:m.id,round:m.state.round,hp:m.state.fighters.map(f=>Math.round(f.hp)),score:m.state.wins}));}
    if(m.phase==='matchOver')finish(null,{id:m.id,score:m.state.wins,winner:m.players[m.state.wins[0]>=2?0:1].name});
   }
  }catch(e){finish(e);}});
 }
});}
try{
 while(event.status==='running'){
  const pending=event.rounds.at(-1).filter(p=>p.status!=='completed');console.log('ROUND',JSON.stringify({number:event.rounds.length,phase:event.phase,pairings:pending.length}));
  const outcomes=await Promise.allSettled(pending.map(fight));for(const r of outcomes){if(r.status==='rejected')throw r.reason;console.log('FINISHED',JSON.stringify(r.value));}
  // Result persistence is asynchronous; wait for the bracket transaction before entering another pairing.
  const deadline=Date.now()+60000;do{await new Promise(r=>setTimeout(r,1000));event=(await request(endpoint)).tournament;if(event.status==='completed'||event.rounds.at(-1).every(p=>!pending.some(v=>v.id===p.id)))break;}while(Date.now()<deadline);
  if(event.status==='running'&&event.rounds.at(-1).some(p=>pending.some(v=>v.id===p.id)))throw new Error('Result persistence did not advance the round.');
  console.log('STANDINGS',JSON.stringify(event.standings));await writeFile(folder+'/results.json',JSON.stringify({base,event,loadouts:profiles,ai:'xtreme',rules:RULES_VERSION},null,2));
 }
 if(event.status!=='completed'||event.rounds.flat().length!==35)throw new Error('Incomplete benchmark');
 const startingSides=Object.fromEntries(roster.map(c=>[c,0]));
 for(const p of event.rounds.flat()){const r=await request('/api/replays/'+p.matchId);if(r.truncated||r.frames.length<2||r.reason!=='completed')throw new Error('Replay incomplete: '+p.matchId);const players=r.players.map(v=>v.playerId),score=p.players.map(id=>r.frames.at(-1).state.wins[players.indexOf(id)]);if(JSON.stringify(score)!==JSON.stringify(p.score))throw new Error('Stored score differs from replay: '+p.matchId);if(p.stage==='league')startingSides[r.players[0].character]++;}
 if(Object.values(startingSides).some(n=>n!==3&&n!==4))throw new Error('League starting sides are not balanced.');
 for(const member of checkpoint.identities){const me=await request('/api/me',{token:member.token});if(me.player.games!==0||me.player.rating!==1000||me.rewards.points||me.rewards.unlocks.length)throw new Error('Benchmark affected player statistics');}
 console.log('VERIFIED',JSON.stringify({id:event.id,matches:35,replays:35,startingSides,leagueRanks:event.standings.map(r=>({name:r.name,rank:r.rank,wins:r.wins,losses:r.losses,points:r.points})),champion:event.participants.find(p=>p.id===event.champion)?.name}));
}finally{for(const ws of sockets)ws.close();}
