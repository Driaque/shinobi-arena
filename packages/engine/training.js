import {createMatch,stepMatch,moveFor,MOVES,CHARACTERS,awakeningFor,awakeningReady,staminaCost} from './index.js';
export const DRILLS=Object.freeze({
 free:{name:'Free practice',steps:[],hint:'Explore your kit. Set a dummy behavior, inspect ranges, and reset whenever you like.'},
 movement:{name:'Double jump → air dash',steps:['Jump','Jump again in the air','Dash before landing'],hint:'Press Jump twice; double-pull sideways to air dash. Analog up/down changes lane. Save the dash until after the second jump.'},
 combo:{name:'Three-hit combo',steps:['Land the opening basic','Link the second basic','Land the launching finisher'],hint:'Tap Basic with rhythm. Each follow-up needs a confirmed hit; holding does not repeat.'},
 counter:{name:'Guard → weapon counter',steps:['Guard or parry a strike','Land a weapon during the opening'],hint:'The dummy swings a katana every 2.5 seconds. Guard, release, then punish with your equipped weapon.'},
 awakening:{name:'Unlock your awakening',steps:['Take damage to fill the meter','Awaken when free to act'],hint:'Let the dummy hit you until READY, then wait for hitstun to end and press Awaken. HP refills do not remove damage charge.'}
});
const validDrill=id=>Object.hasOwn(DRILLS,id)?id:'free';
const defaults={drill:'free',dummy:'idle',unlimitedResources:true,refillHealth:true,instantCooldowns:false,showRanges:true};
export function createTraining(loadouts,options={}){
 const config={...defaults};for(const key of ['unlimitedResources','refillHealth','instantCooldowns','showRanges'])if(typeof options[key]==='boolean')config[key]=options[key];
 config.drill=validDrill(options.drill);config.dummy=['idle','guard','attack','projectile','aerial','counter','recorded'].includes(options.dummy)?options.dummy:'idle';
 let selected=loadouts?loadouts.map(l=>({...l})):undefined;
 let note='';
 if(config.drill==='awakening'&&selected&&!CHARACTERS[selected[0]?.character]?.awakening){selected[0]={...selected[0],character:'winta',jutsus:undefined};note='This drill uses Winta because the selected fighter has no awakening.';}
 if(config.drill==='counter'){selected??=[{character:'naruto',weapon:'kunai'},{character:'sasuke',weapon:'katana'}];selected[1].weapon='katana';if(selected[1].weapons)selected[1].weapons=['katana',selected[1].weapons[1]];}
 const state=createMatch(selected);
 state.fighters[0].x=600;state.fighters[1].x=670;
 state.training={...config,step:0,completed:false,feedback:note||DRILLS[config.drill].hint,feedbackUntil:240,note,guardTick:-1000,parried:false,stats:{damage:0,hits:0,bestCombo:0}};
 return state;
}
export function resetTraining(state){if(!state.training)throw new Error('Training state required');const next=createTraining(state.loadouts,state.training);next.training.sequence=structuredClone(state.training.sequence??[]);return next;}
export function chargeTrainingAwakening(state){
 if(!state.training||state.training.drill!=='free')return false;
 const f=state.fighters[0],form=awakeningFor(f);if(!form)return false;
 f.damageTaken=Math.max(f.damageTaken,form.threshold);f.awakeningUsed=false;f.awakeningTicks=0;f.awakeningFlash=0;
 state.training.feedback='Awakening charged for free practice. Wait until free to act, then press Awaken.';state.training.feedbackUntil=state.tick+180;return true;
}
export function dummyInput(state){
 const t=state.training;if(!t||t.completed)return {};
 if(t.recording)return {};
 const f=state.fighters[1],other=state.fighters[0];
 const behavior=t.drill==='counter'||t.drill==='awakening'?'attack':t.drill==='free'?t.dummy:'idle';
 if(t.drill==='awakening'&&awakeningReady(other))return {};
 if(behavior==='recorded'){const data=t.sequence??[];if(!data.length)return {};const sample=data[Math.max(0,state.tick-1-(t.playbackStart??0))%data.length];return {...sample,left:sample.right,right:sample.left,moveX:-(sample.moveX??0),aimX:Number.isFinite(sample.aimX)?-sample.aimX:undefined};}
 if(behavior==='counter'){if(other.action)return {block:true};return state.tick%100===0?{weapon:true}:{};}
 if(behavior==='projectile')return state.tick%90===0?{special2:true}:{};
 if(behavior==='aerial')return state.tick%100===0?{jump:true}:f.y>0&&state.tick%20===0?{attack:true}:{};
 if(behavior==='guard')return {block:true};
 if(behavior!=='attack'||f.stun||f.action||f.dash)return {};
 const distance=Math.abs(f.x-other.x);
 if(distance>80)return {left:f.x>other.x,right:f.x<other.x};
 const cycle=t.drill==='awakening'?75:150,key=t.drill==='counter'?'weapon':'attack';
 if(state.tick>=60&&(state.tick-60)%cycle===0&&f.stamina>=staminaCost(key)&&!(f.cooldowns[key]>0))return {[key]:true};
 return {};
}
export function actionPhase(f){
 if(f.stun>0)return {name:'Hitstun',remaining:f.stun};
 if(f.dash)return {name:f.dash.air?'Air dash':'Dash',remaining:f.dash.remaining};
 if(!f.action)return {name:'Ready',remaining:0};
 const m=MOVES[f.action.move],age=f.action.age;
 if(age<m.startup)return {name:'Startup',remaining:Math.ceil(m.startup-age)};
 if(age<m.startup+m.active)return {name:'Active',remaining:Math.ceil(m.startup+m.active-age)};
 return {name:'Recovery',remaining:Math.ceil(m.startup+m.active+m.recovery+(f.action.recoveryPenalty??0)-age)};
}
export function trainingReadout(state){
 const f=state.fighters[0],other=state.fighters[1],move=MOVES[f.action?.move??moveFor(f,'attack')];
 return {player:actionPhase(f),dummy:actionPhase(other),distance:Math.round(Math.abs(f.x-other.x)),range:move.reach,move:move.name,chakra:move.cost,stamina:f.action?.chain?staminaCost('attack',f.action.chain):f.action?f.action.move===moveFor(f,'weapon')?16:0:12};
}
function hint(state,message){state.training.feedback=message;state.training.feedbackUntil=state.tick+180;}
function feedback(state,input,before){
 const f=state.fighters[0],other=state.fighters[1];
 const rejected=state.events.find(e=>e.target===0&&['empty','cooldown','exhausted','unavailable','awakeningBlocked'].includes(e.type));
 if(rejected){hint(state,({empty:'Not enough chakra. Wait for regeneration or enable infinite stamina/chakra.',cooldown:'That technique is cooling down. Check the timer on its button.',exhausted:'Not enough stamina. Stop attacking briefly, or enable infinite stamina/chakra.',unavailable:'This fighter has no technique in that slot.',awakeningBlocked:awakeningReady(f)?'Awakening ready: finish your action or wait for hitstun to end.':'Fill the awakening meter by taking damage first.'})[rejected.type]);return;}
 const pressed=key=>Boolean(input[key]&&(!before.previous[key]||input.pressedActions?.includes(key)));
 if(pressed('jump')&&before.jumps>=2){hint(state,'Both jumps are used. Land before jumping again.');return;}
 if((pressed('dashForward')||pressed('dashBack'))&&before.airDashUsed&&before.y>0){hint(state,'Air dash is used. Land to reset it.');return;}
 if((pressed('dashForward')||pressed('dashBack'))&&before.dashCooldown>0){hint(state,`Dash is cooling down (${(before.dashCooldown/60).toFixed(1)}s).`);return;}
 if(pressed('block')&&before.y>0){hint(state,'Guard works on the ground. Land, then hold Guard.');return;}
 if(['jump','dashForward','dashBack','attack','weapon','special1','special2'].some(pressed)&&before.stun>0){hint(state,'You are in hitstun. Wait for recovery, or escape with Replacement.');return;}
 if(before.action&&f.action?.move===before.action.move){
  const m=MOVES[f.action.move],end=m.startup+m.active;
  if(before.action.age<end&&f.action.age>=end&&!f.action.hit&&!m.buff&&!m.projectile){hint(state,Math.abs(f.y-other.y)>=100?'Missed: your target is at a different height.':Math.abs(f.x-other.x)>m.reach?`Missed: distance ${Math.round(Math.abs(f.x-other.x))}, reach ${m.reach}. Move closer.`:Math.abs((f.depth??0)-(other.depth??0))>36?'Missed: different lane. Align your ground markers.':'Missed: check facing and the target’s invulnerability.');return;}
 }
 if(state.events.some(e=>e.target===1&&e.type==='block')){hint(state,'Guarded: blocked basics cannot continue a combo. Wait, reposition, or try a piercing technique.');return;}
 if(before.action&&['attack','weapon','special1','special2'].some(pressed)&&!(before.action.confirmed&&before.action.chain>0))hint(state,'Input buffered briefly. A committed attack must recover before another action can start.');
}
function progress(state,before){
 const t=state.training,f=state.fighters[0];if(t.completed||t.drill==='free')return;
 const hit=state.events.find(e=>e.target===1&&['hit','punish','pierce','guardBreak'].includes(e.type));
 if(t.drill==='movement'){
  if(t.step>0&&f.y===0&&f.jumps===0){t.step=0;hint(state,'You landed. Try Jump → Jump → Dash in one airborne sequence.');}
  if(t.step===0&&f.jumps>=1)t.step=1;
  if(t.step===1&&f.jumps===2)t.step=2;
  if(t.step===2&&f.jumps===2&&f.dash?.air)t.step=3;
 }else if(t.drill==='combo'){
  const chain=CHARACTERS[f.character].basicChain??['attack','attack2','attack3'];
  if(hit&&chain.includes(hit.move)){
   if(hit.move===chain[0])t.step=1;
   else if(hit.move===chain[1]&&t.step===1&&f.combo.hits===2)t.step=2;
   else if(hit.move===chain[2]&&t.step===2&&f.combo.hits===3)t.step=3;
  }
  if(t.step>0&&!f.action&&state.fighters[1].stun===0&&state.tick-f.combo.lastTick>30){t.step=0;hint(state,'The combo window closed. Reset and tap the next Basic just after each confirmed hit.');}
 }else if(t.drill==='counter'){
  const guarded=state.events.find(e=>e.target===0&&['block','parry'].includes(e.type));
  if(guarded){t.guardTick=state.tick;t.parried=guarded.type==='parry';t.step=1;hint(state,'Opening! Release Guard and use your equipped weapon.');}
  if(t.step===1&&hit?.move===moveFor(f,'weapon')&&state.tick-t.guardTick<60&&(hit.type==='punish'||(t.parried&&before.dummyStun>0)))t.step=2;
  else if(t.step===1&&state.tick-t.guardTick>=60){t.step=0;hint(state,'The opening closed. Guard the next swing and counter sooner.');}
 }else if(t.drill==='awakening'){
  if(awakeningReady(f))t.step=1;
  if(t.step===1&&state.events.some(e=>e.type==='awakening'&&e.target===0))t.step=2;
 }
 if(t.step===DRILLS[t.drill].steps.length){t.completed=true;hint(state,'Challenge complete! Retry to practise again, or choose another drill in Practice.');}
}
export function stepTraining(state,input={}){
 if(!state.training)throw new Error('Training state required');
 const t=state.training;
 if(t.recording){t.sequence??=[];if(t.sequence.length<600)t.sequence.push(structuredClone(input));else t.recording=false;}
 for(const f of state.fighters){if(t.unlimitedResources){f.stamina=100;f.chakra=100;}if(t.refillHealth)f.hp=1000;if(t.instantCooldowns){f.cooldowns={};f.dashCooldown=0;}}
 const p=state.fighters[0],before={jumps:p.jumps,y:p.y,stun:p.stun,airDashUsed:p.airDashUsed,dashCooldown:p.dashCooldown,previous:{...p.previous},action:p.action?{...p.action}:null,dummyStun:state.fighters[1].stun};
 stepMatch(state,[input,dummyInput(state)]);
 feedback(state,input,before);progress(state,before);
 for(const event of state.events)if(event.target===1&&['hit','punish','pierce','guardBreak'].includes(event.type)&&event.damage){t.stats.damage+=event.damage;t.stats.hits++;}
 t.stats.bestCombo=Math.max(t.stats.bestCombo,state.fighters[0].combo.hits);
 for(const f of state.fighters){if(t.unlimitedResources){f.stamina=100;f.chakra=100;}if(t.refillHealth)f.hp=1000;if(t.instantCooldowns){f.cooldowns={};f.dashCooldown=0;}}
 return state;
}
