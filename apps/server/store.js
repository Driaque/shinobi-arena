import {createProgression} from './progression.js';
import {createAccounts} from './accounts.js';
import {createTournaments} from './tournaments.js';
import {aggregateMeta} from '../../packages/engine/meta.js';
import {RULES_VERSION} from '../../packages/engine/index.js';
import {randomBytes,randomUUID,createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
const hash=token=>createHash('sha256').update(token).digest('hex');
export const tier=p=>p.ratedGames<5?'Placement':p.rating>=1600?'Kage':p.rating>=1400?'Jōnin':p.rating>=1200?'Chūnin':'Genin';
export async function createStore({databaseURL=process.env.DATABASE_URL,filename=':memory:',now=()=>Date.now()}={}){
 let query,shutdown,pool,postgres=Boolean(databaseURL);
 if(postgres){const {default:pg}=await import('pg');pool=new pg.Pool({connectionString:databaseURL,max:3,connectionTimeoutMillis:8000,statement_timeout:10000,options:'-c search_path=shinobi_arena'});query=async(sql,values=[])=>{const r=await pool.query(sql,values);return r.rows;};shutdown=()=>pool.end();}
 else{const {DatabaseSync}=await import('node:sqlite');const db=new DatabaseSync(filename);db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000');query=async(sql,values=[])=>values.length?db.prepare(sql).all(Object.fromEntries(values.map((v,i)=>['$'+(i+1),v]))):db.prepare(sql).all();shutdown=()=>db.close();}
 if(postgres)await query('CREATE SCHEMA IF NOT EXISTS shinobi_arena');
 await query(`CREATE TABLE IF NOT EXISTS players(id TEXT PRIMARY KEY, token_hash TEXT UNIQUE NOT NULL,name TEXT NOT NULL,rating INTEGER NOT NULL DEFAULT 1000,games INTEGER NOT NULL DEFAULT 0,wins INTEGER NOT NULL DEFAULT 0,losses INTEGER NOT NULL DEFAULT 0,draws INTEGER NOT NULL DEFAULT 0,rated_games INTEGER NOT NULL DEFAULT 0,created_at BIGINT NOT NULL)`);
 await query(`CREATE TABLE IF NOT EXISTS matches(id TEXT PRIMARY KEY,created_at BIGINT NOT NULL,rules TEXT NOT NULL,participants TEXT NOT NULL,result TEXT NOT NULL,archive ${postgres?'BYTEA':'BLOB'},pair_key TEXT NOT NULL,ranked INTEGER NOT NULL)`);
 await query('CREATE INDEX IF NOT EXISTS matches_created ON matches(created_at)');await query('CREATE INDEX IF NOT EXISTS matches_pair ON matches(pair_key,created_at)');await query('CREATE INDEX IF NOT EXISTS players_rating ON players(rating DESC,id)');
 // Serialize writes. PostgreSQL uses one checked-out client and a transaction advisory lock.
 let tail=Promise.resolve();
 async function transaction(fn){
  const run=async()=>{
   if(postgres){const client=await pool.connect();const q=async(s,v=[])=>{const r=await client.query(s,v);return r.rows;};try{await q('BEGIN');await q('SELECT pg_advisory_xact_lock(177013)');const value=await fn(q);await q('COMMIT');return value;}catch(e){await q('ROLLBACK');throw e;}finally{client.release();}}
   await query('BEGIN IMMEDIATE');try{const value=await fn(query);await query('COMMIT');return value;}catch(e){await query('ROLLBACK');throw e;}
  };const pending=tail.then(run);tail=pending.catch(()=>{});return pending;
 }
 const progression=await createProgression({query,transaction,now});
 const tournaments=await createTournaments({query,transaction,now});
 const publicPlayer=p=>p?{id:p.id,name:p.name,rating:Number(p.rating),games:Number(p.games),wins:Number(p.wins),losses:Number(p.losses),draws:Number(p.draws),ratedGames:Number(p.rated_games),tier:tier({rating:Number(p.rating),ratedGames:Number(p.rated_games)})}:null;
 const accounts=await createAccounts({query,transaction,now,publicPlayer});
 async function identity(token){if(typeof token!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(token))return null;return publicPlayer((await query('SELECT * FROM players WHERE token_hash=$1',[hash(token)]))[0])??await accounts.identity(token);}
 async function createIdentity(name){const id=randomUUID(),token=randomBytes(32).toString('base64url');await transaction(q=>q('INSERT INTO players(id,token_hash,name,created_at) VALUES($1,$2,$3,$4)',[id,hash(token),name,now()]));return {token,player:await identity(token)};}
 async function rename(id,name){await transaction(q=>q('UPDATE players SET name=$1 WHERE id=$2',[name,id]));}
 async function save(record){return transaction(async q=>{
  if((await q('SELECT id FROM matches WHERE id=$1',[record.id])).length)return {duplicate:true};
  const ids=record.players.map(p=>p.playerId??null),pairKey=ids.every(Boolean)?[...ids].sort().join(':'):record.id;
  const day=new Date(record.createdAt);day.setUTCHours(0,0,0,0);
  const pairCount=Number((await q('SELECT COUNT(*) AS n FROM matches WHERE pair_key=$1 AND ranked=1 AND created_at>=$2',[pairKey,day.getTime()]))[0].n);
  const benchmark=record.tournament?.benchmark===true;
  const ranked=!benchmark&&record.mode==='ranked'&&ids.every(Boolean)&&ids[0]!==ids[1]&&record.reason!=='cancelled';
  const enough=record.playedTicks>=1200,eligible=ranked&&pairCount<3;
  const players=await Promise.all(ids.map(async id=>id?(await q('SELECT * FROM players WHERE id=$1',[id]))[0]:null));
  const deltas=[0,0];
  if(eligible&&players.every(Boolean)){
   for(let i=0;i<2;i++){const score=record.winner===null?.5:record.winner===i?1:0;const expected=1/(1+10**((players[1-i].rating-players[i].rating)/400));deltas[i]=enough?Math.round(24*(score-expected)):record.winner!==null&&record.winner!==i?-12:0;}
  }
  for(let i=0;i<2;i++)if(!benchmark&&players[i]&&record.reason!=='cancelled'){
   const won=record.winner===i,lost=record.winner!==null&&!won,draw=record.winner===null;
   await q('UPDATE players SET games=games+1,wins=wins+$1,losses=losses+$2,draws=draws+$3,rating=rating+$4,rated_games=rated_games+$5 WHERE id=$6',[Number(won),Number(lost),Number(draw),deltas[i],Number(eligible&&(enough||lost)),ids[i]]);
  }
  const result={winner:record.winner,reason:record.reason,wins:record.wins,mode:record.mode,playedTicks:record.playedTicks,ratingDelta:deltas,rated:eligible&&enough,rankingNote:!ranked?'Casual or cancelled':pairCount>=3?'Pair limit: first 3 ranked matches per day affect rating':!enough?'Under 20 seconds: no winner reward; forfeiting player loses 12 rating':'Rated'};
  if(record.tournament){result.tournament=record.tournament;result.rankingNote=benchmark?'Character benchmark · player standings and rewards unchanged':'Tournament · Elo unchanged';}
  const archive=gzipSync(Buffer.from(JSON.stringify(record.replay)),{level:6});if(archive.length>4*1024*1024)throw new Error('Replay exceeds archive limit');
  await q('INSERT INTO matches(id,created_at,rules,participants,result,archive,pair_key,ranked) VALUES($1,$2,$3,$4,$5,$6,$7,$8)',[record.id,record.createdAt,record.replay.rules,JSON.stringify(record.players),JSON.stringify(result),archive,pairKey,Number(ranked)]);
  await tournaments.complete(q,record);
  await progression.complete(q,record,pairKey);
  await q('UPDATE matches SET archive=NULL WHERE created_at<$1',[now()-14*86400000]);
  await q('UPDATE matches SET archive=NULL WHERE id IN (SELECT id FROM matches WHERE archive IS NOT NULL ORDER BY created_at DESC LIMIT 10000 OFFSET 200)');
  return {id:record.id,result};
 });}
 async function leaderboard({offset=0,limit=25}={}){const rows=await query('SELECT * FROM players WHERE games>0 ORDER BY rating DESC,rated_games DESC,id LIMIT $1 OFFSET $2',[limit,offset]);return rows.map((p,i)=>({...publicPlayer(p),position:offset+i+1}));}
 async function history({offset=0,limit=20,playerId=null}={}){const filter=playerId?' WHERE participants LIKE $3':'';const args=[limit,offset,...(playerId?['%"playerId":"'+playerId+'"%']:[])];const rows=await query('SELECT id,created_at,rules,participants,result,CASE WHEN archive IS NULL THEN 0 ELSE 1 END AS replay_available FROM matches'+filter+' ORDER BY created_at DESC LIMIT $1 OFFSET $2',args);return rows.map(r=>({id:r.id,createdAt:Number(r.created_at),rules:r.rules,players:JSON.parse(r.participants),result:JSON.parse(r.result),replayAvailable:Boolean(r.replay_available)}));}
 async function replay(id){return (await query('SELECT archive FROM matches WHERE id=$1',[id]))[0]?.archive??null;}
 let metaCache=null,metaAt=0;
 async function meta(){if(metaCache&&now()-metaAt<60000)return metaCache;const rows=await query('SELECT rules,participants,result FROM matches WHERE rules=$1 AND ranked=1 AND created_at>=$2 ORDER BY created_at DESC LIMIT 500',[RULES_VERSION,now()-30*86400000]);metaCache=aggregateMeta(rows.map(r=>({rules:r.rules,players:JSON.parse(r.participants),result:JSON.parse(r.result)})),RULES_VERSION);metaAt=now();return metaCache;}
 return {progression,accounts,tournaments,meta,createIdentity,identity,rename,save,leaderboard,history,replay,durable:postgres||filename!==':memory:',kind:postgres?'postgres':'sqlite',ping:()=>query('SELECT 1 AS ok'),close:async()=>{await tail;await shutdown();}};
}
