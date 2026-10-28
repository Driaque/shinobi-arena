import {createStickGestures} from './packages/input/analog.js';
import { ACTIONS } from './packages/input/index.js';
import { STORAGE_KEY, CONTROL_IDS, DEFAULT_KEYS, freshSettings, readSettings, stickVector, defaultLayout, defaultDockLayout, layoutProfile, projectControl, layoutOverlaps, rebind, keyLabel, keyForAction } from './packages/input/preferences.js';
export const ACTION_LABELS={jutsu4:'Jutsu 4',jutsu5:'Jutsu 5',jutsu6:'Jutsu 6',jutsu7:'Jutsu 7',charge:'Charge chakra',swapWeapon:'Swap weapon',cycleItem:'Choose consumable',useItem:'Use consumable',crouch:'Crouch',awakening:'Awakening',stick:'Movement stick',left:'Move left',right:'Move right',jump:'Double jump',attack:'Basic attack',weapon:'Weapon',block:'Guard',special1:'Signature 1',special2:'Signature 2',bloodline:'Bloodline',replacement:'Replacement',dashForward:'Dash forward',dashBack:'Dash backward'};
export function createControls({inputs,onPause,isPlaying}) {
  const $=s=>document.querySelector(s),arena=$('.arena'),stick=$('#joystick');
  const nodes=Object.fromEntries(CONTROL_IDS.map(id=>[id,$(`[data-control="${id}"]`)]));
  const editor=$('#layout-editor'),keysDialog=$('#keys-dialog'),overlay=$('#overlay');
  let settings;try{settings=readSettings(localStorage.getItem(STORAGE_KEY));}catch{settings=freshSettings();}
  const gestures=createStickGestures();
  let draft=null,editing=false,selected='stick',drag=null,stickPointer=null,listening=null,previousOverlay=false;
  const current=()=>draft??settings;
  const dimensions=()=>({width:arena.clientWidth,height:arena.clientHeight});
  const profile=()=>layoutProfile(arena.clientWidth);
  const layoutKey=()=>current().placement==='dock'?'dockLayouts':'layouts';
  const layout=()=>current()[layoutKey()][profile()]??(current().placement==='dock'?defaultDockLayout:defaultLayout)(arena.clientWidth,arena.clientHeight);
  function editableLayout(){draft[layoutKey()][profile()]??=structuredClone(layout());return draft[layoutKey()][profile()];}
  function message(text){$('#editor-message').textContent=text;}
  function resetStick(cancel=true){stickPointer=null;inputs[0].release('stick');inputs[0].release('stick-crouch');if(cancel)gestures.reset();else gestures.release();stick.style.setProperty('--stick-x','0px');stick.style.setProperty('--stick-y','0px');stick.classList.remove('active');}
  function reset(){resetStick();drag=null;inputs.forEach(i=>i.reset());}
  function collisionMessage(){const {width,height}=dimensions(),pairs=layoutOverlaps(layout(),width,height,current().placement,current().visibility);return pairs.length?`Separate ${ACTION_LABELS[pairs[0][0]]} and ${ACTION_LABELS[pairs[0][1]]} before saving.`:'';}
  function applyLayout(){
    const {width,height}=dimensions(),positions=layout();
    arena.dataset.controlPlacement=current().placement;
    arena.style.setProperty('--control-opacity',current().opacity);
    $('#control-opacity').value=Math.round(current().opacity*100);$('#opacity-value').textContent=`${Math.round(current().opacity*100)}%`;
    $('#control-placement').value=current().placement;
    for(const [id,node]of Object.entries(nodes)){
      node.hidden=current().visibility[id]===false;
      const p=projectControl(positions[id],width,height,id,current().placement);
      Object.assign(node.style,{left:`${p.x}px`,top:`${p.y}px`,width:`${p.size}px`,height:`${p.size}px`});
      node.classList.toggle('selected-control',editing&&selected===id);
    }
    if(editing){
      $('#control-select').value=selected;$('#control-size').min=selected==='stick'?88:48;$('#control-size').max=selected==='stick'?(current().placement==='dock'?120:160):90;
      $('#control-size').value=positions[selected].size;$('#size-value').textContent=`${Math.round(positions[selected].size)} px`;
      for(const box of document.querySelectorAll('[data-control-visible]'))box.checked=current().visibility[box.dataset.controlVisible];
      message(collisionMessage()||'Drag visible controls. Uncheck to hide; keyboard bindings still work. Online fights continue.');
    }
  }
  function select(id){selected=id;applyLayout();}
  function dragStart(event,id){
    if(!editing)return false;
    event.preventDefault();select(id);const rect=nodes[id].getBoundingClientRect();
    drag={id,pointer:event.pointerId,offsetX:event.clientX-rect.left-rect.width/2,offsetY:event.clientY-rect.top-rect.height/2};
    nodes[id].setPointerCapture(event.pointerId);return true;
  }
  function dragMove(event){
    if(!drag||drag.pointer!==event.pointerId)return;
    const rect=arena.getBoundingClientRect(),{width,height}=dimensions();
    const candidate={...editableLayout()[drag.id],x:(event.clientX-rect.left-drag.offsetX)/width,y:(event.clientY-rect.top-drag.offsetY)/height};
    const p=projectControl(candidate,width,height,drag.id,current().placement);
    editableLayout()[drag.id]={x:p.x/width,y:p.y/height,size:p.size};applyLayout();
  }
  function moveStick(event){
    if(stickPointer!==event.pointerId)return;
    const r=stick.getBoundingClientRect(),radius=r.width*.36;
    const dx=event.clientX-r.left-r.width/2,dy=event.clientY-r.top-r.height/2;
    const vector=stickVector(dx,dy,radius),distance=Math.hypot(dx,dy),limit=distance>radius?radius/distance:1;
    const intent=gestures.update(vector,performance.now());
    inputs[0].setAxis('stick',intent.moveX);
    if(intent.jump){inputs[0].press('jump','stick-jump');inputs[0].release('stick-jump');}
    if(intent.crouch)inputs[0].press('crouch','stick-crouch');else inputs[0].release('stick-crouch');
    if(intent.dashDirection)inputs[0].dash(intent.dashDirection);
    stick.style.setProperty('--stick-x',`${dx*limit}px`);stick.style.setProperty('--stick-y',`${dy*limit}px`);
    stick.classList.toggle('active',Math.hypot(vector.x,vector.y)>.01);
  }
  for(const [id,node]of Object.entries(nodes)){
    node.addEventListener('pointerdown',event=>{
      if(dragStart(event,id))return;
      if(!isPlaying()||node.disabled)return;
      if(id==='stick'){
        if(stickPointer!==null)return;
        event.preventDefault();stickPointer=event.pointerId;node.setPointerCapture(event.pointerId);moveStick(event);
      }else{event.preventDefault();node.setPointerCapture(event.pointerId);inputs[0].press(id,`pointer:${event.pointerId}`);node.classList.add('active');}
    });
    node.addEventListener('pointermove',event=>{if(editing)dragMove(event);else if(id==='stick')moveStick(event);});
    for(const type of ['pointerup','pointercancel','lostpointercapture'])node.addEventListener(type,event=>{
      if(drag?.pointer===event.pointerId)drag=null;
      if(id==='stick'){if(stickPointer===event.pointerId)resetStick(type!=='pointerup');}
      else{inputs[0].release(`pointer:${event.pointerId}`);node.classList.toggle('active',inputs[0].snapshot()[id]);}
    });
    node.addEventListener('contextmenu',event=>event.preventDefault());
  }
  function renderKeys(){
    const container=$('#key-bindings');container.replaceChildren();
    for(const player of [0,1]){
      const section=document.createElement('section'),title=document.createElement('h3');title.textContent=`Player ${player+1}`;section.append(title);
      for(const action of ACTIONS){
        const row=document.createElement('div');row.className='binding-row';const label=document.createElement('span');label.textContent=ACTION_LABELS[action];
        const button=document.createElement('button');button.type='button';button.dataset.bindPlayer=player;button.dataset.bindAction=action;
        button.textContent=keyLabel(keyForAction(current().keys,player,action));button.setAttribute('aria-label',`Bind player ${player+1} ${ACTION_LABELS[action]}`);
        button.addEventListener('click',()=>{listening={player,action};$('#key-message').textContent=`Press a key for player ${player+1}: ${ACTION_LABELS[action]}. Escape cancels.`;button.textContent='Press key…';});
        const clear=document.createElement('button');clear.type='button';clear.className='clear-key';clear.textContent='Clear';clear.setAttribute('aria-label',`Clear player ${player+1} ${ACTION_LABELS[action]}`);
        clear.addEventListener('click',()=>{listening=null;draft.keys=rebind(draft.keys,player,action,null);renderKeys();$('#key-message').textContent='Binding cleared. Save the control editor to keep changes.';});
        row.append(label,button,clear);section.append(row);
      }
      container.append(section);
    }
  }
  function closeKeys(){listening=null;keysDialog.close();}
  $('#key-settings').addEventListener('click',()=>{reset();renderKeys();$('#key-message').textContent='Select an action, then press its new key. Bindings must be unique across both players.';keysDialog.showModal();});
  $('#close-keys').addEventListener('click',closeKeys);
  keysDialog.addEventListener('cancel',event=>{event.preventDefault();closeKeys();});
  $('#reset-keys').addEventListener('click',()=>{listening=null;draft.keys=DEFAULT_KEYS.map(m=>({...m}));renderKeys();$('#key-message').textContent='Default keys restored in this draft.';});
  function open(){
    if(editing)return;onPause();reset();previousOverlay=overlay.hidden;overlay.hidden=true;
    draft=structuredClone(settings);editing=true;arena.classList.add('editing-controls');editor.hidden=false;$('#mode').disabled=true;applyLayout();
  }
  function close(){
    reset();editing=false;draft=null;arena.classList.remove('editing-controls');editor.hidden=true;$('#mode').disabled=false;
    overlay.hidden=previousOverlay;applyLayout();$('#control-settings').focus();
  }
  for(const id of CONTROL_IDS){
    const label=document.createElement('label'),box=document.createElement('input');box.type='checkbox';box.dataset.controlVisible=id;box.checked=true;
    box.addEventListener('change',()=>{reset();draft.visibility[id]=box.checked;applyLayout();});label.append(box,document.createTextNode(ACTION_LABELS[id]));$('#control-visibility').append(label);
  }
  $('#control-settings').addEventListener('click',open);
  $('#cancel-controls').addEventListener('click',close);
  $('#save-controls').addEventListener('click',()=>{
    const warning=collisionMessage();if(warning){message(warning);return;}
    settings=structuredClone(draft);
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(settings));$('#status').textContent='Controls saved on this device.';}
    catch{$('#status').textContent='Storage is unavailable. These controls apply until this page closes.';}
    close();
  });
  $('#reset-layout').addEventListener('click',()=>{draft[layoutKey()][profile()]=(current().placement==='dock'?defaultDockLayout:defaultLayout)(arena.clientWidth,arena.clientHeight);applyLayout();});
  $('#control-opacity').addEventListener('input',event=>{draft.opacity=Number(event.target.value)/100;applyLayout();});
  $('#control-placement').addEventListener('change',event=>{reset();draft.placement=event.target.value;applyLayout();});
  // Suppress native zoom/scroll only on the live play surface; menus retain normal scrolling.
  const preventPlayGesture=event=>{if(!editing&&isPlaying()&&!event.target.closest('#overlay,#layout-editor,#jutsu-tray,dialog'))event.preventDefault();};
  for(const type of ['touchstart','touchmove','gesturestart','gesturechange','gestureend','dblclick'])arena.addEventListener(type,preventPlayGesture,{passive:false});
  for(const id of CONTROL_IDS)$('#control-select').add(new Option(ACTION_LABELS[id],id));
  $('#control-select').addEventListener('change',event=>select(event.target.value));
  $('#control-size').addEventListener('input',event=>{editableLayout()[selected].size=Number(event.target.value);applyLayout();});
  window.addEventListener('keydown',event=>{
    if(keysDialog.open){
      if(!listening)return;
      event.preventDefault();event.stopPropagation();
      if(event.code==='Escape'){listening=null;renderKeys();$('#key-message').textContent='Binding cancelled.';return;}
      if(event.repeat)return;
      try{draft.keys=rebind(draft.keys,listening.player,listening.action,event.code);listening=null;renderKeys();$('#key-message').textContent='Binding changed. Save the control editor to keep changes.';}
      catch(error){$('#key-message').textContent=error.message;}
      return;
    }
    if(editing){if(event.code==='Escape'){event.preventDefault();close();}return;}
    if(event.target.closest('input,select,textarea,dialog')||!$('#rotate').hidden)return;
    if(['KeyP','Escape'].includes(event.code)){if(!event.repeat)onPause();return;}
    const player=current().keys.findIndex(m=>m[event.code]);
    if(player<0||!isPlaying()||player===1&&$('#mode').value==='cpu')return;
    event.preventDefault();inputs[player].press(current().keys[player][event.code],event.code);
  });
  window.addEventListener('keyup',event=>inputs.forEach(i=>i.release(event.code)));
  new ResizeObserver(()=>{reset();applyLayout();}).observe(arena);
  applyLayout();
  return {reset,get editing(){return editing;},binding:(player,action)=>keyLabel(keyForAction(current().keys,player,action))};
}

