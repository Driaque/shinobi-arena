import {mountIcon} from './packages/ui/jutsu-icons.js';
import {experience} from './experience.js';
import {JUTSU_KEYS,moveEnvironment} from './packages/engine/techniques.js';
import {MOVES,moveFor} from './packages/engine/index.js';
export function createTechniqueTray({input,getPlayer,isPlaying,binding,visible=()=>true,onTouch=()=>{}}){
 const arena=document.querySelector('.arena');
 const toggle=document.createElement('button');toggle.id='jutsu-toggle';toggle.textContent='Jutsus';toggle.type='button';document.querySelector('.tools').append(toggle);
 const tray=document.createElement('section');tray.id='jutsu-tray';tray.hidden=true;tray.setAttribute('aria-label','Equipped jutsus and chakra charge');arena.append(tray);
 const strip=document.createElement('section');strip.id='combat-techniques';strip.className='combat-techniques';strip.setAttribute('aria-label','Equipped combat techniques');arena.append(strip);const quick=[];
 for(const key of [...JUTSU_KEYS,'charge','crouch','crouchGuard']){const b=document.createElement('button');b.type='button';b.dataset.quickAction=key;const art=document.createElement('span'),name=document.createElement('span'),status=document.createElement('small');art.className='technique-art';name.className='jutsu-name';status.className='jutsu-status';b.append(art,name,status);b._icon=art;b._name=name;b._status=status;let aiming=null;b.addEventListener('pointerdown',e=>{if(!isPlaying()||b.disabled)return;e.preventDefault();b.setPointerCapture(e.pointerId);const move=MOVES[moveFor(getPlayer(),key)];if(experience().aim&&move&&(move.projectile||move.ground)){aiming={id:e.pointerId,x:e.clientX,y:e.clientY,dx:getPlayer().facing,dz:0};b.classList.add('aiming');return;}onTouch(e,key==='crouchGuard'?'block':key);for(const action of key==='crouchGuard'?['crouch','block']:[key]){input.press(action,'quick:'+e.pointerId);b.classList.add('input-accepted');setTimeout(()=>b.classList.remove('input-accepted'),140);}});b.addEventListener('pointermove',e=>{if(!aiming||aiming.id!==e.pointerId)return;aiming.dx=Math.max(-1,Math.min(1,(e.clientX-aiming.x)/70));aiming.dz=Math.max(-1,Math.min(1,(e.clientY-aiming.y)/70));b.title=`Aim ${aiming.dx.toFixed(1)}, ${aiming.dz.toFixed(1)} · release to cast`;});for(const type of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(type,e=>{if(aiming?.id===e.pointerId){if(type==='pointerup'&&isPlaying()){onTouch(e,key);input.aim(aiming.dx,aiming.dz);input.press(key,'quick:'+e.pointerId);}aiming=null;b.classList.remove('aiming');}input.release('quick:'+e.pointerId);});strip.append(b);quick.push([key,b]);}
 const footer=document.createElement('section');
 footer.id='touch-combat-actions';
 footer.setAttribute('aria-label','Touch combat actions');
 footer.hidden=true;
 const primary=document.createElement('div'),extras=document.createElement('div');
 primary.className='touch-actions-primary';
 extras.className='touch-actions-extra';
 const next=document.createElement('button');
 next.type='button';
 next.className='touch-actions-next';
 next.textContent='More';
 footer.append(primary,extras);
 arena.append(footer);
 const equipment=id=>arena.querySelector('[data-control="'+id+'"]');
 const technique=id=>quick.find(([key])=>key===id)[1];
 const primaryButtons=[equipment('weapon'),equipment('useItem'),technique('special1'),technique('special2'),equipment('replacement')];
 const extraButtons=[equipment('cycleItem'),technique('charge'),technique('crouch'),technique('crouchGuard'),equipment('swapWeapon'),equipment('awakening'),...JUTSU_KEYS.slice(2).map(technique)];
 const homes=new Map([...primaryButtons,...extraButtons].map(button=>[button,button.parentElement]));
 let expanded=false,page=0,shownExtras='';
 function setTray(open){
   if(tray.hidden===!open)return;
   tray.hidden=!open;
   if(!open)input.release('chakra-charge');
 }
 function updateExtraPage(force=false){
   const available=extraButtons.filter(button=>!button.hidden);
   const signature=available.map(button=>button.dataset.control??button.dataset.quickAction).join('|');
   if(!force&&signature===shownExtras)return;
   shownExtras=signature;
   const pages=Math.ceil(available.length/4);
   page=page%Math.max(1,pages);
   const visible=new Set(available.slice(page*4,page*4+4));
   for(const button of extraButtons)button.classList.toggle('on-page',visible.has(button));
   next.hidden=pages<=1;
   next.setAttribute('aria-label','Next set of combat actions, page '+(page+1)+' of '+pages);
 }
 next.addEventListener('click',()=>{page++;updateExtraPage(true);});
 function syncTouchActions(playing){
   const useFooter=arena.dataset.controlPlacement==='expanded'&&!arena.classList.contains('controller-view');
   if(useFooter!==expanded){
     expanded=useFooter;
     arena.classList.toggle('touch-actions',expanded);
     setTray(false);
     page=0;
     if(expanded){
       primary.append(...primaryButtons);
       extras.append(...extraButtons,next);
       updateExtraPage(true);
     }else{
       for(const [button,parent]of homes)parent.append(button);
     }
   }
   footer.hidden=!expanded||!playing;
   strip.hidden=!playing||expanded;
   if(!playing)setTray(false);
   if(expanded&&playing)updateExtraPage();
 }
 const heading=document.createElement('header');heading.textContent='Combat kit';const close=document.createElement('button');close.textContent='Close';close.type='button';close.onclick=()=>setTray(false);heading.append(close);tray.prepend(heading);
 const grid=document.createElement('div');grid.className='jutsu-quick-grid';tray.append(grid);const nodes=[];
 for(const key of JUTSU_KEYS){const b=document.createElement('button');b.type='button';b.dataset.jutsuCast=key;b.addEventListener('click',()=>{if(!isPlaying()||b.disabled)return;input.press(key,'jutsu-menu');input.release('jutsu-menu');setTray(false);});const art=document.createElement('span');art.className='technique-art';b.append(art);b._icon=art;grid.append(b);nodes.push([key,b]);}
 const charge=document.createElement('button');charge.id='charge-chakra';charge.type='button';charge.textContent='Hold to charge chakra';charge.addEventListener('pointerdown',e=>{if(!isPlaying())return;e.preventDefault();charge.setPointerCapture(e.pointerId);input.press('charge','chakra-charge');});for(const type of ['pointerup','pointercancel','lostpointercapture'])charge.addEventListener(type,()=>input.release('chakra-charge'));tray.append(charge);
 const help=document.createElement('small');help.textContent='Charging is stationary, costs stamina and can be punished. Release to stop.';tray.append(help);
 toggle.addEventListener('click',()=>{setTray(tray.hidden);if(!tray.hidden)view.draw();});
 const view={draw(){const player=getPlayer(),playing=isPlaying();strip.hidden=!playing;if(!player){syncTouchActions(false);return;}for(const [key,b]of quick){const id=moveFor(player,key),m=MOVES[id],air=player.y>0||player.vy>0,environment=m?moveEnvironment(m):'';b.hidden=!visible(key)||(JUTSU_KEYS.includes(key)&&!m);b.disabled=!isPlaying()||key==='charge'&&(player.chakra>=100||player.stamina<1)||JUTSU_KEYS.includes(key)&&(!m||player.chakra<m.cost||(player.cooldowns[key]??0)>0||(environment==='air'&&!air)||(environment==='ground'&&air));const text=key==='charge'?`CHARGE · ${binding(key)} · ${Math.floor(player.chakra)}`:key==='crouchGuard'?'CROUCH GUARD':key==='crouch'?`CROUCH · ${binding(key)}`:`${m?.name??'Empty'} · ${player.cooldowns[key]>0?(player.cooldowns[key]/60).toFixed(1)+'s':binding(key)}`;b.title=m?`${m.name} · ${m.cost} chakra · ${environment==='air'&&!air?'Jump to use':environment==='ground'&&air?'Land to use':player.chakra<m.cost?'Not enough chakra':player.cooldowns[key]>0?'Cooling down':'Ready'}`:text;mountIcon(b._icon,m?id:key==='crouchGuard'?'shield':key==='charge'?'chakra':'crouch');const label=m?.name??(key==='crouchGuard'?'Crouch Guard':key==='charge'?'Charge':'Crouch');if(b._name.textContent!==label)b._name.textContent=label;const cooldown=player.cooldowns[key]??0,meta=cooldown>0?(cooldown/60).toFixed(1)+'s':key==='charge'?Math.floor(player.chakra):key==='crouchGuard'?'GUARD':binding(key);if(b._status.textContent!==String(meta))b._status.textContent=String(meta);b.setAttribute('aria-label',`${label} · ${cooldown>0?meta+' cooldown':m?m.cost+' chakra':meta}`);b.style.setProperty('--cooldown-progress',String(m?Math.max(0,Math.min(1,cooldown/(m.cooldown||1))):0));}syncTouchActions(playing);toggle.disabled=!playing;if(tray.hidden)return;const f=player;for(const [key,b]of nodes){const id=moveFor(f,key),m=MOVES[id];const air=f.y>0||f.vy>0,environment=m?moveEnvironment(m):'';b.disabled=!m||(environment==='air'&&!air)||(environment==='ground'&&air)||f.airTech||(air&&f.airAttacks>=4)||f.chakra<(m?.cost??0)||(f.cooldowns[key]??0)>0;const caption=m?`${m.name}${environment==='air'?' · AERIAL':m.airCombo?' · AIR COMBO':''} · ${binding(key)} · ${f.cooldowns[key]>0?(f.cooldowns[key]/60).toFixed(1)+'s':m.cost+' chakra'}`:'Empty slot';mountIcon(b._icon,id??'chakra');let label=b.querySelector('.jutsu-caption');if(!label){label=document.createElement('span');label.className='jutsu-caption';b.append(label);}label.textContent=caption;}charge.textContent=`Hold to charge · ${binding('charge')} · ${Math.floor(f.chakra)}/100`;}};
 return view;
}
