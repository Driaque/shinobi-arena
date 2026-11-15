import {cursorStep,menuScrollDelta} from './packages/input/cursor.js';
const SELECTABLE='button,a[href],summary,select,input,textarea,label,[tabindex="0"]';
export function createControllerCursor({settings,slot=0,canTarget=()=>true,onFocus=()=>{},getFocus=()=>document.activeElement}){
 const cursor=document.createElement('div');cursor.id=slot===0?'controller-cursor':'controller-cursor-p2';cursor.dataset.controllerPlayer=String(slot+1);cursor.hidden=true;cursor.setAttribute('aria-hidden','true');document.body.append(cursor);cursor.style.setProperty('--cursor-color',slot===0?'#47cddd66':'#de91ff99');
 let position={x:innerWidth/2,y:innerHeight/2},last=performance.now(),target=null,popup=null,owner=null;
 const highlight=node=>{target?.classList.remove('controller-hover');target=node;target?.classList.add('controller-hover');};
 const closeOptions=()=>{popup?.remove();popup=null;};
 function hide(){cursor.hidden=true;highlight(null);closeOptions();last=performance.now();}
 function scrollLists(intent,scope,dt){
  const delta=menuScrollDelta(intent,dt);if(!delta.x&&!delta.y)return;
  const contains=node=>node&&node.isConnected&&canTarget(node)&&(scope===document||scope.contains(node))&&!node.closest('[hidden],[inert]');
  let start=cursor.hidden?null:document.elementFromPoint(position.x,position.y);
  if(!contains(start))start=document.activeElement;if(!contains(start))start=getFocus();if(!contains(start))return;
  // Each axis finds its nearest scrollable ancestor; no background scroll through a modal.
  for(const [axis,amount] of [['x',delta.x],['y',delta.y]]){
   if(!amount)continue;
   for(let panel=start;panel;panel=panel.parentElement){
    if(!contains(panel)&&panel!==scope)break;
    const style=getComputedStyle(panel),key=axis==='x'?'scrollLeft':'scrollTop',extent=axis==='x'?panel.scrollWidth-panel.clientWidth:panel.scrollHeight-panel.clientHeight;
    if((/auto|scroll/.test(axis==='x'?style.overflowX:style.overflowY)||panel===document.scrollingElement)&&extent>1){const before=panel[key];panel[key]+=amount;if(panel[key]!==before)break;}
    if(panel===scope||panel===document.documentElement)break;
   }
  }
 }
 function tick(intent,scope){
  const now=performance.now(),dt=(now-last)/1000;last=now;
  const moving=Math.hypot(intent.moveX,intent.moveZ)>.1;
  if(cursor.hidden&&!moving){scrollLists(intent,scope,dt);return false;}
  if(owner!==scope){closeOptions();owner=scope;}
  const modal=scope instanceof HTMLDialogElement;
  if(cursor.parentElement!==(modal?scope:document.body))(modal?scope:document.body).append(cursor);
  const view=window.visualViewport,left=view?.offsetLeft??0,top=view?.offsetTop??0,width=view?.width??innerWidth,height=view?.height??innerHeight;
  position=cursorStep(position,{x:intent.moveX,y:intent.moveZ},dt,settings().cursorSpeed,{left:left+6,top:top+6,right:left+width-6,bottom:top+height-6});
  cursor.hidden=false;cursor.style.left=position.x+'px';cursor.style.top=position.y+'px';
  const hit=document.elementFromPoint(position.x,position.y),node=hit?.closest(SELECTABLE);
  const overlay=document.querySelector('#overlay:not([hidden])');
  const allowed=node&&canTarget(node)&&(scope===document||scope.contains(node))&&!node.closest('[hidden],[inert],:disabled')&&(!overlay||modal||!node.closest('.arena')||overlay.contains(node));
  highlight(allowed?node:null);cursor.classList.toggle('over-control',Boolean(target));
  scrollLists(intent,scope,dt);
  return true;
 }
 function activate(){
  if(cursor.hidden)return false;
  if(!target||!target.isConnected||!canTarget(target))return true; // Never activate stale keyboard focus when pointing at empty space.
  const node=target;onFocus(node);
  if(node.tagName==='SELECT'){
   closeOptions();popup=document.createElement('div');popup.className='controller-options';popup.dataset.setupPlayer=String(slot);popup.setAttribute('role','listbox');popup.setAttribute('aria-label',node.getAttribute('aria-label')??'Choose an option');
   const rect=node.getBoundingClientRect();Object.assign(popup.style,{left:Math.max(8,Math.min(rect.left,innerWidth-240))+'px',top:Math.max(8,Math.min(rect.bottom+4,innerHeight-180))+'px'});
   for(const option of node.options){const button=document.createElement('button');button.textContent=option.text;button.disabled=option.disabled;button.setAttribute('role','option');button.setAttribute('aria-selected',String(option.selected));button.onclick=()=>{node.value=option.value;node.dispatchEvent(new Event('input',{bubbles:true}));node.dispatchEvent(new Event('change',{bubbles:true}));closeOptions();node.focus();onFocus(node);highlight(null);};popup.append(button);}
   (owner instanceof HTMLDialogElement?owner:document.body).append(popup);
  }else if(node.matches('input[type=range]')){
   const rect=node.getBoundingClientRect(),min=Number(node.min||0),max=Number(node.max||100),step=Number(node.step)||1;
   node.value=String(min+Math.round(Math.max(0,Math.min(1,(position.x-rect.left)/rect.width))*(max-min)/step)*step);node.dispatchEvent(new Event('input',{bubbles:true}));node.dispatchEvent(new Event('change',{bubbles:true}));node.focus();
  }else{node.focus();node.click();}
  return true;
 }
 return {tick,activate,hide,back(){if(!popup)return false;closeOptions();highlight(null);return true;}};
}
