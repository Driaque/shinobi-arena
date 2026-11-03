// Gameplay fixtures explicitly finish preparation before exercising combat.
export function acceptStage(arena,client,choice=client.match?.preferences?.[0]){
 if(client.match?.phase==='preparing')for(const p of client.match.players)arena.message(p,{type:'stageVote',choice});
}
