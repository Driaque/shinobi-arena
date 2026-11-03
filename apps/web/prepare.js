import {CHARACTERS,WEAPONS} from './packages/engine/index.js';
export function createPreparation({getMode,getLoadouts,isPreparing,stages}){
 const $=s=>document.querySelector(s),panel=$('#loadout-panel'),dialog=$('#overlay .dialog');let step=0,confirmed=false;
 const nav=document.createElement('nav');nav.className='prepare-progress';nav.setAttribute('aria-label','Match preparation');
 const labels=['Fighter','Loadout','Battlefield & Ready'];
 labels.forEach((label,i)=>{const b=document.createElement('button');b.type='button';b.textContent=`${i+1}. ${label}`;b.onclick=()=>go(i);nav.append(b);});panel.before(nav);
 const review=document.createElement('section');review.id='prepare-review';panel.after(review);review.before(stages.element);
 const actions=document.createElement('div');actions.className='prepare-actions';actions.innerHTML='<button type="button" id="prepare-back">Back</button><button type="button" id="prepare-next" class="primary">Next</button>';$('#play').before(actions);actions.append($('#play'));
 const consent=document.createElement('label');consent.className='stage-consent';consent.innerHTML='<input type="checkbox" id="local-stage-agree"> Player two agrees to this stage (or Random)';stages.element.append(consent);
 function go(i){step=Math.max(0,Math.min(2,i));draw();if(isPreparing())nav.querySelectorAll('button')[step].focus();}
 function draw(){
  const active=isPreparing(),mode=getMode();dialog.dataset.prepare=active?String(step):'off';nav.hidden=!active;actions.hidden=false;$('#prepare-back').hidden=!active;$('#prepare-next').hidden=!active;review.hidden=!active||step!==2;
  stages.element.hidden=!active||step!==2;consent.hidden=mode!=='local';
  if(!active)return;
  stages.refresh();const automatic=mode==='online'&&$('#online-queue').value==='ranked';stages.element.querySelector('.stage-grid').hidden=automatic;
  if(automatic)$('#stage-current').textContent='Ranked: server randomly selects from the competitive stage pool.';
  nav.querySelectorAll('button').forEach((b,i)=>{b.setAttribute('aria-current',i===step?'step':'false');});
  panel.hidden=step===2;$('#prepare-back').disabled=step===0;$('#prepare-next').hidden=step===2;
  $('#play').hidden=step!==2;$('#play').disabled=mode==='local'&&!confirmed;
  $('#overlay-title').textContent=labels[step];$('#overlay-description').textContent=['Choose your fighter, then confirm with Next.','Your saved build is ready. Customize jutsus, weapons and consumables if you wish.','Review your choices and ready up. Online casual stages are agreed after pairing.'][step];
  $('#online-lobby').hidden=mode!=='online'||step!==2;
  if(step===2){review.replaceChildren();getLoadouts().slice(0,mode==='online'?1:2).forEach((l,i)=>{const p=document.createElement('p');p.textContent=`${i===0?'You':mode==='local'?'Player two':'Opponent'}: ${CHARACTERS[l.character].name} · ${l.weapons.filter(Boolean).map(id=>WEAPONS[id].name).join(' + ')} · ${l.jutsus.filter(Boolean).length}/7 jutsus · ${l.items.filter(Boolean).length}/4 items`;review.append(p);});}
 }
 $('#prepare-back').onclick=()=>go(step-1);$('#prepare-next').onclick=()=>go(step+1);consent.querySelector('input').onchange=e=>{confirmed=e.target.checked;draw();};
 stages.element.addEventListener('click',e=>{if(e.target.closest('[data-stage]')){confirmed=false;consent.querySelector('input').checked=false;draw();}});
 $('#online-queue').addEventListener('change',draw);
 $('#mode').addEventListener('change',()=>{step=0;confirmed=false;consent.querySelector('input').checked=false;draw();});
 // Existing render callbacks control the overlay; redraw only when its preparation state changes.
 let activeLast;new MutationObserver(()=>{const active=isPreparing();if(active!==activeLast){activeLast=active;if(active)step=0;draw();}}).observe($('#overlay'),{attributes:true,subtree:true,attributeFilter:['hidden']});
 draw();return {draw,reset:()=>go(0)};
}
