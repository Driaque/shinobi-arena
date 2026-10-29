import {CHARACTERS} from '../../packages/engine/catalog.js';
import {leagueSchedule,leagueStandings,seededQuarterfinals} from './character-league.js';
import {randomUUID,randomInt} from 'node:crypto';
import {TOURNAMENT_REWARDS,requiredUnlocks} from '../../packages/engine/rewards.js';
export class TournamentError extends Error {constructor(message,status=409){super(message);this.status=status;}}
const reject=message=>{throw new TournamentError(message);};
const registrationLifetime=7*86400000;
export async function createTournaments({query,transaction,now}){
 await query('CREATE TABLE IF NOT EXISTS tournaments(id TEXT PRIMARY KEY,owner_id TEXT NOT NULL,status TEXT NOT NULL,created_at BIGINT NOT NULL,data TEXT NOT NULL)');
 await query('CREATE TABLE IF NOT EXISTS tournament_rewards(tournament_id TEXT NOT NULL,player_id TEXT NOT NULL,points INTEGER NOT NULL,unlocks TEXT NOT NULL,created_at BIGINT NOT NULL,PRIMARY KEY(tournament_id,player_id))');
 await query('CREATE INDEX IF NOT EXISTS tournament_rewards_player ON tournament_rewards(player_id,created_at)');
 const decode=row=>row?JSON.parse(row.data):null;
 async function read(q,id){return decode((await q('SELECT data FROM tournaments WHERE id=$1',[id]))[0]);}
 const put=(q,t)=>q('UPDATE tournaments SET status=$1,data=$2 WHERE id=$3',[t.status,JSON.stringify(t),t.id]);
 const active=t=>t.status==='running'||t.status==='registration'&&now()-t.createdAt<registrationLifetime;
 function pairFor(t,playerId){return t.rounds.flat().find(p=>p.status!=='completed'&&p.players.includes(playerId));}
 function check(t){if(!t)throw new TournamentError('Tournament not found.',404);return t;}
 function registration(t){check(t);if(t.status!=='registration'||!active(t))reject('Registration has closed.');}
 async function activeRows(q){return (await q("SELECT data FROM tournaments WHERE status='running' OR (status='registration' AND created_at>=$1) ORDER BY created_at DESC LIMIT 100",[now()-registrationLifetime])).map(decode).filter(active);}
 async function rewards(playerId,q=query){const rows=await q('SELECT points,unlocks FROM tournament_rewards WHERE player_id=$1',[playerId]);return {points:rows.reduce((n,r)=>n+Number(r.points),0),unlocks:[...new Set(rows.flatMap(r=>JSON.parse(r.unlocks)))]};}
 async function validateEquipment(playerId,profile){const needed=requiredUnlocks(profile);if(!needed.length)return;const owned=playerId?(await rewards(playerId)).unlocks:[];if(needed.some(id=>!owned.includes(id)))throw new TournamentError('Tournament reward gear must be earned on this profile before online use.',403);}
 async function create(player,{name,capacity,format='knockout',benchmark=false}){return transaction(async q=>{
  if(typeof name!=='string'||name.trim().length<3||[...name.trim()].length>40||/[\x00-\x1f]/.test(name))reject('Use a tournament name of 3–40 characters.');
  if(![2,4,8].includes(capacity))reject('Choose 2, 4 or 8 players.');
  if(!['knockout','league-knockout'].includes(format)||typeof benchmark!=='boolean')reject('Choose a valid tournament format.');
  if(format==='league-knockout'&&(!benchmark||capacity!==8))reject('Character leagues require eight entrants and benchmark mode.');
  if(benchmark&&format!=='league-knockout')reject('Benchmark mode requires the character league format.');
  const day=new Date(now());day.setUTCHours(0,0,0,0);if(Number((await q('SELECT COUNT(*) AS n FROM tournaments WHERE owner_id=$1 AND created_at>=$2',[player.id,day.getTime()]))[0].n)>=5)reject('Daily limit: create up to five tournaments per profile.');
  const current=await activeRows(q);if(current.length>=50)reject('Tournament capacity reached.');
  if(current.some(t=>t.participants.some(p=>p.id===player.id)))reject('Finish or leave your current tournament first.');
  const t={format,benchmark,id:randomUUID(),ownerId:player.id,name:name.trim(),capacity,createdAt:now(),status:'registration',participants:[{id:player.id,name:player.name}],rounds:[],played:{},champion:null,awards:[]};
  await q('INSERT INTO tournaments(id,owner_id,status,created_at,data) VALUES($1,$2,$3,$4,$5)',[t.id,player.id,t.status,t.createdAt,JSON.stringify(t)]);return t;
 });}
 async function update(id,player,action){return transaction(async q=>{
  const t=check(await read(q,id));registration(t);
  if(action==='join'){
   if(t.participants.some(p=>p.id===player.id))return t;
   if(t.participants.length>=t.capacity)reject('Tournament is full.');
   if((await activeRows(q)).some(v=>v.id!==id&&v.participants.some(p=>p.id===player.id)))reject('Finish or leave your current tournament first.');
   t.participants.push({id:player.id,name:player.name});
  }else if(action==='leave'){
   if(t.ownerId===player.id)reject('The organizer must cancel registration instead.');t.participants=t.participants.filter(p=>p.id!==player.id);
  }else if(action==='cancel'){
   if(t.ownerId!==player.id)throw new TournamentError('Only the organizer can cancel registration.',403);t.status='cancelled';
  }else if(action==='start'){
   if(t.ownerId!==player.id)throw new TournamentError('Only the organizer can start this tournament.',403);
   if(t.participants.length!==t.capacity)reject('Fill every signup slot before starting.');
   const seeds=[...t.participants];for(let i=seeds.length-1;i>0;i--){const j=randomInt(i+1);[seeds[i],seeds[j]]=[seeds[j],seeds[i]];}
   t.status='running';t.startedAt=now();t.rounds=[Array.from({length:t.capacity/2},(_,i)=>({id:randomUUID(),players:[seeds[i*2].id,seeds[i*2+1].id],status:'pending',winner:null,matchId:null}))];
   if(t.format==='league-knockout'){t.phase='league';t.leagueSchedule=leagueSchedule(t.participants);t.rounds=[t.leagueSchedule[0]];t.standings=leagueStandings(t);}
  }else reject('Unknown tournament action.');
  await put(q,t);return t;
 });}
 async function prepare(id,playerId,character=null){return transaction(async q=>{
  const t=check(await read(q,id));if(t.status!=='running')reject('Tournament is not running.');const p=pairFor(t,playerId);if(!p||p.players.length!==2)reject('No pairing is ready for you.');
  if(t.benchmark){const member=t.participants.find(v=>v.id===playerId);if(!Object.hasOwn(CHARACTERS,character))reject('Choose a valid benchmark character.');if(member.character&&member.character!==character)reject('Keep the same character throughout this benchmark.');if(t.participants.some(v=>v.id!==playerId&&v.character===character))reject('Each benchmark entrant needs a different character.');member.character=character;}
  p.matchId??=randomUUID();p.status='waiting';await put(q,t);return {id:t.id,pairId:p.id,matchId:p.matchId,players:[...p.players],...(t.benchmark?{benchmark:true}:{} )};
 });}
 async function finishPair(q,t,p,winner,reason){
  p.status='completed';p.winner=winner;p.reason=reason;p.completedAt=now();
  const current=t.rounds.at(-1);if(current.every(v=>v.status==='completed')){
   if(t.phase==='league'){
    t.standings=leagueStandings(t);
    if(t.rounds.length<7)t.rounds.push(t.leagueSchedule[t.rounds.length]);
    else{t.phase='knockout';t.knockoutStart=t.rounds.length;t.rounds.push(seededQuarterfinals(t.standings));}
    await put(q,t);return;
   }
   if(current.length>1){const winners=current.map(v=>v.winner);t.rounds.push(Array.from({length:winners.length/2},(_,i)=>({id:randomUUID(),players:[winners[2*i],winners[2*i+1]],status:'pending',winner:null,matchId:null})));}
   else{
    t.status='completed';t.champion=winner;t.completedAt=now();const finalist=current[0].players.find(id=>id!==winner),day=new Date(now());day.setUTCHours(0,0,0,0);
    for(const member of t.benchmark?[]:t.participants){const qualifies=(t.played[member.id]??0)>=1200,cap=Number((await q('SELECT COUNT(*) AS n FROM tournament_rewards WHERE player_id=$1 AND created_at>=$2',[member.id,day.getTime()]))[0].n)>=3;
     const rank=member.id===winner?'champion':member.id===finalist?'finalist':'participant',reward=TOURNAMENT_REWARDS[rank],award={playerId:member.id,rank,points:qualifies&&!cap?reward.points:0,unlocks:qualifies&&!cap?reward.unlocks:[],note:!qualifies?'Play at least 20 seconds in server-run battles to qualify.':cap?'Daily reward limit reached.':'Awarded'};
     await q('INSERT INTO tournament_rewards(tournament_id,player_id,points,unlocks,created_at) VALUES($1,$2,$3,$4,$5)',[t.id,member.id,award.points,JSON.stringify(award.unlocks),now()]);t.awards.push(award);
    }
   }
  }
  await put(q,t);
 }
 // Invoked inside the same transaction as the immutable server match result.
 async function complete(q,record){
  if(!record.tournament)return;const t=await read(q,record.tournament.id);if(!t||t.status!=='running')return;
  const p=t.rounds.flat().find(p=>p.id===record.tournament.pairId);if(!p||p.status==='completed'||p.matchId!==record.id||!record.players.every(v=>p.players.includes(v.playerId)))return;
  if(record.winner===null||record.reason==='server-shutdown'||record.reason==='cancelled'||t.benchmark&&record.reason!=='completed'){p.status='pending';p.matchId=null;await put(q,t);return;}
  const winner=record.players[record.winner]?.playerId;if(!p.players.includes(winner))return;
  p.score=[...record.wins];p.damage=record.replay?.frames?.at(-1)?.state?.metrics?.map(m=>m.damage)??[0,0];
  for(const member of record.players)t.played[member.playerId]=(t.played[member.playerId]??0)+record.playedTicks;
  await finishPair(q,t,p,winner,record.reason);
  if(t.format==='league-knockout'&&t.phase==='league'){t.standings=leagueStandings(t);await put(q,t);}
 }
 async function withdraw(id,playerId){return transaction(async q=>{const t=check(await read(q,id));if(t.status!=='running')reject('Tournament is not running.');if(t.benchmark)reject('Benchmark pairings must be completed in battle.');const p=pairFor(t,playerId);if(!p)reject('No active pairing to withdraw from.');await finishPair(q,t,p,p.players.find(id=>id!==playerId),'withdrawal');return {tournament:t,pairId:p.id};});}
 async function recover(){return transaction(async q=>{for(const t of await activeRows(q)){let changed=false;for(const p of t.rounds.flat())if(p.status==='waiting'){p.status='pending';p.matchId=null;changed=true;}if(changed)await put(q,t);}});}
 async function list(){return (await query("SELECT data FROM tournaments ORDER BY CASE WHEN status='running' OR (status='registration' AND created_at>=$1) THEN 0 ELSE 1 END,created_at DESC LIMIT 70",[now()-registrationLifetime])).map(decode).map(t=>({...t,status:t.status==='registration'&&!active(t)?'expired':t.status}));}
 return {create,update,prepare,complete,withdraw,recover,list,get:async id=>check(await read(query,id)),rewards,validateEquipment};
}
