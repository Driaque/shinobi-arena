import {createInput} from './packages/input/index.js';
import {stepMatch,nextRound,computerInput,CHARACTERS,MOVES,moveFor} from './packages/engine/index.js';
import {STORY_CHAPTER,createStoryFight} from './packages/engine/story.js';
import {PROTOCOL_VERSION,RULES_VERSION} from './packages/network/protocol.js';
import {createPracticeRenderer} from './practice-renderer.js';
import {apiBase,ensureIdentity} from './arena-api.js';
const $=s=>document.querySelector(s),input=createInput(),render=createPracticeRenderer($('#adventure-canvas'),{viewer:true});
const KEY='fabled.story.northern-echoes.v1';let checkpoint=0;
try{const n=Number(localStorage.getItem(KEY));if(Number.isInteger(n)&&n>=0&&n<=3)checkpoint=n;}catch{}
const saveCheckpoint=()=>{try{localStorage.setItem(KEY,String(checkpoint));}catch{}$('#story-checkpoint').textContent=checkpoint===3?'Chapter complete. Replay any time.':checkpoint?`Continue at encounter ${checkpoint+1} of 3.`:'Three encounters. One shared truth.';$('#start-story').textContent=checkpoint===3?'Replay chapter':checkpoint?'Continue chapter':'Begin chapter';};saveCheckpoint();
let mode='',state=null,index=0,paused=true,socket=null,generation=0,seq=0,slot=0,phase='',last=0,accumulator=0,pingTimer,timeout,lastMessage=0,nextAction=()=>{};
const status=text=>{$('#adventure-status').textContent=text;};
function dialogue(kicker,title,copy,label,action){paused=true;input.reset();$('#story-kicker').textContent=kicker;$('#story-heading').textContent=title;$('#story-copy').textContent=copy;$('#story-next').textContent=label;nextAction=action;if(!$('#story-dialog').open)$('#story-dialog').showModal();}
$('#story-next').onclick=()=>{$('#story-dialog').close();nextAction();};
$('#story-dialog').addEventListener('cancel',e=>e.preventDefault());
function active(){return state?.status==='playing'&&!paused&&!$('#story-dialog').open;}
function closeConnection(){generation++;clearTimeout(timeout);clearInterval(pingTimer);const ws=socket;socket=null;if(ws){if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify({type:'cancel'}));ws.close();}phase='';input.reset();$('#host-coop').disabled=false;$('#join-coop').disabled=false;}
function menu(){closeConnection();state=null;mode='';paused=true;$('#adventure-menu').hidden=false;$('#adventure-play').hidden=true;$('#pause-adventure').hidden=true;$('#leave-adventure').hidden=true;if($('#story-dialog').open)$('#story-dialog').close();saveCheckpoint();}
function playView(){input.reset();$('#adventure-menu').hidden=true;$('#adventure-play').hidden=false;$('#leave-adventure').hidden=false;$('#pause-adventure').hidden=mode!=='story';last=0;accumulator=0;}
function beginEncounter(){state=createStoryFight(index,$('#story-difficulty').value);playView();const e=STORY_CHAPTER.encounters[index];$('#adventure-title').textContent=`${index+1}/3 · ${e.title}`;dialogue(STORY_CHAPTER.subtitle,e.speaker,e.before,'Fight',()=>{paused=false;last=0;});}
$('#start-story').onclick=()=>{closeConnection();mode='story';index=checkpoint===3?0:checkpoint;status('');beginEncounter();};
$('#restart-story').onclick=()=>{checkpoint=0;saveCheckpoint();$('#start-story').click();};
function finishStory(){paused=true;input.reset();if(state.status==='roundOver'){dialogue('ROUND COMPLETE',state.result==='player1'?'Round won':state.result==='draw'?'Draw':'Round lost','Take a breath. The encounter continues.','Next round',()=>{nextRound(state);paused=false;last=0;});return;}
 if(state.result!=='player1'){dialogue('TRY AGAIN','The story continues when you are ready.','Retry this encounter with the same kit. Your earlier chapter progress is safe.','Retry encounter',beginEncounter);return;}
 checkpoint=Math.max(checkpoint,index+1);saveCheckpoint();const e=STORY_CHAPTER.encounters[index];dialogue('ENCOUNTER COMPLETE',e.title,e.after,index===2?'Read ending':'Continue',()=>{if(index===2)dialogue('CHAPTER COMPLETE','Northern Echoes',STORY_CHAPTER.ending,'Return to adventures',()=>{menu();status('Northern Echoes complete. Your chapter progress is saved on this device.');});else{index++;beginEncounter();}});
}
function pauseStory(){if(mode!=='story'||!active())return;dialogue('PAUSED','Your journey can wait.','Resume when you are ready.','Resume',()=>{paused=false;last=0;});}
$('#pause-adventure').onclick=pauseStory;
$('#leave-adventure').onclick=()=>{menu();status('Adventure ended. Story checkpoints are kept.');};
function fail(text){closeConnection();paused=true;mode='';state=null;$('#adventure-menu').hidden=false;$('#adventure-play').hidden=true;$('#leave-adventure').hidden=true;$('#pause-adventure').hidden=true;status(text);}
async function join(room){
 if(!/^[A-Z0-9]{8}$/.test(room)){status('Enter the eight-character room code your friend shared.');return;}
 if(socket||phase==='connecting')return;closeConnection();const gen=generation;mode='coop';phase='connecting';status('Connecting to co-op…');$('#leave-adventure').hidden=false;$('#host-coop').disabled=true;$('#join-coop').disabled=true;
 timeout=setTimeout(()=>{if(gen===generation)fail('Connection timed out. Check your connection and try again.');},15000);
 try{const name=$('#adventure-name').value.trim();if(!/^[\p{L}\p{N} _.-]{2,20}$/u.test(name))throw new Error('Use 2–20 letters, numbers, spaces, dots, underscores or hyphens for your name.');const base=await apiBase(),token=await ensureIdentity(name,base);if(gen!==generation)return;
 const url=new URL('/ws',base);url.protocol=url.protocol==='https:'?'wss:':'ws:';const ws=socket=new WebSocket(url);seq=0;lastMessage=performance.now();
 ws.onmessage=e=>{if(gen!==generation)return;let m;try{m=JSON.parse(e.data);}catch{return;}lastMessage=performance.now();
 if(m.type==='hello'){if(m.protocol!==PROTOCOL_VERSION||m.rules!==RULES_VERSION){fail('Game and server versions differ. Refresh after both are deployed.');return;}const character=$('#coop-fighter').value;ws.send(JSON.stringify({type:'join',queue:'coop',room,token,protocol:PROTOCOL_VERSION,rules:RULES_VERSION,profile:{name,character,weapon:CHARACTERS[character].defaultWeapon??'katana'}}));}
 if(m.type==='queued'){clearTimeout(timeout);phase='queued';status(`Room ${room} · Waiting for your friend. Share this code; they must choose Join room.`);}
 if(m.type==='matched'||m.type==='snapshot'){clearTimeout(timeout);if(m.type==='matched'){slot=m.slot;playView();status(`Room ${room} · You control ${m.players[slot].name}, P${slot+1}.`);}phase=m.phase;state=m.state;paused=phase!=='playing';$('#adventure-title').textContent=`Hold the Terrace · Wave ${state.coop.wave}/${state.coop.totalWaves}`;if(phase==='countdown')status(`Room ${room} · Both allies ready. Starting in ${m.countdown}…`);
 if(phase==='matchOver'){const won=state.coop.outcome==='victory';closeConnection();dialogue(won?'TERRACE SECURED':'EXPEDITION ENDED',won?'You held the line together.':'Regroup and try again.',won?'All three waves cleared. Both allies share the victory.':'The team fell or the wave timer expired. Create a new room to retry.','Return to adventures',()=>{menu();status('');});}}
 if(m.type==='error')fail(m.message);
 if(m.type==='ended')fail(m.reason==='server-shutdown'?'Server restarting. Create a new room shortly.':'Your ally left or the room closed. Create a new room to regroup.');
 };
 ws.onopen=()=>{pingTimer=setInterval(()=>{if(gen!==generation)return;if(performance.now()-lastMessage>12000){fail('Connection lost. This expedition cannot reconnect; create a new room.');return;}if(ws.readyState===WebSocket.OPEN)ws.send(JSON.stringify({type:'ping',sent:performance.now()}));},3000);};
 ws.onerror=()=>{if(gen===generation)fail('Could not reach the co-op server. Try again shortly.');};ws.onclose=()=>{if(gen===generation)fail('Connection closed. Create a new room to regroup.');};
 }catch(e){if(gen===generation)fail(e.message);}finally{if(gen===generation){$('#host-coop').disabled=false;$('#join-coop').disabled=false;}}
}
$('#host-coop').onclick=()=>{const bytes=crypto.getRandomValues(new Uint8Array(8)),alphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789',room=Array.from(bytes,n=>alphabet[n%alphabet.length]).join('');$('#coop-room').value=room;join(room);};
$('#join-coop').onclick=()=>join($('#coop-room').value.trim().toUpperCase());
const keys={KeyA:'left',KeyD:'right',KeyZ:'depthUp',KeyL:'depthDown',KeyW:'jump',KeyQ:'dashBack',KeyE:'dashForward',KeyJ:'attack',KeyH:'weapon',KeyK:'block',KeyU:'special1',KeyI:'special2',KeyO:'bloodline',KeyR:'replacement',KeyG:'charge',KeyT:'awakening'};
window.addEventListener('keydown',e=>{if(e.code==='Escape'||e.code==='KeyP'){pauseStory();return;}if(!active()||!keys[e.code]||e.repeat||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;e.preventDefault();input.press(keys[e.code],e.code);});window.addEventListener('keyup',e=>input.release(e.code));
for(const b of document.querySelectorAll('[data-action]')){b.addEventListener('pointerdown',e=>{if(!active())return;e.preventDefault();b.setPointerCapture(e.pointerId);input.press(b.dataset.action,'pointer'+e.pointerId);b.classList.add('active');});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,e=>{input.release('pointer'+e.pointerId);b.classList.remove('active');});}
function clearInput(){input.reset();document.querySelectorAll('.active').forEach(b=>b.classList.remove('active'));pauseStory();}
window.addEventListener('blur',clearInput);document.addEventListener('visibilitychange',()=>{if(document.hidden)clearInput();});window.addEventListener('pagehide',()=>{closeConnection();render.dispose();});
let hudKey='';function hud(){const title=state.coop?`Wave ${state.coop.wave}/${state.coop.totalWaves}`:`Encounter ${index+1}/3`;$('#adventure-clock').textContent=state.coop?.breakTicks?'Regrouping…':`${Math.ceil(state.remainingTicks/60)}s`;const next=JSON.stringify(state.fighters.map(f=>[f.character,f.hp,f.chakra,f.stamina,f.guard]));if(next!==hudKey){hudKey=next;const list=$('#adventure-vitals');list.replaceChildren();state.fighters.forEach((f,i)=>{const n=document.createElement('div');n.className='vital'+(state.coop?f.team===1?' enemy':'':i===1?' enemy':'');const name=document.createElement('strong');name.textContent=`${state.coop?(f.team===0?i===slot?'YOU · ':'ALLY · ':'ENEMY · '):''}${f.name} · ${Math.ceil(f.hp)} HP`;const bar=document.createElement('meter');bar.min=0;bar.max=1000;bar.value=f.hp;bar.setAttribute('aria-label',`${f.name} health`);const meta=document.createElement('span');meta.textContent=`Chakra ${Math.floor(f.chakra)} · Stamina ${Math.floor(f.stamina)}`;n.append(name,bar,meta);list.append(n);});}
 const me=state.fighters[mode==='coop'?slot:0];for(const [action,label]of [['special1','Technique 1'],['special2','Technique 2'],['bloodline','Bloodline']]){const id=moveFor(me,action),b=$(`[data-action=${action}]`);b.textContent=id?`${MOVES[id].name}${me.cooldowns[action]>0?' · '+Math.ceil(me.cooldowns[action]/60)+'s':''}`:label+' · empty';b.disabled=!id;}
 $('#adventure-feedback').textContent=state.coop?state.coop.breakTicks?'Wave cleared. Allies recover before the next wave.':me.hp<=0?'Knocked out. Your ally can clear this wave to bring you back.':`${title} · Blue team holds together. No friendly fire.`:`${title} · ${state.wins[0]} – ${state.wins[1]} rounds`;
}
function frame(now){if(state){if(active()){accumulator+=last?Math.min((now-last)/1000,.1):0;while(accumulator>=1/60&&active()){const commands=input.consume();if(mode==='coop'){if(socket?.readyState===WebSocket.OPEN)socket.send(JSON.stringify({type:'input',seq:seq++,input:commands}));}else{stepMatch(state,[commands,computerInput(state)]);if(state.status!=='playing')finishStory();}accumulator-=1/60;}}else accumulator=0;render(state,{interpolate:mode==='coop',localAlpha:mode==='story'?accumulator*60:0});hud();}last=now;requestAnimationFrame(frame);}requestAnimationFrame(frame);
