import {arenaRequest,profileToken,restoreIdentity} from './arena-api.js';
const key=base=>`shinobi.profile.v1.${base}`;
const requestKey=()=>{const bytes=crypto.getRandomValues(new Uint8Array(32));return btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');};
let pending=null;
export function startDiscord({base,mode,isBusy=()=>false,onDone=()=>{},onError=()=>{}}){
 if(isBusy()){onError('Leave your match or queue before changing accounts.');return;}
 if(pending){onError('Finish or close the current Discord sign-in window first.');return;}
 const popup=window.open('about:blank','fabled-discord','popup,width=520,height=760');
 if(!popup){onError('Allow popups for this game, then try Discord sign-in again.');return;}
 const token=profileToken(base),secret=requestKey(),expectedOrigin=new URL(base).origin;
 let timer,poll;
 const close=()=>{clearTimeout(timer);clearInterval(poll);window.removeEventListener('message',receive);popup.close();pending=null;};
 const fail=message=>{close();onError(message);};
 const receive=async event=>{
  if(event.source!==popup||event.origin!==expectedOrigin||event.data?.type!=='fabled-discord'||!pending||event.data.flow!==pending.flow)return;
  if(event.data.error){fail(event.data.error);return;}
  const flow=pending.flow;clearTimeout(timer);clearInterval(poll);window.removeEventListener('message',receive);
  try{
   if(isBusy()||profileToken(base)!==token)throw Error('Your profile or match changed during sign-in. Start again from My profile.');
   const value=await arenaRequest('/api/auth/discord/complete',{base,token:mode==='link'?token:undefined,method:'POST',body:{flow,proof:event.data.proof,requestKey:secret}});
   if(isBusy()||profileToken(base)!==token)throw Error('Your profile changed. Sign in again to use the Discord account; no profiles were merged.');
   // Verify the game session before replacing the browser's current credential.
   await restoreIdentity(value.token,base);close();onDone(value.player);
  }catch(e){fail(e.message);}
 };
 pending={popup,flow:null};
 window.addEventListener('message',receive);
 timer=setTimeout(()=>fail('Discord sign-in expired. Your current profile was not replaced.'),10*60000);
 poll=setInterval(()=>{if(popup.closed)fail('Discord sign-in window closed. Try again from My profile.');},1000);
 arenaRequest('/api/auth/discord/start',{base,token:mode==='link'?token:undefined,method:'POST',body:{mode,requestKey:secret}}).then(value=>{
  if(!pending||pending.popup!==popup||popup.closed)return;
  const url=new URL(value.url);if(url.origin!==expectedOrigin||url.pathname!=='/auth/discord/authorize')throw Error('Unexpected sign-in destination.');
  pending.flow=value.flow;popup.location.href=url.href;
 }).catch(e=>{if(pending?.popup===popup)fail(e.message);});
}
export async function logoutDiscord(base){
 const token=profileToken(base);await arenaRequest('/api/auth/discord/logout',{base,token,method:'POST'});
 if(profileToken(base)===token)localStorage.removeItem(key(base));
}
