import test from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';
import {leagueSchedule,leagueStandings,rebalanceLeagueSides} from '../apps/server/character-league.js';
import {createStore} from '../apps/server/store.js';import {createArena} from '../apps/server/arena.js';import {createMatch,CHARACTERS} from '../packages/engine/index.js';import {PROTOCOL_VERSION,RULES_VERSION} from '../packages/network/protocol.js';
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


test('legacy arrival-order sides are balanced across remaining opponents without replaying completed battles',()=>{
 for(let mask=0;mask<16;mask++){
  const participants=roster.map(id=>({id,name:id})),schedule=leagueSchedule(participants),t={participants,leagueSchedule:schedule,rounds:[structuredClone(schedule[0])]};
  for(const [i,p]of t.rounds[0].entries()){p.status='completed';p.actualOrder=(mask>>i)&1?[...p.players].reverse():[...p.players];}
  rebalanceLeagueSides(t);const played=[...t.rounds[0].map(p=>p.actualOrder),...t.leagueSchedule.slice(1).flat().map(p=>p.players)];for(const p of participants)assert.ok([3,4].includes(played.filter(ids=>ids[0]===p.id).length));assert.equal(new Set(played.map(ids=>[...ids].sort().join(':'))).size,28);
 }
});

test('reversed socket order maps score and damage by identity and benchmark arena enforces scheduled seats',async()=>{
 const s=await createStore();try{
 const members=await Promise.all(roster.map(c=>s.createIdentity('SIM '+c))),chars=new Map(members.map((m,i)=>[m.player.id,roster[i]])),t=await s.tournaments.create(members[0].player,{name:'Seat correction',capacity:8,format:'league-knockout',benchmark:true});for(const m of members.slice(1))await s.tournaments.update(t.id,m.player,'join');const active=await s.tournaments.update(t.id,members[0].player,'start'),pair=active.rounds[0][0],ctx=await s.tournaments.prepare(t.id,pair.players[0],chars.get(pair.players[0]));await s.tournaments.prepare(t.id,pair.players[1],chars.get(pair.players[1]));
 const players=[...pair.players].reverse().map(id=>({playerId:id,name:'SIM '+chars.get(id),character:chars.get(id),weapon:'kunai'})),state=createMatch(players);state.metrics[0].damage=2000;state.metrics[1].damage=400;
 await s.save({id:ctx.matchId,tournament:ctx,createdAt:Date.now(),mode:'tournament',players,winner:0,reason:'completed',wins:[2,0],playedTicks:1800,replay:{schema:1,rules:RULES_VERSION,frames:[{at:0,state}]}});
 const saved=await s.tournaments.get(t.id);assert.deepEqual(saved.rounds[0][0].score,[0,2]);assert.deepEqual(saved.rounds[0][0].damage,[400,2000]);assert.deepEqual(saved.rounds[0][0].actualOrder,players.map(p=>p.playerId));assert.equal(saved.standings.find(r=>r.id===players[0].playerId).roundDifference,2);
 const arena=createArena(),first=arena.connect(()=>{}),second=arena.connect(()=>{});first.playerId=ctx.players[1];second.playerId=ctx.players[0];for(const c of [first,second]){c.tournament=ctx;arena.message(c,{type:'join',protocol:PROTOCOL_VERSION,rules:RULES_VERSION,profile:{name:'SIM seat',character:'naruto',weapon:'kunai'}});}assert.equal(second.slot,0);assert.equal(first.slot,1);arena.close();
 }finally{await s.close();}
});

test('restart repairs legacy reversed scorelines from immutable records once and balances unplayed seats',async()=>{
 const {mkdtemp,rm}=await import('node:fs/promises'),{tmpdir}=await import('node:os'),{join}=await import('node:path'),{DatabaseSync}=await import('node:sqlite'),dir=await mkdtemp(join(tmpdir(),'league-repair-')),filename=join(dir,'store.sqlite');let s=await createStore({filename});
 try{
  const members=await Promise.all(roster.map(c=>s.createIdentity('SIM '+c))),chars=new Map(members.map((m,i)=>[m.player.id,roster[i]])),t=await s.tournaments.create(members[0].player,{name:'Legacy recovery',capacity:8,format:'league-knockout',benchmark:true});for(const m of members.slice(1))await s.tournaments.update(t.id,m.player,'join');const active=await s.tournaments.update(t.id,members[0].player,'start'),p=active.rounds[0][0],ctx=await s.tournaments.prepare(t.id,p.players[0],chars.get(p.players[0]));await s.tournaments.prepare(t.id,p.players[1],chars.get(p.players[1]));const players=[...p.players].reverse().map(id=>({playerId:id,name:'SIM '+chars.get(id),character:chars.get(id),weapon:'kunai'})),state=createMatch(players);state.metrics[0].damage=2000;state.metrics[1].damage=400;
  await s.save({id:ctx.matchId,tournament:ctx,createdAt:Date.now(),mode:'tournament',players,winner:0,reason:'completed',wins:[2,0],playedTicks:1600,replay:{schema:1,rules:RULES_VERSION,frames:[{at:0,state}]}});await s.close();
  const db=new DatabaseSync(filename),legacy=JSON.parse(db.prepare('SELECT data FROM tournaments WHERE id=?').get(t.id).data),pair=legacy.rounds[0][0];delete pair.orderNormalized;delete pair.actualOrder;pair.score=[2,0];pair.damage=[2000,400];db.prepare('UPDATE tournaments SET data=? WHERE id=?').run(JSON.stringify(legacy),t.id);db.close();
  s=await createStore({filename});await s.tournaments.recover();const repaired=await s.tournaments.get(t.id),r=repaired.rounds[0][0];assert.deepEqual(r.score,[0,2]);assert.deepEqual(r.damage,[400,2000]);assert.deepEqual(r.actualOrder,players.map(p=>p.playerId));assert.equal(repaired.standings.find(v=>v.id===players[0].playerId).roundDifference,2);assert.equal(repaired.sideScheduleRebalanced,true);await s.tournaments.recover();assert.deepEqual((await s.tournaments.get(t.id)).rounds[0][0].damage,[400,2000]);assert.equal((await s.history()).length,1);
 }finally{await s.close();await rm(dir,{recursive:true,force:true});}
});
