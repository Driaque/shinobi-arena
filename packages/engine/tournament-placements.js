// Single-elimination brackets have joint third place when no bronze match was played.
export function tournamentPodium(t){
 if(t?.status!=='completed'||!t.champion)return [];
 const rounds=(t.rounds??[]).filter(round=>round.length&&round[0].stage!=='league'),final=rounds.at(-1)?.[0];
 if(!final||final.status!=='completed'||final.winner!==t.champion)return [];
 const members=new Map((t.participants??[]).map(p=>[p.id,p])),entry=(place,title,ids)=>({place,title,players:[...new Set(ids)].map(id=>members.get(id)).filter(Boolean)});
 const podium=[entry(1,'Champion',[t.champion]),entry(2,'First runner-up',final.players.filter(id=>id!==t.champion))];
 const semis=rounds.at(-2);if(semis?.length===2&&semis.every(p=>p.status==='completed'&&p.winner)){
  const ids=semis.flatMap(p=>p.players.filter(id=>id!==p.winner));podium.push(entry(3,ids.length>1?'Joint second runners-up':'Second runner-up',ids));
 }
 return podium.filter(p=>p.players.length);
}
