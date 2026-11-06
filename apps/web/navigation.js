import {apiBase,arenaRequest,profileToken} from './arena-api.js';

export function createNavigation({hub,isBusy=()=>false}){
 const tools=document.querySelector('.tools');
 function group(id,label){const details=document.createElement('details');details.id=id;details.className='nav-group';const summary=document.createElement('summary');summary.textContent=label;const panel=document.createElement('div');panel.className='nav-panel';details.append(summary,panel);return {details,panel};}
 const menu=group('game-menu','Menu'),settings=group('game-settings','Settings');
 for(const selector of ['.adventures-link','#account-profile','.mode-label','#arena-hub']){const node=tools.querySelector(selector);if(node)menu.panel.append(node);}
 const ranking=document.createElement('button');ranking.id='rankings';ranking.textContent='Rankings';ranking.onclick=()=>hub.open('leaderboard');menu.panel.querySelector('#account-profile').after(ranking);
 for(const selector of ['.difficulty-label','#control-settings','#audio-settings','#graphics-settings','#experience-settings','#training-settings','#training-reset']){const node=tools.querySelector(selector);if(node)settings.panel.append(node);}
 tools.prepend(menu.details,settings.details);
 function placePanels(){for(const g of [menu,settings])if(g.details.open){const v=window.visualViewport,r=g.details.querySelector('summary').getBoundingClientRect(),left=v?.offsetLeft??0,top=v?.offsetTop??0,width=v?.width??innerWidth,height=v?.height??innerHeight;const y=Math.min(r.bottom+6,top+height-60);Object.assign(g.panel.style,{position:'fixed',left:Math.max(left+8,Math.min(r.left,left+width-Math.min(300,width-16)-8))+'px',right:'auto',top:y+'px',width:Math.min(300,width-16)+'px',maxHeight:Math.max(44,top+height-y-8)+'px'});}}
 for(const g of [menu,settings])g.details.addEventListener('toggle',placePanels);
 window.addEventListener('resize',placePanels);window.addEventListener('scroll',placePanels,true);window.visualViewport?.addEventListener('resize',placePanels);
 for(const current of [menu,settings]){current.details.addEventListener('toggle',()=>{if(current.details.open)for(const other of [menu,settings])if(other!==current)other.details.open=false;});current.panel.addEventListener('click',e=>{if(e.target.closest('button,a'))current.details.open=false;});}
 document.addEventListener('click',e=>{for(const g of [menu,settings])if(!g.details.contains(e.target))g.details.open=false;});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){menu.details.open=false;settings.details.open=false;}});
 const account=document.createElement('button');account.id='account-status';account.setAttribute('aria-live','polite');account.textContent='Guest';account.onclick=()=>hub.open('profile');tools.append(account);
 const entry=document.createElement('section');entry.id='account-entry';entry.setAttribute('aria-label','Choose how to play');
 entry.innerHTML='<p>Welcome, rival. Sign in to use your Discord profile, or continue as a guest.</p><button id="entry-signin">Sign in with Discord</button><button id="entry-guest">Continue as guest</button><p id="entry-status" role="status"></p>';
 document.querySelector('#overlay-description').after(entry);
 let guest=false,request=0;try{guest=sessionStorage.getItem('fabled.guest')==='yes';}catch{}
 entry.hidden=guest;
 entry.querySelector('#entry-signin').onclick=()=>{if(isBusy())return;hub.open('profile');};
 entry.querySelector('#entry-guest').onclick=()=>{guest=true;entry.hidden=true;try{sessionStorage.setItem('fabled.guest','yes');}catch{}};
 async function refresh(){const id=++request;try{const base=await apiBase(),token=profileToken(base);if(id!==request)return;
  if(!token){account.textContent='Guest · Sign in';entry.hidden=guest;return;}
  const data=await arenaRequest('/api/me',{base,token});if(id!==request)return;
  const signedIn=Boolean(data.auth?.session);account.textContent=signedIn?`Signed in · ${data.player.name}`:`Guest · ${data.player.name}`;account.title=signedIn?'Signed in with Discord. Open your profile.':'Guest profile. Open your profile to sign in.';entry.hidden=signedIn||guest;
  if(!signedIn)entry.querySelector('#entry-status').textContent='Your guest profile is available on this device.';
 }catch{if(id!==request)return;account.textContent='Account · Retry';account.title='Account status could not be verified. Open your profile to retry.';entry.querySelector('#entry-status').textContent='Sign-in needs the arena server. You can continue as a guest.';}}
 window.addEventListener('arena:identity',refresh);window.addEventListener('focus',refresh);window.addEventListener('storage',refresh);refresh();
 return {refresh};
}
