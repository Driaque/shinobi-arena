import {randomBytes,randomUUID,createHash} from 'node:crypto';
export class AccountError extends Error{constructor(message,status=400){super(message);this.status=status;}}
const hash=value=>createHash('sha256').update(value).digest('hex');
export async function createAccounts({query,transaction,now,publicPlayer}){
 await query('CREATE TABLE IF NOT EXISTS account_links(provider TEXT NOT NULL,subject TEXT NOT NULL,player_id TEXT NOT NULL,label TEXT NOT NULL,PRIMARY KEY(provider,subject),UNIQUE(provider,player_id))');
 await query('CREATE TABLE IF NOT EXISTS player_sessions(token_hash TEXT PRIMARY KEY,player_id TEXT NOT NULL,expires_at BIGINT NOT NULL)');
 await query('CREATE INDEX IF NOT EXISTS sessions_player ON player_sessions(player_id,expires_at)');
 const valid=token=>typeof token==='string'&&/^[A-Za-z0-9_-]{43}$/.test(token);
 async function identity(token){if(!valid(token))return null;const row=(await query('SELECT p.* FROM players p JOIN player_sessions s ON s.player_id=p.id WHERE s.token_hash=$1 AND s.expires_at>$2',[hash(token),now()]))[0];return publicPlayer(row);}
 async function info(token,playerId){const link=(await query('SELECT label FROM account_links WHERE provider=$1 AND player_id=$2',['discord',playerId]))[0];const session=valid(token)?(await query('SELECT expires_at FROM player_sessions WHERE token_hash=$1 AND player_id=$2 AND expires_at>$3',[hash(token),playerId,now()]))[0]:null;return {provider:link?'discord':null,label:link?.label??null,session:Boolean(session),expiresAt:session?Number(session.expires_at):null};}
 async function connect(user,{mode,playerId=null}={}){
  if(!/^\d{5,25}$/.test(user?.id??'')||!['link','signin'].includes(mode))throw new AccountError('Invalid account request.');
  return transaction(async q=>{
   const linked=(await q('SELECT player_id FROM account_links WHERE provider=$1 AND subject=$2',['discord',user.id]))[0];
   let id=linked?.player_id;
   if(mode==='link'){
    if(!playerId||!(await q('SELECT id FROM players WHERE id=$1',[playerId])).length)throw new AccountError('Restore your profile before linking Discord.',401);
    if(id&&id!==playerId)throw new AccountError('This Discord account is linked to a different profile. No progress was changed. Sign in to that account instead.',409);
    const other=(await q('SELECT subject FROM account_links WHERE provider=$1 AND player_id=$2',['discord',playerId]))[0];
    if(other&&other.subject!==user.id)throw new AccountError('This profile already has a different Discord account. No progress was changed.',409);
    id=playerId;
   }
   const label=String(user.global_name||user.username||'Discord player').slice(0,80);
   if(!id){id=randomUUID();const name=label.replace(/[^\p{L}\p{N} _.-]/gu,'').trim().slice(0,20)||'Player';const root=randomBytes(32).toString('base64url');await q('INSERT INTO players(id,token_hash,name,created_at) VALUES($1,$2,$3,$4)',[id,hash(root),name.length<2?'Player':name,now()]);}
   if(!linked)await q('INSERT INTO account_links(provider,subject,player_id,label) VALUES($1,$2,$3,$4)',['discord',user.id,id,label]);
   else await q('UPDATE account_links SET label=$1 WHERE provider=$2 AND subject=$3',[label,'discord',user.id]);
   await q('DELETE FROM player_sessions WHERE expires_at<=$1',[now()]);
   const token=randomBytes(32).toString('base64url'),expiresAt=now()+30*86400000;
   await q('DELETE FROM player_sessions WHERE token_hash IN (SELECT token_hash FROM player_sessions WHERE player_id=$1 ORDER BY expires_at DESC,token_hash DESC LIMIT 10000 OFFSET 9)',[id]);
   await q('INSERT INTO player_sessions(token_hash,player_id,expires_at) VALUES($1,$2,$3)',[hash(token),id,expiresAt]);
   return {token,player:publicPlayer((await q('SELECT * FROM players WHERE id=$1',[id]))[0]),expiresAt};
  });
 }
 async function logout(token){if(valid(token))await transaction(q=>q('DELETE FROM player_sessions WHERE token_hash=$1',[hash(token)]));}
 return {identity,info,connect,logout};
}
