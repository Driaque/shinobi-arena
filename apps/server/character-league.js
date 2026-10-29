// Pairings and standings are derived from stored server results, never client winners.
import {randomUUID} from 'node:crypto';
export const pairing=(players,stage='knockout')=>({id:randomUUID(),players:[...players],stage,status:'pending',winner:null,matchId:null});
export function leagueSchedule(participants){
 if(participants.length!==8||new Set(participants.map(p=>p.id)).size!==8)throw new Error('A character benchmark needs eight distinct entrants.');
 const ring=participants.map(p=>p.id),rounds=[];
 for(let round=0;round<7;round++){
  rounds.push(Array.from({length:4},(_,i)=>{const ids=[ring[i],ring[7-i]];if(i===0&&round%2)ids.reverse();return pairing(ids,'league');}));
  ring.splice(1,0,ring.pop());
 }
 return rounds;
}
export function leagueStandings(t){
 const rows=t.participants.map(p=>({...p,played:0,wins:0,losses:0,points:0,roundsFor:0,roundsAgainst:0,damageFor:0,damageAgainst:0})),byId=new Map(rows.map(r=>[r.id,r]));
 for(const p of t.rounds.flat().filter(p=>p.stage==='league'&&p.status==='completed'))for(let i=0;i<2;i++){
  const r=byId.get(p.players[i]);r.played++;r.wins+=Number(p.winner===r.id);r.losses+=Number(p.winner!==r.id);r.points+=p.winner===r.id?3:0;r.roundsFor+=p.score?.[i]??0;r.roundsAgainst+=p.score?.[1-i]??0;r.damageFor+=p.damage?.[i]??0;r.damageAgainst+=p.damage?.[1-i]??0;
 }
 // Mini-league points among entrants tied on overall points, then round and damage differences.
 for(const r of rows)r.headToHead=t.rounds.flat().filter(p=>p.stage==='league'&&p.status==='completed'&&p.winner===r.id&&p.players.some(id=>id!==r.id&&byId.get(id)?.points===r.points)).length*3;
 rows.sort((a,b)=>b.points-a.points||b.headToHead-a.headToHead||(b.roundsFor-b.roundsAgainst)-(a.roundsFor-a.roundsAgainst)||(b.damageFor-b.damageAgainst)-(a.damageFor-a.damageAgainst)||a.name.localeCompare(b.name));
 return rows.map((r,i)=>({...r,rank:i+1,roundDifference:r.roundsFor-r.roundsAgainst}));
}
export function seededQuarterfinals(standings){return [[0,7],[3,4],[1,6],[2,5]].map(([a,b])=>pairing([standings[a].id,standings[b].id]));}
// Preserve completed battles while balancing the remaining sides after legacy arrival-order seating.
export function rebalanceLeagueSides(t){
 const ids=t.participants.map(p=>p.id),index=new Map(ids.map((id,i)=>[id,i])),completed=t.rounds.flat().filter(p=>p.stage==='league'&&p.status==='completed'),done=new Set(completed.map(p=>p.id)),counts=ids.map(id=>completed.filter(p=>(p.actualOrder??p.players)[0]===id).length),pending=t.leagueSchedule.flat().filter(p=>!done.has(p.id));
 const suffix=Array.from({length:pending.length+1},()=>Array(8).fill(0));for(let i=pending.length-1;i>=0;i--){suffix[i]=[...suffix[i+1]];for(const id of pending[i].players)suffix[i][index.get(id)]++;}
 const failed=new Set(),chosen=[];
 function visit(at){if(counts.some((n,i)=>n>4||n+suffix[at][i]<3))return false;if(at===pending.length)return true;const key=at+':'+counts.join(',');if(failed.has(key))return false;const players=pending[at].players,options=[...players].sort((a,b)=>counts[index.get(a)]-counts[index.get(b)]);for(const first of options){const i=index.get(first);counts[i]++;chosen[at]=[first,players.find(id=>id!==first)];if(visit(at+1))return true;counts[i]--;}failed.add(key);return false;}
 if(!visit(0)){t.sideBalanceNote='Completed legacy battles exceed the balanced side budget.';return false;}
 const replacements=new Map(pending.map((p,i)=>[p.id,chosen[i]]));for(const p of [...t.leagueSchedule.flat(),...t.rounds.flat()])if(replacements.has(p.id))p.players=[...replacements.get(p.id)];t.sideScheduleRebalanced=true;
}
