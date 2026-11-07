import {canControlSetup} from './packages/input/setup-ownership.js';
import {menuDirection} from './packages/input/cursor.js';
import {createControllerCursor} from './controller-cursor.js';
import {createGamepads,PAD_ABILITIES} from './packages/input/gamepad.js';
import {experience,padBindings,padAbilityBindings} from './experience.js';

const XBOX=['A','B','X','Y','LB','RB','LT','RT','View','Menu','LS','RS','↑','↓','←','→'];
const PLAYSTATION=['✕','○','□','△','L1','R1','L2','R2','Create','Options','L3','R3','↑','↓','←','→'];
let activePad=null;
export function controllerBinding(action){
 if(document.documentElement.dataset.inputMethod!=='controller'||!activePad)return null;
 const labels=/dualsense|dualshock|playstation|054c|sony/i.test(activePad.id)?PLAYSTATION:XBOX,map=padBindings();
 const index=map.indexOf(action);if(index>=0)return labels[index];
 const modifier=map.indexOf('abilities'),button=Object.keys(padAbilityBindings()).find(b=>padAbilityBindings()[b]===action);
 return modifier>=0&&button!==undefined?`${labels[modifier]}+${labels[button]}`:'Unbound';
}
export function createControllerUI({inputs,isPlaying,isLocal,onPause}){
 const root=document.documentElement,arena=document.querySelector('.arena'),connected=new Map();
 const header=document.querySelector('.topbar')??document.querySelector('#game > header'),tools=document.querySelector('.tools');
 const collapse=document.createElement('button');collapse.id='navigation-toggle';collapse.type='button';
 let collapsed=false;try{collapsed=localStorage.getItem('fabled.navigation.collapsed')==='true';}catch{}
 const fold=()=>{header.classList.toggle('navigation-collapsed',collapsed);collapse.textContent=collapsed?'Show navigation':'Hide navigation';collapse.setAttribute('aria-expanded',String(!collapsed));};
 collapse.onclick=()=>{collapsed=!collapsed;fold();try{localStorage.setItem('fabled.navigation.collapsed',String(collapsed));}catch{}};tools.prepend(collapse);fold();

 const paired=()=>isLocal()&&connected.has(1);
 const allowed=(slot,node)=>canControlSetup(slot,node.closest('[data-setup-player]')?.dataset.setupPlayer,paired());
 const menuStates=[0,1].map(slot=>({pointer:createControllerCursor({settings:experience,slot,canTarget:node=>allowed(slot,node),onFocus:node=>{menuStates[slot].focus=node;}}),focus:null,last:0,axis:0}));
 const hidePointers=()=>menuStates.forEach(s=>s.pointer.hide());
 let method='touch',awaitNeutral=false;
 const status=document.createElement('span');status.id='controller-status';status.setAttribute('role','status');status.hidden=true;document.querySelector('.tools').append(status);
 const hint=document.createElement('div');hint.id='controller-hint';hint.setAttribute('aria-label','Controller shortcuts');arena.append(hint);
 function apply(){
  if(method!=='controller')hidePointers();
  root.dataset.inputMethod=method;root.dataset.setupControllers=paired()?'paired':'single';
  const immersive=method==='controller'&&connected.size>0&&!experience().showTouchWithController;
  arena.classList.toggle('controller-view',immersive);
  const type=activePad&&/dualsense|dualshock|playstation|054c|sony/i.test(activePad.id)?'PlayStation':'Gamepad';
  status.hidden=connected.size===0;
  status.textContent=connected.size?`${type} connected${connected.size>1?' · 2 pads':''}`:'';
  hint.textContent=method==='controller'?`Move: left stick · Jump ${controllerBinding('jump')} · Attack ${controllerBinding('attack')} · Guard ${controllerBinding('block')} · Abilities: hold ${controllerBinding('abilities')} · Pause ${controllerBinding('pause')}`:'';
 }
 const gamepads=createGamepads({inputs,settings:experience,bindings:padBindings,abilityBindings:padAbilityBindings,isPlaying,isLocal,onPause,
  isFocused:()=>!document.hidden&&document.hasFocus(),
  onConnection(slot,pad){if(!pad)menuStates[slot].pointer.hide();if(pad)connected.set(slot,pad);else connected.delete(slot);if(!pad&&activePad?.index===gamepads.slots[slot]){activePad=null;method='touch';}apply();},
  onActivity(slot,pad){const changed=activePad?.id!==pad.id;activePad=pad;if(method!=='controller'||changed){method='controller';apply();}},
  onMenu({slot,intent,fresh}){
   const menu=menuStates[slot],pointer=menu.pointer;
   if(slot===1&&!paired()){pointer.hide();return;}
   if(method!=='controller'){pointer.hide();return;}
   const direction=menuDirection(intent.buttons);
   const modal=document.querySelector('dialog[open]'),overlay=document.querySelector('#overlay:not([hidden])'),scope=modal??document;
   if(modal&&!allowed(slot,modal)){pointer.hide();return;}
   const nodes=Array.from(scope.querySelectorAll('button:not(:disabled),a[href],summary,select:not(:disabled),input:not(:disabled),[tabindex="0"]')).filter(n=>allowed(slot,n)&&n.getClientRects().length&&!n.closest('[hidden],[inert]')&&(!overlay||modal||!n.closest('.arena')||overlay.contains(n)));
   if(!nodes.length)return;
   if(direction)pointer.hide();else pointer.tick(intent,scope);
   const current=nodes.includes(menu.focus)?menu.focus:slot===0&&nodes.includes(document.activeElement)?document.activeElement:null,now=performance.now();
   if(direction&&(direction!==menu.axis||now-menu.last>220)){
    // A focused native select changes value without requiring a pointer.
    const horizontal=intent.buttons[14]||intent.buttons[15];
    if(current?.matches('input[type=range]')&&horizontal){
     if(direction>0)current.stepUp();else current.stepDown();current.dispatchEvent(new Event('input',{bubbles:true}));current.dispatchEvent(new Event('change',{bubbles:true}));
    }else if(current?.tagName==='SELECT'){
     const options=Array.from(current.options).filter(o=>!o.disabled),index=options.indexOf(current.selectedOptions[0]);
     current.value=options[(index+direction+options.length)%options.length].value;current.dispatchEvent(new Event('input',{bubbles:true}));current.dispatchEvent(new Event('change',{bubbles:true}));
    }else{const index=nodes.indexOf(current);const next=nodes[(index+direction+nodes.length)%nodes.length];menu.focus=next;next.focus();next.scrollIntoView({block:'nearest',inline:'nearest'});}
    menu.last=now;
   }
   menu.axis=direction;
   if((fresh[0]||fresh[9])&&!pointer.activate()){
    const target=nodes.includes(current)?current:nodes[0];menu.focus=target;target.focus();
    if(target.tagName==='SELECT'){target.blur();menu.focus=nodes[(nodes.indexOf(target)+1)%nodes.length];menu.focus?.focus();}
    else target.click();
   }
   if(fresh[1]&&!pointer.back()){
    const dialog=document.querySelector('dialog[open]');
    if(dialog){const event=new Event('cancel',{cancelable:true});if(dialog.dispatchEvent(event))dialog.close();}
    else if(arena.classList.contains('editing-controls'))document.querySelector('#cancel-controls').click();
    else {const details=slot===1?document.querySelector('[data-setup-player="1"] details[open]'):document.querySelector('details[open]');if(details){details.open=false;details.querySelector('summary')?.focus();}}
   }
  }
 });
 function useTouch(event){if(event.pointerType!=='touch')return;method='touch';apply();}
 document.addEventListener('pointerdown',event=>{hidePointers();useTouch(event);},true);document.addEventListener('pointermove',event=>{if(event.isTrusted&&event.pointerType==='mouse'&&method==='controller'){method='mouse';apply();}},true);
 window.addEventListener('keydown',event=>{if(event.isTrusted&&method==='controller'){method='keyboard';apply();}},true);
 window.addEventListener('arena:experience',apply);window.addEventListener('arena:pad-map',apply);
 window.addEventListener('blur',()=>{gamepads.reset();awaitNeutral=true;method='touch';apply();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){gamepads.reset();awaitNeutral=true;method='touch';apply();}});
 apply();
 return {poll(){
  if(isPlaying()||document.hidden||!document.hasFocus())hidePointers();
  // Require release after returning from background, so a held attack cannot resume.
  if(awaitNeutral){let pads=[];try{pads=Array.from(navigator.getGamepads?.()??[]);}catch{}if(pads.some(p=>p?.connected&&(p.buttons.some(b=>b.pressed)||p.axes.some(a=>Math.abs(a)>.4))))return;awaitNeutral=false;}
  gamepads.poll();
 }};
}
