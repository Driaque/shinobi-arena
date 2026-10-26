import { createInput } from './packages/input/index.js';
import { createMatch, stepMatch, nextRound, computerInput, TICK_RATE } from './packages/engine/index.js';
import { createRenderer } from './renderer.js';
const $ = selector => document.querySelector(selector);
const inputs=[createInput(),createInput()];
const buttons=[...document.querySelectorAll('[data-action]')];
const render=createRenderer($('#canvas'));
const portrait=matchMedia('(orientation: portrait)'), touch=matchMedia('(any-pointer: coarse)');
const maps=[{KeyA:'left',KeyD:'right',KeyW:'jump',KeyJ:'attack',KeyK:'block',KeyU:'special1',KeyI:'special2'},
  {ArrowLeft:'left',ArrowRight:'right',ArrowUp:'jump',KeyN:'attack',KeyM:'block',Comma:'special1',Period:'special2'}];
let state=createMatch(), paused=true, started=false, mode='cpu', cpu={}, lastTime=0, accumulator=0, feedbackUntil=0;
function clearInputs(){inputs.forEach(i=>i.reset());cpu={};buttons.forEach(b=>b.classList.remove('active'));}
function dialog(kicker,title,description,button){
  $('#overlay-kicker').textContent=kicker;$('#overlay-title').textContent=title;
  $('#overlay-description').textContent=description;$('#play').textContent=button;
  $('#overlay-hint').textContent=mode==='cpu'?'You are Naruto · First to two wins':'P2: arrows move/jump · N hit · M guard · comma / period specials';
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
  const name=state.result==='player1'?'Naruto':'Sasuke';
  const draw=state.result==='draw';
  dialog(state.status==='matchOver'?'MATCH COMPLETE':`ROUND ${state.round} COMPLETE`,draw?'An even match.':`${name} wins.`,
    draw?'No point awarded. Settle it in the next round.':`${state.wins[0]} — ${state.wins[1]} · ${state.status==='matchOver'?'Ready for another fight?':'The rivalry continues.'}`,
    state.status==='matchOver'?'Rematch':'Next round');
}
$('#play').addEventListener('click',()=>{
  if(touch.matches&&portrait.matches)return;
  if(state.status==='matchOver')state=createMatch();
  else if(state.status==='roundOver')nextRound(state);
  clearInputs();paused=false;started=true;accumulator=0;lastTime=performance.now();$('#overlay').hidden=true;$('#play').blur();$('#feedback').textContent='';
});
$('#pause').addEventListener('click',pause);
$('#mode').addEventListener('change',event=>{
  mode=event.target.value;state=createMatch();paused=true;started=false;clearInputs();
  $('#mode-name').textContent=mode==='cpu'?'VS COMPUTER':'LOCAL TWO PLAYER';
  $('#p2-help').textContent=mode==='cpu'?'CPU Sasuke · Chidori + fireball':'P2 arrows · N hit · M guard · , Chidori · . fireball';
  dialog('NEW MATCH',mode==='cpu'?'Challenge Sasuke.':'Bring a rival.','Changing modes starts a fresh match.','Start match');
});
for(const button of buttons){
  button.addEventListener('pointerdown',event=>{
    if(paused||!$('#rotate').hidden||state.status!=='playing')return;
    event.preventDefault();button.setPointerCapture(event.pointerId);
    inputs[0].press(button.dataset.action,`pointer:${event.pointerId}`);button.classList.add('active');
  });
  for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,event=>{inputs[0].release(`pointer:${event.pointerId}`);button.classList.toggle('active',inputs[0].snapshot()[button.dataset.action]);});
  button.addEventListener('contextmenu',event=>event.preventDefault());
}
window.addEventListener('keydown',event=>{
  if(event.target.closest('input,select,textarea')||!$('#rotate').hidden)return;
  if(['KeyP','Escape'].includes(event.code)){if(!event.repeat)pause();return;}
  const player=maps.findIndex(m=>m[event.code]);
  if(player<0||paused||player===1&&mode==='cpu')return;
  event.preventDefault();inputs[player].press(maps[player][event.code],event.code);
});
window.addEventListener('keyup',event=>inputs.forEach(i=>i.release(event.code)));
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
  state.fighters.forEach((f,i)=>{
    $(`#hp${i}`).textContent=Math.ceil(f.hp);$(`#health${i}`).style.width=`${f.hp/10}%`;$(`#chakra${i}`).style.width=`${f.chakra}%`;
    $(`#wins${i}`).textContent=[0,1].map(n=>n<state.wins[i]?'●':'○').join(' ');
  });
  $('#timer').textContent=Math.ceil(state.remainingTicks/TICK_RATE).toString().padStart(2,'0');
  $('#round').textContent=`ROUND ${state.round.toString().padStart(2,'0')}`;
  const snap=inputs[0].snapshot();buttons.forEach(b=>b.classList.toggle('active',snap[b.dataset.action]));
}
function frame(now){
  if(!lastTime)lastTime=now;
  if(!paused&&state.status==='playing'){
    accumulator+=Math.min((now-lastTime)/1000,.1);
    while(accumulator>=1/TICK_RATE&&state.status==='playing'){
      if(state.tick%8===0)cpu=computerInput(state);
      stepMatch(state,[inputs[0].consume(),mode==='cpu'?cpu:inputs[1].consume()]);accumulator-=1/TICK_RATE;
      const event=state.events.find(e=>e.type==='hit'||e.type==='block'||e.type==='empty');
      if(event){$('#feedback').textContent=event.type==='empty'?'NOT ENOUGH CHAKRA':event.type==='block'?'GUARDED':`${event.damage} DAMAGE`;feedbackUntil=now+700;}
    }
    if(state.status!=='playing')finish();
  }else accumulator=0;
  lastTime=now;if(now>feedbackUntil)$('#feedback').textContent='';render(state);paintHud();requestAnimationFrame(frame);
}
orientation();requestAnimationFrame(frame);
