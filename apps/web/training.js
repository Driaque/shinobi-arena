import {DRILLS,createTraining,resetTraining,chargeTrainingAwakening,trainingReadout} from './packages/engine/training.js';
import {awakeningFor} from './packages/engine/index.js';
export function createTrainingUI({pause,clearInputs,getState,setState,getLoadouts,start,isTraining,isStarted,isEditing,binding}){
 const $=s=>document.querySelector(s),dialog=$('#training-dialog');
 const write=(id,value)=>{const node=$(id);if(node.textContent!==value)node.textContent=value;};
 let completed=[];try{const value=JSON.parse(localStorage.getItem('shinobi-arena.drills.v1'));if(Array.isArray(value))completed=[...new Set(value.filter(id=>id!=='free'&&Object.hasOwn(DRILLS,id)))];}catch{}
 const settings=()=>({drill:$('#training-drill').value,dummy:$('#training-dummy').value,unlimitedResources:$('#training-resources').checked,refillHealth:$('#training-health').checked,instantCooldowns:$('#training-cooldowns').checked,showRanges:$('#training-ranges').checked});
 function options(){
  $('#training-drill').replaceChildren();for(const [id,drill]of Object.entries(DRILLS))$('#training-drill').add(new Option(`${drill.name}${completed.includes(id)?' ✓':''}`,id));
 }
 options();
 function describe(){
  const id=$('#training-drill').value;$('#training-dummy').disabled=id!=='free';
  $('#training-drill-help').textContent=DRILLS[id].hint;
  $('#training-charge').disabled=!isStarted()||id!=='free'||!awakeningFor(getState().fighters[0]);
  $('#training-start').textContent=id==='free'?'Start free practice':'Start drill';
 }
 function open(){
  pause();clearInputs();const t=getState().training;
  if(t){$('#training-drill').value=t.drill;$('#training-dummy').value=t.dummy;for(const [id,key]of [['resources','unlimitedResources'],['health','refillHealth'],['cooldowns','instantCooldowns'],['ranges','showRanges']])$(`#training-${id}`).checked=t[key];}
  describe();dialog.showModal();
 }
 function close(){dialog.close();clearInputs();$('#training-settings').focus();}
 $('#training-settings').addEventListener('click',open);$('#training-close').addEventListener('click',close);
 dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
 $('#training-drill').addEventListener('change',describe);
 $('#training-start').addEventListener('click',()=>{setState(createTraining(getLoadouts(),settings()));dialog.close();clearInputs();start();});
 $('#training-charge').addEventListener('click',()=>{if(chargeTrainingAwakening(getState()))$('#training-drill-help').textContent='Form charged. Close Practice, resume, then press Awaken.';});
 $('#training-reset').addEventListener('click',()=>{if(isTraining()){setState(resetTraining(getState()));clearInputs();$('#training-reset').blur();}});
 function draw(){
  const state=getState(),t=state.training;
  $('#training-settings').hidden=!isTraining();$('#training-settings').disabled=isEditing();$('#training-reset').hidden=!isTraining();$('#training-reset').disabled=!isStarted()||isEditing();$('#training-coach').hidden=!isTraining();
  document.body.classList.toggle('training-mode',isTraining());
  if(!isTraining()||!t)return;
  const drill=DRILLS[t.drill];
  if(t.completed&&!completed.includes(t.drill)){
   completed.push(t.drill);try{localStorage.setItem('shinobi-arena.drills.v1',JSON.stringify(completed));}catch{}
   const selected=$('#training-drill').value;options();$('#training-drill').value=selected;
  }
  $('#training-reset').textContent=t.drill==='free'?'Reset':'Retry';
  $('#training-coach-title').textContent=t.drill==='free'?`FREE PRACTICE · ${t.dummy.toUpperCase()} DUMMY`:t.completed?`${drill.name} · COMPLETE`:`${drill.name} · ${t.step}/${drill.steps.length}`;
  $('#training-progress').hidden=t.drill==='free';$('#training-progress').max=drill.steps.length||1;$('#training-progress').value=t.step;
  const keys=t.drill==='movement'&&matchMedia('(any-pointer: coarse)').matches?'Stick up → center → up → double-pull sideways':t.drill==='movement'?`Jump ${binding('jump')} → Jump → Dash ${binding('dashForward')}`:t.drill==='combo'?`Basic ${binding('attack')} ×3`:t.drill==='counter'?`Guard ${binding('block')} → Weapon ${binding('weapon')}`:t.drill==='awakening'?`Awaken ${binding('awakening')}`:'';
  write('#training-instruction',t.completed?'Challenge complete · Retry or choose another drill in Practice':`${drill.steps[t.step]??'Explore your kit'}${keys?' · '+keys:''}`);
  const info=trainingReadout(state),phase=info.player.name==='Ready'?`${info.move}: ${info.stamina} stamina · ${info.chakra} chakra · ${info.range||'projectile'} range`:`${info.player.name.toUpperCase()} ${info.player.remaining}f`;
  $('#training-readout').textContent=`${phase} · Gap ${info.distance} · Dummy ${info.dummy.name.toLowerCase()}${info.dummy.remaining?' '+info.dummy.remaining+'f':''}`;
  write('#training-feedback',state.tick<=t.feedbackUntil?t.feedback:drill.hint);
  $('#training-record').textContent=`${completed.length}/4 challenges completed on this device. Starting a drill resets the arena.`;
 }
 return {draw,create:loadouts=>createTraining(loadouts,settings()),get open(){return dialog.open;}};
}
