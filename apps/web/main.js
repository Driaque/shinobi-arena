import {mountIcon} from './packages/ui/jutsu-icons.js';
import {createGamepads} from './packages/input/gamepad.js';
import {createExperience,experience,padBindings} from './experience.js';
import {createPrediction} from './packages/network/prediction.js';
import {summarizeFight} from './packages/engine/tactics.js';
import {createAudio} from './audio.js';
import {createArenaHub} from './arena-hub.js';
import {createLoadouts} from './loadouts.js';
import {createTechniqueTray} from './technique-tray.js';
import {createOnline} from './online.js';
import {createFullscreen} from './fullscreen.js';
import {createTrainingUI} from './training.js';
import {stepTraining} from './packages/engine/training.js';
import { createInput } from './packages/input/index.js';
import { createMatch, stepMatch, nextRound, computerInput, difficultyFor, TICK_RATE, CHARACTERS, WEAPONS, ITEMS, MOVES, moveFor, staminaCost, awakeningFor, activeAwakening, awakeningReady } from './packages/engine/index.js';
import { createRoster } from './roster.js';
import { createControls } from './controls.js';
import {createPracticeRenderer} from './practice-renderer.js';
const $ = selector => document.querySelector(selector);
const sound=createAudio({moves:MOVES,onOpen:()=>{clearInputs();pause();}});
const prediction=createPrediction();const frameTimes=[];
const inputs=[createInput(),createInput()];
const buttons=[...document.querySelectorAll('[data-action]')];
const render=createPracticeRenderer($('#canvas'),{getMode:()=>mode});
const portrait=matchMedia('(orientation: portrait)'), touch=matchMedia('(any-pointer: coarse)');
let controls,trainingUI,online,loadoutUI,techniqueTray;
let onlinePlayers=[],onlineScreen='',activeTournament=null;
let difficulty='easy';
try{difficulty=difficultyFor(localStorage.getItem('shinobi-arena.difficulty.v1')).id;}catch{}
$('#difficulty').value=difficulty;
const newMatch=(loadouts)=>$('#mode').value==='training'&&trainingUI?trainingUI.create(loadouts):createMatch(loadouts,{difficulty});
let state=newMatch(), paused=true, started=false, mode='cpu', cpu={}, lastTime=0, accumulator=0, feedbackUntil=0;
const shortNames={tidalEdict:'TIDAL EDICT',royalTempest:'ROYAL TEMPEST',triuneFlow:'TRIUNE FLOW',royalGale:'ROYAL GALE',releasedTempest:'SOVEREIGN',harmoniousSlash:'HARMONIOUS',echoingRift:'ECHOING RIFT',aquaGuard:'TRIUNE FLOW',tetsugan:'TETSUGAN',mizukumi:'MIZUKUMI',eclipseDrain:'ECLIPSE DRAIN',shinraiOu:'SHINRAI ŌU',ascendantSlash:'ASCENDANT CUT',ascendantRift:'METAL RIFT',dominionMizukumi:'DOMINION DASH',dominionDrain:'DOMINION DRAIN',special1:'RASENGAN',chidori:'CHIDORI',clone:'CLONE',fireball:'FIREBALL',lionFists:'TWIN LIONS',chakraStrike:'PALM STRIKE',snakeStrike:'SNAKES',seal:'SEAL',sharingan:'SHARINGAN',byakugan:'BYAKUGAN'};
function readLoadouts(){if(loadoutUI)return [0,1].map(i=>loadoutUI.read(i));return [0,1].map(i=>({character:$(`#character${i} input:checked`).value,weapon:$(`#weapon${i}`).value,weapons:[$(`#weapon${i}`).value,$(`#weapon-secondary${i}`).value||null],items:[0,1,2,3].map(slot=>$(`#item${i}-${slot}`).value||null)}));}
function describeLoadouts(){
  for(const i of [0,1]){
    const character=CHARACTERS[$(`#character${i} input:checked`).value],weapon=WEAPONS[$(`#weapon${i}`).value];
    $(`#selected${i}`).textContent=character.name;
    const picks=[0,1,2,3].map(slot=>$(`#item${i}-${slot}`).value);
    for(const slot of [0,1,2,3]){const select=$(`#item${i}-${slot}`);select.querySelector('option[value="raijinKunai"]').disabled=picks.some((id,n)=>n!==slot&&id==='raijinKunai');select.title=ITEMS[select.value]?.description??'Empty slot';}
    $(`#inventory-hint${i}`).textContent=picks.filter(Boolean).length+' / 4 consumables · '+picks.filter(Boolean).map(id=>ITEMS[id].name).join(' · ');

    const form=awakeningFor({character:character.id});
    $(`#kit${i}`).innerHTML=`<strong>${character.title}</strong><br><span class="kit-description">${character.description}<br></span><span class="kit-label">${weapon.description}</span>${form?`<br><span class="form-note">Awakening: ${form.name}${form.proposed?' (proposed)':''} · ${form.threshold} HP lost</span>`:''}`;
  }
  loadoutUI?.sync();
  if(!started&&mode!=='online')state=newMatch(readLoadouts());
}
for(const i of [0,1]){
  createRoster($(`#character${i}`),i,i===0?'naruto':'sasuke',()=>{if(CHARACTERS[$(`#character${i} input:checked`).value].defaultWeapon)$(`#weapon${i}`).value=CHARACTERS[$(`#character${i} input:checked`).value].defaultWeapon;if($(`#character${i} input:checked`).value==='dora'){$(`#weapon${i}`).value='fans';$(`#weapon-secondary${i}`).value='katana';}loadoutUI?.resetCharacter(i);describeLoadouts();});
  for(const weapon of Object.values(WEAPONS))$(`#weapon${i}`).add(new Option(weapon.name,weapon.id));
  $(`#weapon${i}`).value='kunai';
  $(`#weapon-secondary${i}`).add(new Option('None',''));
  for(const weapon of Object.values(WEAPONS))$(`#weapon-secondary${i}`).add(new Option(weapon.name,weapon.id));
  $(`#weapon-secondary${i}`).value='katana';$(`#weapon-secondary${i}`).addEventListener('change',describeLoadouts);
  for(const slot of [0,1,2,3]){const select=$(`#item${i}-${slot}`);select.add(new Option('Empty',''));for(const item of Object.values(ITEMS)){const option=new Option(item.name,item.id);option.title=item.description;select.add(option);}select.value=['paperBomb','throwingKunai','smokeBomb','poison'][slot];select.addEventListener('change',()=>{describeLoadouts();$(`#inventory-hint${i}`).textContent=ITEMS[select.value]?.description??'Empty consumable slot.';});}
  $(`#weapon${i}`).addEventListener('change',describeLoadouts);
}
loadoutUI=createLoadouts({onChange:describeLoadouts});
function filterRoster(){
  const query=$('#roster-search').value.trim().toLowerCase(),era=$('#roster-era').value;
  let count=0;for(const character of Object.values(CHARACTERS)){
    const show=(!query||`${character.name} ${character.title}`.toLowerCase().includes(query))&&(era==='all'||character.era===era||era==='Akatsuki'&&character.faction==='Akatsuki');
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
  $('#overlay').hidden=false;$('#play').hidden=false;if(mode==='online')$('#online-lobby').hidden=false;
}
function pause(){
  if(mode==='online'){clearInputs();return;}
  if(!started||paused||state.status!=='playing')return;
  paused=true;clearInputs();
  dialog('TAKE A BREATH','Match paused','Your match will wait. Resume when you are ready.','Resume match');
}
function orientation(){
  clearInputs();const gated=(touch.matches||navigator.maxTouchPoints>0)&&window.innerHeight>window.innerWidth;
  $('#rotate p').textContent=mode==='online'?'Online matches keep running. Turn sideways to regain your controls.':'Your match is paused. Landscape gives your thumbs room to fight.';
  if(gated)pause();$('#rotate').hidden=!gated;$('#game').inert=gated;
}
const coach=document.createElement('section');coach.id='match-coach';coach.className='match-coach';coach.hidden=true;document.querySelector('#overlay-description').after(coach);
function showCoach(slot=0){const report=summarizeFight(state,slot);coach.replaceChildren();const p=document.createElement('p');p.textContent=`Direct damage dealt ${report.mine.damage??0} · Taken ${state.fighters[slot].damageTaken??0} (${report.other.fieldDamage??0} from fields) · Parries ${report.mine.parries??0} · Recovery punishes ${report.mine.punishes??0} · Jutsu links ${report.mine.links??0}`;const tip=document.createElement('p');tip.textContent=report.tip;coach.append(p,tip);const practice=document.createElement('button');practice.type='button';practice.textContent='Practice this matchup';practice.onclick=()=>{if(mode==='online')online.reset();$('#mode').value='training';$('#mode').dispatchEvent(new Event('change'));trainingUI.openSettings();};coach.append(practice);coach.hidden=false;}
function finish(){
  clearInputs();paused=true;showCoach();
  const name=state.fighters[state.result==='player1'?0:1].name;
  const draw=state.result==='draw';
  const cheer=!draw&&state.fighters[state.result==='player1'?0:1].character==='dora'?'Yaaay! · ':'';
  dialog(state.status==='matchOver'?'MATCH COMPLETE':`ROUND ${state.round} COMPLETE`,draw?'An even match.':`${name} wins.`,
    draw?'No point awarded. Items refill next round.':`${cheer}${state.wins[0]} — ${state.wins[1]} · ${state.status==='matchOver'?'Ready for another fight?':'The rivalry continues.'}`,
    state.status==='matchOver'?'Rematch':'Next round');
}
$('#play').addEventListener('click',()=>{
  if(!$('#rotate').hidden)return;coach.hidden=true;
  if(mode==='online'){if(activeTournament&&(!started||state.status==='matchOver')){arenaHub.open('tournaments');return;}if(online.phase==='roundOver'){online.ready();$('#play').disabled=true;$('#play').textContent='Waiting for opponent…';}else {online.reset();online.join();}return;}
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
  activeTournament=null;prediction.reset();coach.hidden=true;online?.reset();for(const el of document.querySelectorAll('#character0 input,#weapon0,#weapon-secondary0,#item0-0,#item0-1,#item0-2,#item0-3'))el.disabled=false;onlineScreen='';mode=event.target.value;document.body.classList.toggle('online-mode',mode==='online');$('#online-lobby').hidden=mode!=='online';$('#play').disabled=false;$('#difficulty').disabled=mode!=='cpu';$('.difficulty-label').hidden=mode==='training'||mode==='online';state=newMatch();paused=true;started=false;clearInputs();
  $('#mode-name').textContent=mode==='training'?'TRAINING':mode==='cpu'?`CPU · ${difficultyFor(difficulty).name.toUpperCase()}`:mode==='online'?`ONLINE · P${(online?.slot??0)+1}${online?.latency!==null?' · '+online.latency+'ms':''}`:'LOCAL TWO PLAYER';
  $('#opponent-label').textContent=mode==='training'?'TRAINING DUMMY':mode==='cpu'?'COMPUTER':'PLAYER TWO';
  document.querySelectorAll('#character1 .pick-mark').forEach(mark=>mark.textContent=mode==='training'?'DUMMY':mode==='cpu'?'CPU':'P2');
  $('#p2-help').textContent=mode==='cpu'?'CPU Sasuke · Chidori + fireball':'P2 arrows · N hit · M guard · , Chidori · . fireball';
  describeLoadouts();dialog('BUILD YOUR FIGHTING STYLE','Choose your shinobi.',mode==='training'?'Pick your fighter and training dummy. Practice opens challenges and training settings.':'Pick both fighters, two weapons and four consumables before the battle.',mode==='online'?'Find opponent':mode==='training'?'Start training':'Start match');
  if(mode==='online'){$('#overlay-description').textContent='Choose your fighter, two weapons and four consumables. Your opponent chooses their own.';$('#overlay-hint').textContent='Online fights continue when you open controls or leave the page. Leave match forfeits.';}
  trainingUI?.draw();
});
controls=createControls({inputs,onPause:pause,isPlaying:()=>!paused&&state.status==='playing'&&$('#rotate').hidden});
function useTrainingState(next){
 state=next;started=true;
 for(const i of [0,1]){$(`#character${i} input[value="${state.loadouts[i].character}"]`).checked=true;loadoutUI.update(i,state.loadouts[i]);$(`#weapon${i}`).value=state.loadouts[i].weapon;$(`#weapon-secondary${i}`).value=state.loadouts[i].weapons[1]??'';for(const slot of [0,1,2,3])$(`#item${i}-${slot}`).value=state.loadouts[i].items[slot]??'';}
 describeLoadouts();
}
trainingUI=createTrainingUI({pause,clearInputs,getState:()=>state,setState:useTrainingState,getLoadouts:readLoadouts,isTraining:()=>mode==='training',isStarted:()=>started,isEditing:()=>controls.editing,binding:action=>controls.binding(0,action),start:()=>{paused=false;started=true;accumulator=0;lastTime=performance.now();$('#overlay').hidden=true;}});

online=createOnline({getProfile:()=>readLoadouts()[0],onStatus:()=>{
 if(mode==='online'){for(const el of document.querySelectorAll('#character0 input,#weapon0,#weapon-secondary0,#item0-0,#item0-1,#item0-2,#item0-3'))el.disabled=online?.busy??false;$('#play').disabled=online?.busy??false;$('#play').textContent=online?.busy?'Finding opponent…':activeTournament?'View tournament bracket':'Find opponent';}
},onEnd:message=>{
 if(mode!=='online')return;clearInputs();started=false;paused=true;onlineScreen='';
 dialog('ONLINE ARENA',activeTournament?'Tournament update':'Return to the lobby',message,activeTournament?'View tournament bracket':'Find opponent');$('#play').disabled=false;
},onState:(message,slot)=>{
 if(mode!=='online')return;if(message.tournament)activeTournament=message.tournament.id;if(message.players)onlinePlayers=message.players;
 prediction.reconcile(message,slot);state=message.state;started=true;paused=false;
 const key=`${message.phase}:${state.round}`;
 $('#mode-name').textContent=`ONLINE · YOU ARE P${slot+1}`;
 if(message.phase==='playing'){$('#overlay').hidden=true;onlineScreen=key;}
 else if(message.phase==='countdown'){
  $('#loadout-panel').hidden=true;$('#overlay').hidden=false;$('#online-lobby').hidden=true;
  $('#overlay-kicker').textContent='OPPONENT FOUND';$('#overlay-title').textContent=`${onlinePlayers[0].name} vs ${onlinePlayers[1].name}`;
  $('#overlay-description').textContent=`You control P${slot+1} · ${state.fighters[slot].name}. Fight in ${message.countdown}…`;
  $('#overlay-hint').textContent='The match runs on the server. Leave match forfeits.';$('#play').hidden=true;onlineScreen=key;
 }else if(onlineScreen!==key){
  clearInputs();const result=state.result==='draw'?'Draw':`${onlinePlayers[state.result==='player1'?0:1].name} wins`;
  const cheer=state.result!=='draw'&&state.fighters[state.result==='player1'?0:1].character==='dora'?'Yaaay! · ':'';
  dialog('ONLINE ARENA',result,`${cheer}${state.wins[0]} — ${state.wins[1]} · ${message.phase==='roundOver'?'Both players must be ready for the next round.':activeTournament?'Open the tournament bracket for your next pairing and rewards.':'Match complete. Search again for another opponent.'}`,message.phase==='roundOver'?'Ready for next round':activeTournament?'View tournament bracket':'Find opponent');
  $('#online-lobby').hidden=message.phase==='roundOver';$('#loadout-panel').hidden=message.phase==='roundOver';$('#play').hidden=false;$('#play').disabled=false;onlineScreen=key;
 }
 if(message.phase==='playing')$('#play').hidden=false;
 if(message.phase==='matchOver')showCoach(slot);
 if(message.phase==='matchOver')for(const el of document.querySelectorAll('#character0 input,#weapon0,#weapon-secondary0,#item0-0,#item0-1,#item0-2,#item0-3'))el.disabled=false;
}});

createExperience({onOpen:()=>{clearInputs();pause();},onChange:()=>window.dispatchEvent(new Event('arena:experience'))});
const netLabel=document.createElement('span');netLabel.id='network-quality';document.querySelector('.topbar').after(netLabel);
const arenaHub=createArenaHub({onFight:id=>{online.reset();$('#mode').value='online';$('#mode').dispatchEvent(new Event('change'));activeTournament=id;online.join({tournamentId:id});},onTakeover:next=>{online.reset();$('#mode').value='training';$('#mode').dispatchEvent(new Event('change'));next.status='playing';next.result=null;next.training={drill:'free',dummy:'attack',unlimitedResources:false,refillHealth:true,instantCooldowns:false,showRanges:true,step:0,completed:false,feedback:'Replay takeover: practice from the preceding recorded sample as P1.',feedbackUntil:next.tick+240,stats:{damage:0,hits:0,bestCombo:0}};for(const f of next.fighters)f.hp=Math.max(1,f.hp);useTrainingState(next);$('#overlay').hidden=true;paused=false;started=true;clearInputs();},onOpen:()=>{clearInputs();pause();},isBusy:()=>mode==='online'&&['connecting','queued','playing','countdown','roundOver'].includes(online.phase)});
techniqueTray=createTechniqueTray({input:inputs[0],getPlayer:()=>state.fighters[mode==='online'?online.slot:0],isPlaying:()=>started&&!paused&&!controls?.editing&&$('#rotate').hidden&&state.status==='playing'&&(mode!=='online'||online.phase==='playing'),binding:key=>controls.binding(0,key),visible:key=>controls.visible(key)});
window.addEventListener('blur',()=>{clearInputs();pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInputs();pause();}});
portrait.addEventListener('change',orientation);touch.addEventListener('change',orientation);
window.addEventListener('resize',orientation);window.visualViewport?.addEventListener('resize',orientation);
screen.orientation?.addEventListener?.('change',orientation);
let screenNoticeTimer;
createFullscreen({element:$('#game'),target:document.documentElement,button:$('#fullscreen'),onTransition:()=>{clearInputs();pause();},notice:message=>{
  clearTimeout(screenNoticeTimer);$('#screen-notice').textContent=message;$('#screen-notice').hidden=false;
  screenNoticeTimer=setTimeout(()=>{$('#screen-notice').hidden=true;},6500);
}});
function paintHud(){
  document.documentElement.classList.toggle('in-match',started&&!paused);
  $('#difficulty').disabled=mode!=='cpu'||Boolean(controls?.editing);
  $('.difficulty-label').hidden=mode==='training'||mode==='online';
  $('#difficulty').title=difficultyFor(difficulty).description;
  $('#mode-name').textContent=mode==='training'?'TRAINING':mode==='cpu'?`CPU · ${difficultyFor(difficulty).name.toUpperCase()}`:mode==='online'?`ONLINE · P${(online?.slot??0)+1}${online?.latency!==null?' · '+online.latency+'ms':''}`:'LOCAL TWO PLAYER';
  const player=state.fighters[mode==='online'?online.slot:0];
  for(const [key,name,meta,bind] of [['special1','s1-name','s1-meta','U'],['special2','s2-name','s2-meta','I'],['bloodline','bl-name','bl-meta','O']]){
    const move=moveFor(player,key),cooldown=player.cooldowns[key]??0;
    const control=$(`#${name}`).closest('button');let art=control.querySelector('.technique-art');if(!art){art=document.createElement('span');art.className='technique-art';control.prepend(art);}mountIcon(art,move??'chakra');
    $(`#${name}`).textContent=move?(shortNames[move]??MOVES[move].name.toUpperCase()):'EMPTY SLOT';
    $(`#${meta}`).textContent=move?`${controls?.binding(0,key)??bind} · ${cooldown>0?(cooldown/60).toFixed(1)+'s':MOVES[move].cost}`:`${controls?.binding(0,key)??bind} · NONE`;
  }
  $('#swap-meta').textContent=`${controls?.binding(0,'swapWeapon')??'F'} · ${player.weaponSlot+1}/2`;
  const slot=player.items[player.itemSlot],mark=slot.id==='raijinKunai'&&player.raijinMark?.slot===player.itemSlot;
  $('#item-use-name').textContent=mark?'WARP':slot.id?ITEMS[slot.id].short:'EMPTY';
  $('#item-use-meta').textContent=`${controls?.binding(0,'useItem')??'X'} · ${player.cooldowns.useItem>0?(player.cooldowns.useItem/60).toFixed(1)+'s':mark?(player.raijinMark.remaining/60).toFixed(1)+'s':slot.count?'READY':'USED'}`;
  $('#item-cycle-meta').textContent=`${controls?.binding(0,'cycleItem')??'C'} · ${player.itemSlot+1}/4`;
  $('[data-action=swapWeapon]').title=`Swap to ${WEAPONS[player.weapons[1-player.weaponSlot]]?.name??'no secondary weapon'} (startup and recovery apply)`;
  $('[data-action=useItem]').title=mark?'Warp to your marked kunai: 15 chakra, no invulnerability.':ITEMS[slot.id]?.description??'No consumable in this slot';
  $('#weapon-label').textContent=`${controls?.binding(0,'weapon')??'H'} · ${WEAPONS[player.weapon].name.toUpperCase()}`;
  $('#replacement-cd').textContent=player.cooldowns.replacement>0?`${controls?.binding(0,'replacement')??'R'} · ${(player.cooldowns.replacement/60).toFixed(1)}s`:`${controls?.binding(0,'replacement')??'R'} · 25`;
  $('#p2-help').textContent=mode==='cpu'?`CPU ${state.fighters[1].name} · ${difficultyFor(difficulty).name} · ${WEAPONS[state.fighters[1].weapon].name}`:'P2 arrows · N/B basic/weapon · M guard · ,/. signatures · / bloodline · V replace';
  const playerForm=awakeningFor(player),currentForm=activeAwakening(player);
  $('#awakening-meta').textContent=`${controls?.binding(0,'awakening')??'T'} · ${currentForm?(player.awakeningTicks/60).toFixed(1)+'s':!playerForm?'NONE':player.awakeningUsed?'USED':awakeningReady(player)?'READY':Math.min(100,Math.floor(player.damageTaken/playerForm.threshold*100))+'%'}`;
  $('#basic-label').textContent=player.action?.confirmed&&player.action.chain<3?`COMBO ${player.action.chain+1}`:'BASIC ×3';
  state.fighters.forEach((f,i)=>{
    $(`#inventory-status${i}`).textContent=`${WEAPONS[f.weapon].name.toUpperCase()} · ${f.items.reduce((n,slot)=>n+slot.count,0)}/4 ITEMS${f.raijinMark?' · RAIJIN MARK':''}`;
    $(`#stamina${i}`).value=f.stamina;$(`#guard${i}`).value=f.guard;
    const form=awakeningFor(f),active=activeAwakening(f),meter=$(`#awakening-fill${i}`);
    meter.style.width=`${active?f.awakeningTicks/form.duration*100:form?Math.min(100,f.damageTaken/form.threshold*100):0}%`;
    meter.style.background=form?.color??'#627386';
    $(`#awakening-label${i}`).textContent=active?`${active.name.toUpperCase()} · ${(f.awakeningTicks/60).toFixed(1)}s`:!form?'NO AWAKENING':f.awakeningUsed?'AWAKENING USED':awakeningReady(f)?`${form.name.toUpperCase()} · READY`:`${form.name.toUpperCase()} · ${Math.floor(Math.min(100,f.damageTaken/form.threshold*100))}%`;
    $(`#combo${i}`).textContent=f.combo.hits>1&&state.tick-f.combo.lastTick<60?`${f.y>0?'AIR · ':''}${f.combo.hits} HITS · ${f.combo.damage} DAMAGE`:'';
    $(`#name${i}`).textContent=render.preview()?`${i===0?'AREN':'SPARRING ECHO'} · ${f.name.toUpperCase()} KIT`:mode==='online'&&onlinePlayers[i]?`${onlinePlayers[i].name} · ${f.name}`:f.name.toUpperCase();
    const labels=[...f.effects.map(e=>`${e.type==='metalVulnerable'?'METAL EXPOSED':e.type==='poisonslow'?'POISON-SLOW':e.type.toUpperCase()} ${(e.remaining/60).toFixed(1)}s`),...f.buffs.map(b=>`${({aquaGuard:'TRIUNE FLOW',tetsugan:'TETSUGAN GUARD',counter:'COUNTER READY',shinrai:'SHINRAI ŌU',poisonCoating:'POISON COATED'})[b.type]??b.type.toUpperCase()} ${(b.remaining/60).toFixed(1)}s`)];
    if(f.crouching&&f.blocking)labels.push('CROUCH GUARD');
    if(f.invulnerable>0)labels.push('SUBSTITUTION');
    $(`#effects${i}`).textContent=labels.join(' · ');
    $(`#hp${i}`).textContent=Math.ceil(f.hp);$(`#health${i}`).style.width=`${f.hp/10}%`;$(`#chakra${i}`).style.width=`${f.chakra}%`;
    $(`#wins${i}`).textContent=[0,1].map(n=>n<state.wins[i]?'●':'○').join(' ');
  });
  $('#movement-state').textContent=player.charging?'CHARGING CHAKRA':player.effects.some(e=>e.type==='bind')?'BOUND':player.crouching?(player.blocking?'CROUCH GUARD':'CROUCH'):player.dash?(player.dash.air?'AIR DASH':'DASH'):player.y>0?`AIR · ${player.jumps}/2 JUMPS`:(player.depth??0)>1?'FRONT LANE':(player.depth??0)<-1?'REAR LANE':'';
  $('#canvas').setAttribute('aria-label',`${render.preview()?'Aren appearance and sparring echo. ':''}${state.fighters[0].name} versus ${state.fighters[1].name}. ${$('#movement-state').textContent}`);
  $('#timer').textContent=mode==='training'?'∞':Math.ceil(state.remainingTicks/TICK_RATE).toString().padStart(2,'0');
  $('#round').textContent=mode==='training'?'PRACTICE':`ROUND ${state.round.toString().padStart(2,'0')}`;
  const binding=(player,action)=>controls?.binding(player,action)??'Unbound';
  const footer=document.querySelector('footer>span');
  footer.textContent=`P1 ${binding(0,'left')}/${binding(0,'right')} move · ${binding(0,'jump')} ×2 jump · ${binding(0,'dashBack')}/${binding(0,'dashForward')} dash · ${binding(0,'attack')} basic · ${binding(0,'weapon')} weapon · ${binding(0,'block')} guard · ${binding(0,'special1')}/${binding(0,'special2')} jutsu · ${binding(0,'bloodline')} bloodline · ${binding(0,'replacement')} replace · ${binding(0,'awakening')} awaken · ${binding(0,'swapWeapon')} swap · ${binding(0,'cycleItem')}/${binding(0,'useItem')} item`;
  if(mode==='local')$('#overlay-hint').textContent=`P2 ${binding(1,'left')}/${binding(1,'right')} move · ${binding(1,'jump')} jump · ${binding(1,'dashBack')}/${binding(1,'dashForward')} dash · ${binding(1,'attack')} basic · ${binding(1,'weapon')} weapon · ${binding(1,'block')} guard · ${binding(1,'special1')}/${binding(1,'special2')} jutsu · ${binding(1,'bloodline')} bloodline · ${binding(1,'replacement')} replace`;
  if(mode==='local')$('#p2-help').textContent=`P2 ${binding(1,'left')}/${binding(1,'right')} move · ${binding(1,'jump')} jump · ${binding(1,'dashBack')}/${binding(1,'dashForward')} dash · ${binding(1,'attack')}/${binding(1,'weapon')} basic/weapon · ${binding(1,'block')} guard`;
  for(const action of ['jump','dashBack','dashForward','attack','block'])$(`[data-action="${action}"] small`).textContent=binding(0,action);
  document.querySelector('footer>span:last-child').textContent=mode==='online'?'Online cannot pause · Leave match forfeits':'P / Esc pause';
  trainingUI?.draw();techniqueTray?.draw();loadoutUI?.sync();
  if(mode==='online')$('#p2-help').textContent=`Your controls operate P${online.slot+1} · ${player.name}. Online matches keep running in menus.`;
  if(mode==='training')$('#p2-help').textContent='Training dummy · Practice configures behavior and challenges';
  const snap=inputs[0].snapshot();buttons.forEach(b=>{
    const key=b.dataset.action,move=moveFor(player,key),cost=key==='replacement'?25:move?MOVES[move].cost:0;
    if(['special1','special2','bloodline'].includes(key))b.hidden=!controls?.visible(key)||(!controls?.editing&&!move);
    b.disabled=!controls?.editing&&mode!=='training'&&((['special1','special2','bloodline'].includes(key)&&!move)||(key==='awakening'&&!awakeningReady(player))||(key==='swapWeapon'&&!player.weapons[1])||(key==='useItem'&&!move));
    if(!move&&key==='bloodline')b.title='This fighter has no technique in this slot.';
    if(move)b.title=`${MOVES[move].name} · ${MOVES[move].cost} chakra · ${staminaCost(key)} stamina · ${MOVES[move].reach||'projectile'} range`;
    b.classList.toggle('awakening-ready',key==='awakening'&&awakeningReady(player));
    b.classList.toggle('active',snap[key]);b.classList.toggle('cooling',(player.cooldowns[key]??0)>0);
    b.classList.toggle('unavailable',b.disabled||player.chakra<cost||player.stamina<staminaCost(key)||(key==='bloodline'&&!move)||(key==='awakening'&&!awakeningReady(player))||(key==='swapWeapon'&&!player.weapons[1])||(key==='useItem'&&!move));
  });
}
let padMap=padBindings();window.addEventListener('arena:pad-map',()=>padMap=padBindings());
const gamepads=createGamepads({inputs,settings:experience,bindings:()=>padMap,isPlaying:()=>started&&!paused&&state.status==='playing'&&$('#rotate').hidden&&!document.querySelector('dialog[open]'),isLocal:()=>mode==='local',onPause:pause});
function frame(now){
  gamepads.poll();
  if(!lastTime)lastTime=now;
  if(mode==='online'){
    accumulator+=Math.min((now-lastTime)/1000,.1);
    while(accumulator>=1/TICK_RATE){const input=$('#rotate').hidden?inputs[0].consume():{},seq=online.send(input);if(seq!==null)prediction.push(seq,input);inputs[1].reset();accumulator-=1/TICK_RATE;}
  }else if(!paused&&state.status==='playing'){
    accumulator+=Math.min((now-lastTime)/1000,.1)*(mode==='training'?experience().speed:1);
    while(accumulator>=1/TICK_RATE&&state.status==='playing'){
      if(mode==='cpu')cpu=computerInput(state);
      if(mode==='training')stepTraining(state,inputs[0].consume());else stepMatch(state,[inputs[0].consume(),mode==='cpu'?cpu:inputs[1].consume()]);accumulator-=1/TICK_RATE;
      const event=state.events.find(e=>['jutsuLink','aerialBlocked','airChase','airFinish','airEscape','weaponSwap','raijinWarp','smokeBlocked','parry','guardBreak','punish','exhausted','hit','block','empty','pierce','replacement','unavailable','poison','burn','cooldown','awakeningBlocked'].includes(e.type));
      if(event){const messages={jutsuLink:'JUTSU LINK · FULL COST / WATCH THE COUNTER',aerialBlocked:event.reason,airChase:'AIR CHASE · LINK BASIC OR AERIAL JUTSU',airFinish:'AERIAL FINISHER',airEscape:'JUGGLE LIMIT · AIR RECOVERY',weaponSwap:'WEAPON SWAPPED',raijinWarp:'FLYING RAIJIN · WARP',smokeBlocked:'SMOKE BLOCKED PROJECTILE',parry:'PARRY · COUNTER NOW',guardBreak:'GUARD BROKEN',punish:'RECOVERY PUNISH · +20%',exhausted:'LOW STAMINA · CREATE SPACE',empty:'NOT ENOUGH CHAKRA',block:'GUARDED',replacement:'REPLACEMENT JUTSU',unavailable:'NO TECHNIQUE OR ITEM AVAILABLE',cooldown:'TECHNIQUE ON COOLDOWN',awakeningBlocked:'AWAKENING NOT READY OR UNABLE TO ACT'};
        $('#feedback').textContent=messages[event.type]??`${event.type==='pierce'?'GUARD PIERCED · ':event.type==='poison'?'POISON · ':event.type==='burn'?'BURN · ':''}${event.damage} DAMAGE`;feedbackUntil=now+700;}
    }
    if(state.status!=='playing')finish();
  }else accumulator=0;
  if(lastTime&&now-lastTime<250){frameTimes.push(now-lastTime);if(frameTimes.length>120)frameTimes.shift();}const q=online?.quality;netLabel.textContent=mode==='online'?`${q?.label??'Measuring'} · RTT ${q?.rtt??'—'}ms · jitter ${q?.jitter??0}ms · ${experience().prediction?'movement prediction':'authoritative movement'}`:mode==='training'?`Practice ${experience().speed}× · frame p95 ${Math.round([...frameTimes].sort((a,b)=>a-b)[Math.floor(frameTimes.length*.95)]??0)}ms · ${render.status().label}`:'';
  lastTime=now;if(now>feedbackUntil)$('#feedback').textContent='';render(state,{interpolate:mode==='online',predicted:mode==='online'&&experience().prediction?prediction.sample(state):null,localSlot:online?.slot??0});sound.update(state,started&&!paused&&$('#rotate').hidden);paintHud();requestAnimationFrame(frame);
}
$('#overlay-hint').textContent=`${difficultyFor(difficulty).name} · ${difficultyFor(difficulty).description}`;
orientation();requestAnimationFrame(frame);



document.documentElement.dataset.gameReady='true';document.dispatchEvent(new Event('arena:ready'));
