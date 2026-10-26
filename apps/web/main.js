import { createInput } from './packages/input/index.js';
import { createMatch, stepMatch, nextRound, computerInput, TICK_RATE, CHARACTERS, WEAPONS, MOVES, moveFor } from './packages/engine/index.js';
import { createControls } from './controls.js';
import { createRenderer } from './renderer.js';
const $ = selector => document.querySelector(selector);
const inputs=[createInput(),createInput()];
const buttons=[...document.querySelectorAll('[data-action]')];
const render=createRenderer($('#canvas'));
const portrait=matchMedia('(orientation: portrait)'), touch=matchMedia('(any-pointer: coarse)');
let controls;
let state=createMatch(), paused=true, started=false, mode='cpu', cpu={}, lastTime=0, accumulator=0, feedbackUntil=0;
const shortNames={special1:'RASENGAN',chidori:'CHIDORI',clone:'CLONE',fireball:'FIREBALL',lionFists:'TWIN LIONS',chakraStrike:'PALM STRIKE',snakeStrike:'SNAKES',seal:'SEAL',sharingan:'SHARINGAN',byakugan:'BYAKUGAN'};
function readLoadouts(){return [0,1].map(i=>({character:$(`#character${i}`).value,weapon:$(`#weapon${i}`).value}));}
function describeLoadouts(){
  for(const i of [0,1]){
    const character=CHARACTERS[$(`#character${i}`).value],weapon=WEAPONS[$(`#weapon${i}`).value];
    $(`#kit${i}`).innerHTML=`<strong>${character.title}</strong><br>${character.description}<br><span class="kit-label">${weapon.description}</span>`;
  }
  if(!started)state=createMatch(readLoadouts());
}
for(const i of [0,1]){
  for(const character of Object.values(CHARACTERS))$(`#character${i}`).add(new Option(character.name,character.id));
  for(const weapon of Object.values(WEAPONS))$(`#weapon${i}`).add(new Option(weapon.name,weapon.id));
  $(`#character${i}`).value=i===0?'naruto':'sasuke';
  $(`#character${i}`).addEventListener('change',describeLoadouts);$(`#weapon${i}`).addEventListener('change',describeLoadouts);
}
describeLoadouts();
function clearInputs(){controls?.reset();inputs.forEach(i=>i.reset());cpu={};buttons.forEach(b=>b.classList.remove('active'));}
function dialog(kicker,title,description,button){
  $('#overlay-kicker').textContent=kicker;$('#overlay-title').textContent=title;
  $('#overlay-description').textContent=description;$('#play').textContent=button;
  $('#overlay-hint').textContent=mode==='cpu'?'First to two wins · Pick a character and weapon for each fighter':'P2 arrows · N basic · B weapon · M guard · , / . signatures · / bloodline · V replace';
  $('#loadout-panel').hidden=started&&state.status!=='matchOver';
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
  if(!started||state.status==='matchOver')state=createMatch(readLoadouts());
  else if(state.status==='roundOver')nextRound(state);
  clearInputs();paused=false;started=true;accumulator=0;lastTime=performance.now();$('#overlay').hidden=true;$('#play').blur();$('#feedback').textContent='';
});
$('#pause').addEventListener('click',pause);
$('#mode').addEventListener('change',event=>{
  mode=event.target.value;state=createMatch();paused=true;started=false;clearInputs();
  $('#mode-name').textContent=mode==='cpu'?'VS COMPUTER':'LOCAL TWO PLAYER';
  $('#opponent-label').textContent=mode==='cpu'?'COMPUTER':'PLAYER TWO';
  $('#p2-help').textContent=mode==='cpu'?'CPU Sasuke · Chidori + fireball':'P2 arrows · N hit · M guard · , Chidori · . fireball';
  describeLoadouts();dialog('BUILD YOUR FIGHTING STYLE','Choose your shinobi.','Pick both fighters and equip a weapon before the battle.','Start match');
});
controls=createControls({inputs,onPause:pause,isPlaying:()=>!paused&&state.status==='playing'&&$('#rotate').hidden});
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
  const player=state.fighters[0];
  for(const [key,name,meta,bind] of [['special1','s1-name','s1-meta','U'],['special2','s2-name','s2-meta','I'],['bloodline','bl-name','bl-meta','O']]){
    const move=moveFor(player,key),cooldown=player.cooldowns[key]??0;
    $(`#${name}`).textContent=move?shortNames[move]:'BLOODLINE';
    $(`#${meta}`).textContent=move?`${controls?.binding(0,key)??bind} · ${cooldown>0?(cooldown/60).toFixed(1)+'s':MOVES[move].cost}`:`${controls?.binding(0,key)??bind} · NONE`;
  }
  $('#weapon-label').textContent=`${controls?.binding(0,'weapon')??'H'} · ${WEAPONS[player.weapon].name.toUpperCase()}`;
  $('#replacement-cd').textContent=player.cooldowns.replacement>0?`${controls?.binding(0,'replacement')??'R'} · ${(player.cooldowns.replacement/60).toFixed(1)}s`:`${controls?.binding(0,'replacement')??'R'} · 25`;
  $('#p2-help').textContent=mode==='cpu'?`CPU ${state.fighters[1].name} · ${WEAPONS[state.fighters[1].weapon].name}`:'P2 arrows · N/B basic/weapon · M guard · ,/. signatures · / bloodline · V replace';
  state.fighters.forEach((f,i)=>{
    $(`#name${i}`).textContent=f.name.toUpperCase();
    const labels=[...f.effects.map(e=>`${e.type.toUpperCase()} ${(e.remaining/60).toFixed(1)}s`),...f.buffs.map(b=>`${b.type.toUpperCase()} ${(b.remaining/60).toFixed(1)}s`)];
    if(f.invulnerable>0)labels.push('SUBSTITUTION');
    $(`#effects${i}`).textContent=labels.join(' · ');
    $(`#hp${i}`).textContent=Math.ceil(f.hp);$(`#health${i}`).style.width=`${f.hp/10}%`;$(`#chakra${i}`).style.width=`${f.chakra}%`;
    $(`#wins${i}`).textContent=[0,1].map(n=>n<state.wins[i]?'●':'○').join(' ');
  });
  $('#timer').textContent=Math.ceil(state.remainingTicks/TICK_RATE).toString().padStart(2,'0');
  $('#round').textContent=`ROUND ${state.round.toString().padStart(2,'0')}`;
  const binding=(player,action)=>controls?.binding(player,action)??'Unbound';
  const footer=document.querySelector('footer>span');
  footer.textContent=`P1 ${binding(0,'left')}/${binding(0,'right')} move · ${binding(0,'jump')} ×2 jump · ${binding(0,'dashBack')}/${binding(0,'dashForward')} dash · ${binding(0,'attack')} basic · ${binding(0,'weapon')} weapon · ${binding(0,'block')} guard · ${binding(0,'special1')}/${binding(0,'special2')} jutsu · ${binding(0,'bloodline')} bloodline · ${binding(0,'replacement')} replace`;
  if(mode==='local')$('#overlay-hint').textContent=`P2 ${binding(1,'left')}/${binding(1,'right')} move · ${binding(1,'jump')} jump · ${binding(1,'attack')} basic · ${binding(1,'weapon')} weapon · ${binding(1,'block')} guard · ${binding(1,'special1')}/${binding(1,'special2')} jutsu · ${binding(1,'bloodline')} bloodline · ${binding(1,'replacement')} replace`;
  if(mode==='local')$('#p2-help').textContent=`P2 ${binding(1,'left')}/${binding(1,'right')} move · ${binding(1,'jump')} jump · ${binding(1,'attack')}/${binding(1,'weapon')} basic/weapon · ${binding(1,'block')} guard`;
  for(const action of ['jump','dashBack','dashForward','attack','block'])$(`[data-action="${action}"] small`).textContent=binding(0,action);
  const snap=inputs[0].snapshot();buttons.forEach(b=>{
    const key=b.dataset.action,move=moveFor(player,key),cost=key==='replacement'?25:move?MOVES[move].cost:0;
    b.disabled=key==='bloodline'&&!move&&!controls?.editing;
    b.classList.toggle('active',snap[key]);b.classList.toggle('cooling',(player.cooldowns[key]??0)>0);
    b.classList.toggle('unavailable',b.disabled||player.chakra<cost);
  });
}
function frame(now){
  if(!lastTime)lastTime=now;
  if(!paused&&state.status==='playing'){
    accumulator+=Math.min((now-lastTime)/1000,.1);
    while(accumulator>=1/TICK_RATE&&state.status==='playing'){
      if(state.tick%8===0)cpu=computerInput(state);
      stepMatch(state,[inputs[0].consume(),mode==='cpu'?cpu:inputs[1].consume()]);accumulator-=1/TICK_RATE;
      const event=state.events.find(e=>['hit','block','empty','pierce','replacement','unavailable','poison','burn','cooldown'].includes(e.type));
      if(event){const messages={empty:'NOT ENOUGH CHAKRA',block:'GUARDED',replacement:'REPLACEMENT JUTSU',unavailable:'NO BLOODLINE IN THIS KIT',cooldown:'TECHNIQUE ON COOLDOWN'};
        $('#feedback').textContent=messages[event.type]??`${event.type==='pierce'?'GUARD PIERCED · ':event.type==='poison'?'POISON · ':event.type==='burn'?'BURN · ':''}${event.damage} DAMAGE`;feedbackUntil=now+700;}
    }
    if(state.status!=='playing')finish();
  }else accumulator=0;
  lastTime=now;if(now>feedbackUntil)$('#feedback').textContent='';render(state);paintHud();requestAnimationFrame(frame);
}
orientation();requestAnimationFrame(frame);

