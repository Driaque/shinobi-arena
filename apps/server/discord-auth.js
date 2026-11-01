import {randomBytes,createHash,timingSafeEqual} from 'node:crypto';
import {AccountError} from './accounts.js';
const nonce=()=>randomBytes(32).toString('base64url');
const digest=value=>createHash('sha256').update(value).digest('base64url');
const equal=(a,b)=>a.length===b.length&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
const valid=value=>typeof value==='string'&&/^[A-Za-z0-9_-]{43}$/.test(value);
const json=value=>JSON.stringify(value).replaceAll('<','\\u003c');
const userAgent='DiscordBot (https://github.com/Driaque/shinobi-arena, 1.0)';
export function createDiscordAuth({clientId=process.env.DISCORD_CLIENT_ID,clientSecret=process.env.DISCORD_CLIENT_SECRET,publicOrigin=process.env.PUBLIC_ORIGIN,allowedOrigins=[],request=fetch,now=()=>Date.now(),onFailure=()=>{}}={}){
 let origin;
 try{const u=new URL(publicOrigin);if(u.origin!==publicOrigin||u.username||u.password||!(u.protocol==='https:'||u.protocol==='http:'&&['localhost','127.0.0.1'].includes(u.hostname)))throw Error();origin=u.origin;}catch{}
 const trustedOrigins=new Set([origin,...allowedOrigins]);
 const enabled=Boolean(origin&&/^\d{5,25}$/.test(clientId??'')&&clientSecret);
 const flows=new Map(),grants=new Map();const lifetime=10*60000;
 const cookieName=flow=>'fr_oauth_'+flow.slice(0,16);
 const cookie=(flow,value,maxAge=600)=>`${cookieName(flow)}=${value}; Path=/auth/discord/callback; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${origin?.startsWith('https:')?'; Secure':''}`;
 function prune(){for(const [id,f]of flows)if(f.expires<=now())flows.delete(id);for(const [id,g]of grants)if(g.expires<=now())grants.delete(id);}
 function start({mode,requestKey,returnOrigin,playerId}){
  if(!enabled)throw new AccountError('Discord sign-in is not configured yet.',503);
  if(!valid(requestKey)||!['link','signin'].includes(mode)||!trustedOrigins.has(returnOrigin))throw new AccountError('Invalid sign-in request.');
  prune();if(flows.size>=1000||grants.size>=1000)throw new AccountError('Sign-in is busy. Try again shortly.',429);
  if(mode==='link'&&!playerId)throw new AccountError('Restore your player profile before linking Discord.',401);
  const flow=nonce();flows.set(flow,{mode,requestHash:digest(requestKey),returnOrigin,playerId,verifier:nonce(),expires:now()+lifetime,stage:'new'});
  return {flow,url:origin+'/auth/discord/authorize?flow='+flow};
 }
 function authorize(flow){
  prune();const f=flows.get(flow);if(!f||f.stage!=='new')throw new AccountError('Sign-in expired. Start again.');
  const binding=nonce();f.binding=digest(binding);f.stage='redirected';
  const url=new URL('https://discord.com/oauth2/authorize');
  for(const [key,value]of Object.entries({response_type:'code',client_id:clientId,scope:'identify',state:flow,redirect_uri:origin+'/auth/discord/callback',code_challenge:digest(f.verifier),code_challenge_method:'S256'}))url.searchParams.set(key,value);
  return {url:url.href,cookie:cookie(flow,binding)};
 }
 async function callback(params,cookies=''){
  prune();const flow=params.get('state'),f=flows.get(flow);
  if(!f||f.stage!=='redirected')throw new AccountError('Sign-in expired or already used. Start again.');
  const binding=cookies.split(';').map(v=>v.trim()).find(v=>v.startsWith(cookieName(flow)+'='))?.slice(cookieName(flow).length+1);
  if(!valid(binding)||!equal(digest(binding),f.binding))throw new AccountError('Sign-in browser verification failed. Start again.');
  flows.delete(flow);
  const clear=cookie(flow,'',0);
  if(params.has('error'))return {cookie:clear,html:completion(f.returnOrigin,{type:'fabled-discord',flow,error:'Discord authorization was cancelled. Your profile was not changed.'})};
  if(params.get('iss')!=='https://discord.com'||!params.get('code')||params.get('code').length>2048)throw new AccountError('Invalid Discord authorization response.');
  const form=new URLSearchParams({client_id:clientId,client_secret:clientSecret,grant_type:'authorization_code',code:params.get('code'),redirect_uri:origin+'/auth/discord/callback',code_verifier:f.verifier});
  let user,stage='token_request',status=null;
  try{
   const response=await request('https://discord.com/api/oauth2/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded','User-Agent':userAgent},body:form,signal:AbortSignal.timeout(15000)});
   status=response.status??null;if(!response.ok)throw Error();stage='token_response';const token=await response.json();
   if(token.token_type?.toLowerCase()!=='bearer'||typeof token.access_token!=='string'||!token.scope?.split(' ').includes('identify'))throw Error();
   stage='profile_request';status=null;const result=await request('https://discord.com/api/v10/users/@me',{headers:{Authorization:'Bearer '+token.access_token,'User-Agent':userAgent},signal:AbortSignal.timeout(15000)});
   status=result.status??null;if(!result.ok)throw Error();stage='profile_response';user=await result.json();if(!/^\d{5,25}$/.test(user?.id??''))throw Error();
  }catch(error){onFailure({stage,status:Number.isInteger(status)?status:null,timeout:error?.name==='TimeoutError'});throw new AccountError('Discord could not verify this sign-in. Your profile was not changed. Try again.',502);}
  const proof=nonce();grants.set(digest(proof),{...f,flow,user:{id:user.id,username:String(user.username??'').slice(0,80),global_name:String(user.global_name??'').slice(0,80)},expires:now()+60000});
  return {cookie:clear,html:completion(f.returnOrigin,{type:'fabled-discord',flow,proof})};
 }
 async function complete({flow,proof,requestKey,returnOrigin,playerId},accounts){
  prune();if(!valid(proof)||!valid(requestKey))throw new AccountError('Invalid sign-in confirmation.');
  const key=digest(proof),g=grants.get(key);
  if(!g||g.flow!==flow||!equal(g.requestHash,digest(requestKey))||g.returnOrigin!==returnOrigin||g.mode==='link'&&g.playerId!==playerId)throw new AccountError('Sign-in confirmation expired or did not match this browser. Start again.',401);
  grants.delete(key);return accounts.connect(g.user,{mode:g.mode,playerId:g.mode==='link'?g.playerId:null});
 }
 function completion(target,payload){const scriptNonce=nonce();return {nonce:scriptNonce,body:`<!doctype html><html lang="en"><meta charset="utf-8"><title>Fabled Rivals sign-in</title><p>Return to your Fabled Rivals game window to finish signing in. If this window was opened directly, close it and start sign-in from the game.</p><script nonce="${scriptNonce}">if(window.opener){window.opener.postMessage(${json(payload)},${json(target)});window.close();}</script></html>`};}
 return {enabled,start,authorize,callback,complete,origin};
}
