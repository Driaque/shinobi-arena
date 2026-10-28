import {JUTSU_KEYS} from './packages/engine/techniques.js';
import {MOVES,moveFor} from './packages/engine/index.js';
export function createTechniqueTray({input,getPlayer,isPlaying,binding}){
 const toggle=document.createElement('button');toggle.id='jutsu-toggle';toggle.textContent='Jutsus';toggle.type='button';document.querySelector('.tools').append(toggle);
 const tray=document.createElement('section');tray.id='jutsu-tray';tray.hidden=true;tray.setAttribute('aria-label','Equipped jutsus and chakra charge');document.querySelector('.arena').append(tray);
 const heading=document.createElement('header');heading.textContent='EQUIPPED JUTSUS · choose a technique';const close=document.createElement('button');close.textContent='Close';close.type='button';close.onclick=()=>{tray.hidden=true;input.release('chakra-charge');};heading.append(close);tray.append(heading);
 const grid=document.createElement('div');grid.className='jutsu-quick-grid';tray.append(grid);const nodes=[];
 for(const key of JUTSU_KEYS){const b=document.createElement('button');b.type='button';b.dataset.jutsuCast=key;b.addEventListener('click',()=>{if(!isPlaying()||b.disabled)return;input.press(key,'jutsu-menu');input.release('jutsu-menu');tray.hidden=true;});grid.append(b);nodes.push([key,b]);}
 const charge=document.createElement('button');charge.id='charge-chakra';charge.type='button';charge.textContent='Hold to charge chakra';charge.addEventListener('pointerdown',e=>{if(!isPlaying())return;e.preventDefault();charge.setPointerCapture(e.pointerId);input.press('charge','chakra-charge');});for(const type of ['pointerup','pointercancel','lostpointercapture'])charge.addEventListener(type,()=>input.release('chakra-charge'));tray.append(charge);
 const help=document.createElement('small');help.textContent='Charging is stationary, costs stamina and can be punished. Release to stop.';tray.append(help);
 toggle.addEventListener('click',()=>{tray.hidden=!tray.hidden;if(tray.hidden)input.release('chakra-charge');});
 return {draw(){toggle.disabled=!isPlaying();if(!isPlaying()){tray.hidden=true;input.release('chakra-charge');}const f=getPlayer();for(const [key,b]of nodes){const id=moveFor(f,key),m=MOVES[id];b.disabled=!m||f.chakra<(m?.cost??0)||(f.cooldowns[key]??0)>0;b.textContent=m?`${m.name} · ${binding(key)} · ${f.cooldowns[key]>0?(f.cooldowns[key]/60).toFixed(1)+'s':m.cost+' chakra'}`:'Empty slot';}charge.textContent=`Hold to charge · ${binding('charge')} · ${Math.floor(f.chakra)}/100`;}};
}
