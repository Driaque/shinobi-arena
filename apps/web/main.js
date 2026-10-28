import {createTrainingUI} from './training.js';
import {stepTraining} from './packages/engine/training.js';
import { createInput } from './packages/input/index.js';
import { createMatch, stepMatch, nextRound, computerInput, difficultyFor, TICK_RATE, CHARACTERS, WEAPONS, MOVES, moveFor, staminaCost, awakeningFor, activeAwakening, awakeningReady } from './packages/engine/index.js';
import { createRoster } from './roster.js';
import { createControls } from './controls.js';
import { createRenderer } from './renderer.js';
const $ = selector => document.querySelector(selector);
const inputs=[createInput(),createInput()];
const buttons=[...document.querySelectorAll('[data-action]')];
const render=createRenderer($('#canvas'));
const portrait=matchMedia('(orientation: portrait)'), touch=matchMedia('(any-pointer: coarse)');
let controls,trainingUI;
let difficulty='easy';
try{difficulty=difficultyFor(localStorage.getItem('shinobi-arena.difficulty.v1')).id;}catch{}
$('#difficulty').value=difficulty;
const newMatch=(loadouts)=>$('#mode').value==='training'&&trainingUI?trainingUI.create(loadouts):createMatch(loadouts,{difficulty});
let state=newMatch(), paused=true, started=false, mode='cpu', cpu={}, lastTime=0, accumulator=0, feedbackUntil=0;
const shortNames={harmoniousSlash:'HARMONIOUS',echoingRift:'ECHOING RIFT',tetsugan:'TETSUGAN',mizukumi:'MIZUKUMI',eclipseDrain:'ECLIPSE DRAIN',shinraiOu:'SHINRAI ŌU',ascendantSlash:'ASCENDANT CUT',ascendantRift:'METAL RIFT',dominionMizukumi:'DOMINION DASH',dominionDrain:'DOMINION DRAIN',special1:'RASENGAN',chidori:'CHIDORI',clone:'CLONE',fireball:'FIREBALL',lionFists:'TWIN LIONS',chakraStrike:'PALM STRIKE',snakeStrike:'SNAKES',seal:'SEAL',sharingan:'SHARINGAN',byakugan:'BYAKUGAN'};
function readLoadouts(){return [0,1].map(i=>({character:$(`#character${i} input:checked`).value,weapon:$(`#weapon${i}`).value}));}
function describeLoadouts(){
  for(const i of [0,1]){
    const character=CHARACTERS[$(`#character${i} input:checked`).value],weapon=WEAPONS[$(`#weapon${i}`).value];
    $(`#selected${i}`).textContent=character.name;
    const form=awakeningFor({character:character.id});
    $(`#kit${i}`).innerHTML=`<strong>${character.title}</strong><br><span class="kit-description">${character.description}<br></span><span class="kit-label">${weapon.description}</span>${form?`<br><span class="form-note">Awakening: ${form.name}${form.proposed?' (proposed)':''} · ${form.threshold} HP lost</span>`:''}`;
  }
  if(!started)state=newMatch(readLoadouts());
}
for(const i of [0,1]){
  createRoster($(`#character${i}`),i,i===0?'naruto':'sasuke',describeLoadouts);
  for(const weapon of Object.values(WEAPONS))$(`#weapon${i}`).add(new Option(weapon.name,weapon.id));
  $(`#weapon${i}`).addEventListener('change',describeLoadouts);
}
function filterRoster(){
  const query=$('#roster-search').value.trim().toLowerCase(),era=$('#roster-era').value;
  let count=0;for(const character of Object.values(CHARACTERS)){
    const show=(!query||`${character.name} ${character.title}`.toLowerCase().includes(query))&&(era==='all'||character.era===era);
    for(const card of document.querySelectorAll(`.character-card[data-character="${character.id}"]`))card.hidden=!show;
    if(show)count++;
  }
  $('#roster-count').textContent=`${count} fighter${count===1?'':'s'}`;
  for(const empty of document.querySelectorAll('.roster-empty'))empty.hidden=count>0;
}
$('#roster-search').addEventListener('input',filterRoster);$('#roster-era').addEventListener('change',filterRoster);
describeLoadouts();filterRoster();
function clearInputs(){controls?.reset();inputs.forEach(i=>i.reset());cpu={};buttons.forEach(b=>b.classList.remove('active'));}
function dialog(kicker,title,description,button){
  $('#overlay-kicker').textContent=kicker;$('#overlay-title').textContent=title;
  $('#overlay-description').textContent=description;$('#play').textContent=button;
  $('#overlay-hint').textContent=mode==='cpu'?`${difficultyFor(difficulty).name} · ${difficultyFor(difficulty).description}`:'P2 arrows · N basic · B weapon · M guard · , / . signatures · / bloodline · V replace';
  $('#loadout-panel').hidden=started&&state.status!=='matchOver';
  if(mode==='training')$('#overlay-hint').textContent='Practice configures your dummy and challenges · Reset returns both fighters to position';
  $('#overlay').hidden=false;
}
function pause(){
  if(!started||paused||state.status!=='playing')return;
  paused=true;clearInputs();
  dialog('TAKE A BREATH','Match paused','Your match will wait. Resume when you are ready.','Resume match');
}
function orientation(){
  clearInputs();const gated=touch.matches&&portrait.matches;
  if(gated)pause();$('#rotate').hidden=!gated;$('#game').inert=gated;
}
function finish(){
  clearInputs();paused=true;
  const name=state.fighters[state.result==='player1'?0:1].name;
  const draw=state.result==='draw';
  dialog(state.status==='matchOver'?'MATCH COMPLETE':`ROUND ${state.round} COMPLETE`,draw?'An even match.':`${name} wins.`,
    draw?'No point awarded. Settle it in the next round.':`${state.wins[0]} — ${state.wins[1]} · ${state.status==='matchOver'?'Ready for another fight?':'The rivalry continues.'}`,
    state.status==='matchOver'?'Rematch':'Next round');
}
$('#play').addEventListener('click',()=>{
  if(touch.matches&&portrait.matches)return;
  if(!started||state.status==='matchOver')state=newMatch(readLoadouts());
  else if(state.status==='roundOver')nextRound(state);
  clearInputs();paused=false;started=true;accumulator=0;lastTime=performance.now();$('#overlay').hidden=true;$('#play').blur();$('#feedback').textContent='';
});
$('#pause').addEventListener('click',pause);
$('#difficulty').addEventListener('change',event=>{
  pause();clearInputs();difficulty=difficultyFor(event.target.value).id;state.difficulty=difficulty;
  try{localStorage.setItem('shinobi-arena.difficulty.v1',difficulty);}catch{}
  if(mode==='cpu')$('#overlay-hint').textContent=`${difficultyFor(difficulty).name} · ${difficultyFor(difficulty).description}`;
});

$('#mode').addEventListener('change',event=>{
  mode=event.target.value;$('#difficulty').disabled=mode!=='cpu';$('.difficulty-label').hidden=mode==='training';state=newMatch();paused=true;started=false;clearInputs();
  $('#mode-name').textContent=mode==='training'?'TRAINING':mode==='cpu'?`CPU · ${difficultyFor(difficulty).name.toUpperCase()}`:'LOCAL TWO PLAYER';
  $('#opponent-label').textContent=mode==='training'?'TRAINING DUMMY':mode==='cpu'?'COMPUTER':'PLAYER TWO';
  document.querySelectorAll('#character1 .pick-mark').forEach(mark=>mark.textContent=mode==='training'?'DUMMY':mode==='cpu'?'CPU':'P2');
  $('#p2-help').textContent=mode==='cpu'?'CPU Sasuke · Chidori + fireball':'P2 arrows · N hit · M guard · , Chidori · . fireball';
  describeLoadouts();dialog('BUILD YOUR FIGHTING STYLE','Choose your shinobi.',mode==='training'?'Pick your fighter and training dummy. Practice opens challenges and training settings.':'Pick both fighters and equip a weapon before the battle.',mode==='training'?'Start training':'Start match');
  trainingUI?.draw();
});
controls=createControls({inputs,onPause:pause,isPlaying:()=>!paused&&state.status==='playing'&&$('#rotate').hidden});
function useTrainingState(next){
 state=next;started=true;
 for(const i of [0,1]){$(`#character${i} input[value="${state.loadouts[i].character}"]`).checked=true;$(`#weapon${i}`).value=state.loadouts[i].weapon;}
 describeLoadouts();
}
trainingUI=createTrainingUI({pause,clearInputs,getState:()=>state,setState:useTrainingState,getLoadouts:readLoadouts,isTraining:()=>mode==='training',isStarted:()=>started,isEditing:()=>controls.editing,binding:action=>controls.binding(0,action),start:()=>{paused=false;started=true;accumulator=0;lastTime=performance.now();$('#overlay').hidden=true;}});

window.addEventListener('blur',()=>{clearInputs();pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInputs();pause();}});
portrait.addEventListener('change',orientation);touch.addEventListener('change',orientation);
$('#fullscreen').addEventListener('click',async()=>{
  $('#status').textContent='';
  try{if(!document.fullscreenElement&&$('#game').requestFullscreen)await $('#game').requestFullscreen();}
  catch{$('#status').textContent='Full screen is unavailable; you can continue in this window.';}
  // Desktop fullscreen should not report a mobile orientation failure.
  if(touch.matches&&typeof screen.orientation?.lock==='function'){
    try{await screen.orientation.lock('landscape');}catch{if(portrait.matches)$('#status').textContent='Rotate your phone manually to play.';}
  }
});
function paintHud(){
  document.documentElement.classList.toggle('in-match',started&&!paused);
  $('#difficulty').disabled=mode!=='cpu'||Boolean(controls?.editing);
  $('.difficulty-label').hidden=mode==='training';
  $('#difficulty').title=difficultyFor(difficulty).description;
  $('#mode-name').textContent=mode==='training'?'TRAINING':mode==='cpu'?`CPU · ${difficultyFor(difficulty).name.toUpperCase()}`:'LOCAL TWO PLAYER';
  const player=state.fighters[0];
  for(const [key,name,meta,bind] of [['special1','s1-name','s1-meta','U'],['special2','s2-name','s2-meta','I'],['bloodline','bl-name','bl-meta','O']]){
    const move=moveFor(player,key),cooldown=player.cooldowns[key]??0;
    $(`#${name}`).textContent=move?(shortNames[move]??MOVES[move].name.toUpperCase()):'BLOODLINE';
    $(`#${meta}`).textContent=move?`${controls?.binding(0,key)??bind} · ${cooldown>0?(cooldown/60).toFixed(1)+'s':MOVES[move].cost}`:`${controls?.binding(0,key)??bind} · NONE`;
  }
  $('#weapon-label').textContent=`${controls?.binding(0,'weapon')??'H'} · ${WEAPONS[player.weapon].name.toUpperCase()}`;
  $('#replacement-cd').textContent=player.cooldowns.replacement>0?`${controls?.binding(0,'replacement')??'R'} · ${(player.cooldowns.replacement/60).toFixed(1)}s`:`${controls?.binding(0,'replacement')??'R'} · 25`;
  $('#p2-help').textContent=mode==='cpu'?`CPU ${state.fighters[1].name} · ${difficultyFor(difficulty).name} · ${WEAPONS[state.fighters[1].weapon].name}`:'P2 arrows · N/B basic/weapon · M guard · ,/. signatures · / bloodline · V replace';
  const playerForm=awakeningFor(player),currentForm=activeAwakening(player);
  $('#awakening-meta').textContent=`${controls?.binding(0,'awakening')??'T'} · ${currentForm?(player.awakeningTicks/60).toFixed(1)+'s':!playerForm?'NONE':player.awakeningUsed?'USED':awakeningReady(player)?'READY':Math.min(100,Math.floor(player.damageTaken/playerForm.threshold*100))+'%'}`;
  $('#basic-label').textContent=player.action?.confirmed&&player.action.chain<3?`COMBO ${player.action.chain+1}`:'BASIC ×3';
  state.fighters.forEach((f,i)=>{
    $(`#stamina${i}`).value=f.stamina;$(`#guard${i}`).value=f.guard;
    const form=awakeningFor(f),active=activeAwakening(f),meter=$(`#awakening-fill${i}`);
    meter.style.width=`${active?f.awakeningTicks/form.duration*100:form?Math.min(100,f.damageTaken/form.threshold*100):0}%`;
    meter.style.background=form?.color??'#627386';
    $(`#awakening-label${i}`).textContent=active?`${active.name.toUpperCase()} · ${(f.awakeningTicks/60).toFixed(1)}s`:!form?'NO AWAKENING':f.awakeningUsed?'AWAKENING USED':awakeningReady(f)?`${form.name.toUpperCase()} · READY`:`${form.name.toUpperCase()} · ${Math.floor(Math.min(100,f.damageTaken/form.threshold*100))}%`;
    $(`#combo${i}`).textContent=f.combo.hits>1&&state.tick-f.combo.lastTick<60?`${f.combo.hits} HITS · ${f.combo.damage} DAMAGE`:'';
    $(`#name${i}`).textContent=f.name.toUpperCase();
    const labels=[...f.effects.map(e=>`${e.type==='metalVulnerable'?'METAL EXPOSED':e.type.toUpperCase()} ${(e.remaining/60).toFixed(1)}s`),...f.buffs.map(b=>`${({tetsugan:'TETSUGAN GUARD',counter:'COUNTER READY',shinrai:'SHINRAI ŌU'})[b.type]??b.type.toUpperCase()} ${(b.remaining/60).toFixed(1)}s`)];
    if(f.invulnerable>0)labels.push('SUBSTITUTION');
    $(`#effects${i}`).textContent=labels.join(' · ');
    $(`#hp${i}`).textContent=Math.ceil(f.hp);$(`#health${i}`).style.width=`${f.hp/10}%`;$(`#chakra${i}`).style.width=`${f.chakra}%`;
    $(`#wins${i}`).textContent=[0,1].map(n=>n<state.wins[i]?'●':'○').join(' ');
  });
  $('#movement-state').textContent=player.dash?(player.dash.air?'AIR DASH':'DASH'):player.y>0?`AIR · ${player.jumps}/2 JUMPS`:'';
  $('#canvas').setAttribute('aria-label',`${state.fighters[0].name} versus ${state.fighters[1].name}. ${$('#movement-state').textContent}`);
  $('#timer').textContent=mode==='training'?'∞':Math.ceil(state.remainingTicks/TICK_RATE).toString().padStart(2,'0');
  $('#round').textContent=mode==='training'?'PRACTICE':`ROUND ${state.round.toString().padStart(2,'0')}`;
  const binding=(player,action)=>controls?.binding(player,action)??'Unbound';
  const footer=document.querySelector('footer>span');
  footer.textContent=`P1 ${binding(0,'left')}/${binding(0,'right')} move · ${binding(0,'jump')} ×2 jump · ${binding(0,'dashBack')}/${binding(0,'dashForward')} dash · ${binding(0,'attack')} basic · ${binding(0,'weapon')} weapon · ${binding(0,'block')} guard · ${binding(0,'special1')}/${binding(0,'special2')} jutsu · ${binding(0,'bloodline')} bloodline · ${binding(0,'replacement')} replace · ${binding(0,'awakening')} awaken`;
  if(mode==='local')$('#overlay-hint').textContent=`P2 ${binding(1,'left')}/${binding(1,'right')} move · ${binding(1,'jump')} jump · ${binding(1,'dashBack')}/${binding(1,'dashForward')} dash · ${binding(1,'attack')} basic · ${binding(1,'weapon')} weapon · ${binding(1,'block')} guard · ${binding(1,'special1')}/${binding(1,'special2')} jutsu · ${binding(1,'bloodline')} bloodline · ${binding(1,'replacement')} replace`;
  if(mode==='local')$('#p2-help').textContent=`P2 ${binding(1,'left')}/${binding(1,'right')} move · ${binding(1,'jump')} jump · ${binding(1,'dashBack')}/${binding(1,'dashForward')} dash · ${binding(1,'attack')}/${binding(1,'weapon')} basic/weapon · ${binding(1,'block')} guard`;
  for(const action of ['jump','dashBack','dashForward','attack','block'])$(`[data-action="${action}"] small`).textContent=binding(0,action);
  trainingUI?.draw();
  if(mode==='training')$('#p2-help').textContent='Training dummy · Practice configures behavior and challenges';
  const snap=inputs[0].snapshot();buttons.forEach(b=>{
    const key=b.dataset.action,move=moveFor(player,key),cost=key==='replacement'?25:move?MOVES[move].cost:0;
    b.disabled=!controls?.editing&&mode!=='training'&&((key==='bloodline'&&!move)||(key==='awakening'&&!awakeningReady(player)));
    if(!move&&key==='bloodline')b.title='This fighter has no technique in this slot.';
    if(move)b.title=`${MOVES[move].name} · ${MOVES[move].cost} chakra · ${staminaCost(key)} stamina · ${MOVES[move].reach||'projectile'} range`;
    b.classList.toggle('awakening-ready',key==='awakening'&&awakeningReady(player));
    b.classList.toggle('active',snap[key]);b.classList.toggle('cooling',(player.cooldowns[key]??0)>0);
    b.classList.toggle('unavailable',b.disabled||player.chakra<cost||player.stamina<staminaCost(key)||(key==='bloodline'&&!move)||(key==='awakening'&&!awakeningReady(player)));
  });
}
function frame(now){
  if(!lastTime)lastTime=now;
  if(!paused&&state.status==='playing'){
    accumulator+=Math.min((now-lastTime)/1000,.1);
    while(accumulator>=1/TICK_RATE&&state.status==='playing'){
      if(mode==='cpu')cpu=computerInput(state);
      if(mode==='training')stepTraining(state,inputs[0].consume());else stepMatch(state,[inputs[0].consume(),mode==='cpu'?cpu:inputs[1].consume()]);accumulator-=1/TICK_RATE;
      const event=state.events.find(e=>['parry','guardBreak','punish','exhausted','hit','block','empty','pierce','replacement','unavailable','poison','burn','cooldown','awakeningBlocked'].includes(e.type));
      if(event){const messages={parry:'PARRY · COUNTER NOW',guardBreak:'GUARD BROKEN',punish:'RECOVERY PUNISH · +20%',exhausted:'LOW STAMINA · CREATE SPACE',empty:'NOT ENOUGH CHAKRA',block:'GUARDED',replacement:'REPLACEMENT JUTSU',unavailable:'NO BLOODLINE IN THIS KIT',cooldown:'TECHNIQUE ON COOLDOWN',awakeningBlocked:'AWAKENING NOT READY OR UNABLE TO ACT'};
        $('#feedback').textContent=messages[event.type]??`${event.type==='pierce'?'GUARD PIERCED · ':event.type==='poison'?'POISON · ':event.type==='burn'?'BURN · ':''}${event.damage} DAMAGE`;feedbackUntil=now+700;}
    }
    if(state.status!=='playing')finish();
  }else accumulator=0;
  lastTime=now;if(now>feedbackUntil)$('#feedback').textContent='';render(state);paintHud();requestAnimationFrame(frame);
}
$('#overlay-hint').textContent=`${difficultyFor(difficulty).name} · ${difficultyFor(difficulty).description}`;
orientation();requestAnimationFrame(frame);


