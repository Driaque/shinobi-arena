import {createGamepads,PAD_ABILITIES} from './packages/input/gamepad.js';
import {experience,padBindings} from './experience.js';

const XBOX=['A','B','X','Y','LB','RB','LT','RT','View','Menu','LS','RS','↑','↓','←','→'];
const PLAYSTATION=['✕','○','□','△','L1','R1','L2','R2','Create','Options','L3','R3','↑','↓','←','→'];
let activePad=null;
export function controllerBinding(action){
 if(document.documentElement.dataset.inputMethod!=='controller'||!activePad)return null;
 const labels=/dualsense|dualshock|playstation|054c|sony/i.test(activePad.id)?PLAYSTATION:XBOX,map=padBindings();
 const index=map.indexOf(action);if(index>=0)return labels[index];
 const modifier=map.indexOf('abilities'),button=Object.keys(PAD_ABILITIES).find(b=>PAD_ABILITIES[b]===action);
 return modifier>=0&&button!==undefined?`${labels[modifier]}+${labels[button]}`:'Unbound';
}
export function createControllerUI({inputs,isPlaying,isLocal,onPause}){
 const root=document.documentElement,arena=document.querySelector('.arena'),connected=new Map();
 let method='touch',lastMenu=0,navAxis=0,awaitNeutral=false;
 const status=document.createElement('span');status.id='controller-status';status.setAttribute('role','status');status.hidden=true;document.querySelector('.tools').append(status);
 const hint=document.createElement('div');hint.id='controller-hint';hint.setAttribute('aria-label','Controller shortcuts');arena.append(hint);
 function apply(){
  root.dataset.inputMethod=method;
  const immersive=method==='controller'&&connected.size>0&&!experience().showTouchWithController;
  arena.classList.toggle('controller-view',immersive);
  const type=activePad&&/dualsense|dualshock|playstation|054c|sony/i.test(activePad.id)?'PlayStation':'Gamepad';
  status.hidden=connected.size===0;
  status.textContent=connected.size?`${type} connected${connected.size>1?' · 2 pads':''}`:'';
  hint.textContent=method==='controller'?`Move: left stick · Jump ${controllerBinding('jump')} · Attack ${controllerBinding('attack')} · Guard ${controllerBinding('block')} · Abilities: hold ${controllerBinding('abilities')} · Pause ${controllerBinding('pause')}`:'';
 }
 const gamepads=createGamepads({inputs,settings:experience,bindings:padBindings,isPlaying,isLocal,onPause,
  isFocused:()=>!document.hidden&&document.hasFocus(),
  onConnection(slot,pad){if(pad)connected.set(slot,pad);else connected.delete(slot);if(!pad&&activePad?.index===gamepads.slots[slot]){activePad=null;method='touch';}apply();},
  onActivity(slot,pad){const changed=activePad?.id!==pad.id;activePad=pad;if(method!=='controller'||changed){method='controller';apply();}},
  onMenu({slot,intent,fresh}){
   if(slot!==0)return;
   const x=intent.moveX,y=intent.moveZ;
   const direction=fresh[12]?-1:fresh[13]?1:fresh[14]?-1:fresh[15]?1:Math.abs(y)>.55?Math.sign(y):Math.abs(x)>.55?Math.sign(x):0;
   const scope=document.querySelector('dialog[open]')??document.querySelector('#overlay:not([hidden])')??document;
   const nodes=Array.from(scope.querySelectorAll('button:not(:disabled),a[href],summary,select:not(:disabled),input:not(:disabled),[tabindex="0"]')).filter(n=>n.getClientRects().length&&!n.closest('[hidden],[inert]'));
   if(!nodes.length)return;
   const current=document.activeElement,now=performance.now();
   if(direction&&(direction!==navAxis||now-lastMenu>220)){
    // A focused native select changes value without requiring a pointer.
    if(current?.tagName==='SELECT'){
     const options=Array.from(current.options).filter(o=>!o.disabled),index=options.indexOf(current.selectedOptions[0]);
     current.value=options[(index+direction+options.length)%options.length].value;current.dispatchEvent(new Event('input',{bubbles:true}));current.dispatchEvent(new Event('change',{bubbles:true}));
    }else{const index=nodes.indexOf(current);const next=nodes[(index+direction+nodes.length)%nodes.length];next.focus();next.scrollIntoView({block:'nearest',inline:'nearest'});}
    lastMenu=now;
   }
   navAxis=direction;
   if(fresh[0]||fresh[9]){
    const target=nodes.includes(current)?current:nodes[0];target.focus();
    if(target.tagName==='SELECT'){target.blur();nodes[(nodes.indexOf(target)+1)%nodes.length]?.focus();}
    else target.click();
   }
   if(fresh[1]){
    const dialog=document.querySelector('dialog[open]');
    if(dialog){const event=new Event('cancel',{cancelable:true});if(dialog.dispatchEvent(event))dialog.close();}
    else {const details=document.querySelector('details[open]');if(details){details.open=false;details.querySelector('summary')?.focus();}}
   }
  }
 });
 function useTouch(event){if(event.pointerType!=='touch')return;method='touch';apply();}
 document.addEventListener('pointerdown',useTouch,true);
 window.addEventListener('keydown',event=>{if(event.isTrusted&&method==='controller'){method='keyboard';apply();}},true);
 window.addEventListener('arena:experience',apply);window.addEventListener('arena:pad-map',apply);
 window.addEventListener('blur',()=>{gamepads.reset();awaitNeutral=true;method='touch';apply();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){gamepads.reset();awaitNeutral=true;method='touch';apply();}});
 apply();
 return {poll(){
  // Require release after returning from background, so a held attack cannot resume.
  if(awaitNeutral){let pads=[];try{pads=Array.from(navigator.getGamepads?.()??[]);}catch{}if(pads.some(p=>p?.connected&&(p.buttons.some(b=>b.pressed)||p.axes.some(a=>Math.abs(a)>.4))))return;awaitNeutral=false;}
  gamepads.poll();
 }};
}
