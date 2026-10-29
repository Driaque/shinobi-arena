import test from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';
import {leagueSchedule,leagueStandings} from '../apps/server/character-league.js';
import {createStore} from '../apps/server/store.js';import {createMatch,CHARACTERS} from '../packages/engine/index.js';import {RULES_VERSION} from '../packages/network/protocol.js';
const roster=Object.keys(CHARACTERS).slice(0,8);
test('eight-entrant schedule covers all 28 distinct opponents with disjoint rounds and balanced sides',()=>{const ps=roster.map(id=>({id,name:id})),rounds=leagueSchedule(ps),pairs=rounds.flat();assert.equal(rounds.length,7);assert.equal(pairs.length,28);assert.equal(new Set(pairs.map(p=>[...p.players].sort().join(':'))).size,28);for(const round of rounds)assert.equal(new Set(round.flatMap(p=>p.players)).size,8);for(const p of ps){assert.equal(pairs.filter(m=>m.players.includes(p.id)).length,7);assert.ok([3,4].includes(pairs.filter(m=>m.players[0]===p.id).length));}});
test('league standings use mini-league, round difference and deterministic ties without knockout contamination',()=>{const participants=roster.map(id=>({id,name:id}));const t={participants,rounds:[[{stage:'league',status:'completed',players:roster.slice(0,2),winner:roster[0],score:[2,1],damage:[2000,1500]},{stage:'knockout',status:'completed',players:roster.slice(0,2),winner:roster[1],score:[0,2]}]]};const rows=leagueStandings(t);assert.equal(rows[0].id,roster[0]);assert.equal(rows[0].points,3);assert.equal(rows[0].played,1);assert.equal(rows[0].roundDifference,1);assert.equal(rows.find(r=>r.id===roster[1]).losses,1);});
test('full benchmark persists 28 league results, seeds quarters, completes seven knockouts and grants no player stats or rewards',async()=>{
 const s=await createStore();try{const members=await Promise.all(roster.map(c=>s.createIdentity('SIM '+c))),chars=new Map(members.map((m,i)=>[m.player.id,roster[i]]));
 await assert.rejects(()=>s.tournaments.create(members[0].player,{name:'Invalid league',capacity:4,format:'league-knockout',benchmark:true}),/eight/);
 const t=await s.tournaments.create(members[0].player,{name:'Group One benchmark',capacity:8,format:'league-knockout',benchmark:true});for(const m of members.slice(1))await s.tournaments.update(t.id,m.player,'join');let current=await s.tournaments.update(t.id,members[0].player,'start');let count=0;
 while(current.status==='running'){
  for(const p of current.rounds.at(-1)){
   const a=await s.tournaments.prepare(t.id,p.players[0],chars.get(p.players[0]));const b=await s.tournaments.prepare(t.id,p.players[1],chars.get(p.players[1]));assert.equal(a.matchId,b.matchId);assert.equal(a.benchmark,true);
   if(count===0){await assert.rejects(()=>s.tournaments.prepare(t.id,p.players[0],chars.get(p.players[1])),/same character/);await assert.rejects(()=>s.tournaments.prepare(t.id,p.players[1],chars.get(p.players[0])),/same character|different character/);await assert.rejects(()=>s.tournaments.withdraw(t.id,p.players[0]),/completed in battle/);}
   const players=p.players.map(id=>({playerId:id,name:members.find(m=>m.player.id===id).player.name,character:chars.get(id),weapon:'kunai'}));const state=createMatch(players);state.metrics[0].damage=2000;state.metrics[1].damage=1000;
   const record={id:a.matchId,tournament:a,createdAt:Date.now(),mode:'tournament',players,winner:0,reason:'completed',wins:[2,0],playedTicks:1600,replay:{schema:1,rules:RULES_VERSION,frames:[{at:0,state}]}};
   if(count===0){await s.save({...record,reason:'opponent-disconnected'});assert.equal((await s.tournaments.get(t.id)).rounds[0][0].status,'pending');const fresh=await s.tournaments.prepare(t.id,p.players[0],chars.get(p.players[0]));record.id=fresh.matchId;record.tournament=fresh;assert.notEqual(record.id,a.matchId);}
   await s.save(record);await s.save(record);count++;
  }
  current=await s.tournaments.get(t.id);
  if(current.rounds.length===8){assert.equal(current.phase,'knockout');assert.equal(current.standings.length,8);assert.ok(current.standings.every(r=>r.played===7));const seeds=current.standings.map(r=>r.id);assert.deepEqual(current.rounds[7].map(p=>p.players),[[seeds[0],seeds[7]],[seeds[3],seeds[4]],[seeds[1],seeds[6]],[seeds[2],seeds[5]]]);}
 }
 assert.equal(count,35);assert.equal(current.status,'completed');assert.equal(current.rounds.length,10);assert.equal(current.awards.length,0);assert.ok(current.champion);assert.equal((await s.leaderboard()).length,0);
 for(const m of members){const p=await s.identity(m.token);assert.equal(p.games,0);assert.equal(p.rating,1000);assert.deepEqual(await s.tournaments.rewards(p.id),{points:0,unlocks:[]});}
 assert.ok((await s.history({limit:50})).every(m=>!m.result.rated&&m.result.rankingNote.includes('benchmark')));
 }finally{await s.close();}
});
