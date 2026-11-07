import {cursorStep} from './packages/input/cursor.js';
const SELECTABLE='button,a[href],summary,select,input,textarea,label,[tabindex="0"]';
export function createControllerCursor({settings}){
 const cursor=document.createElement('div');cursor.id='controller-cursor';cursor.hidden=true;cursor.setAttribute('aria-hidden','true');document.body.append(cursor);
 let position={x:innerWidth/2,y:innerHeight/2},last=performance.now(),target=null,popup=null,owner=null;
 const highlight=node=>{target?.classList.remove('controller-hover');target=node;target?.classList.add('controller-hover');};
 const closeOptions=()=>{popup?.remove();popup=null;};
 function hide(){cursor.hidden=true;highlight(null);closeOptions();last=performance.now();}
 function tick(intent,scope){
  const now=performance.now(),dt=(now-last)/1000;last=now;
  const moving=Math.hypot(intent.moveX,intent.moveZ)>.1;
  if(cursor.hidden&&!moving)return false;
  if(owner!==scope){closeOptions();owner=scope;}
  const modal=scope instanceof HTMLDialogElement;
  if(cursor.parentElement!==(modal?scope:document.body))(modal?scope:document.body).append(cursor);
  const view=window.visualViewport,left=view?.offsetLeft??0,top=view?.offsetTop??0,width=view?.width??innerWidth,height=view?.height??innerHeight;
  position=cursorStep(position,{x:intent.moveX,y:intent.moveZ},dt,settings().cursorSpeed,{left:left+6,top:top+6,right:left+width-6,bottom:top+height-6});
  cursor.hidden=false;cursor.style.left=position.x+'px';cursor.style.top=position.y+'px';
  const hit=document.elementFromPoint(position.x,position.y),node=hit?.closest(SELECTABLE);
  const overlay=document.querySelector('#overlay:not([hidden])');
  const allowed=node&&(scope===document||scope.contains(node))&&!node.closest('[hidden],[inert],:disabled')&&(!overlay||modal||!node.closest('.arena')||overlay.contains(node));
  highlight(allowed?node:null);cursor.classList.toggle('over-control',Boolean(target));
  // Scroll the nearest panel beneath the cursor, only while pushing toward its edge.
  if(moving){let panel=hit;while(panel&&panel!==document.body){const style=getComputedStyle(panel);if(/auto|scroll/.test(style.overflowY)&&panel.scrollHeight>panel.clientHeight+1)break;panel=panel.parentElement;}
   const scroll=panel&&panel!==document.body?panel:document.scrollingElement,rect=panel&&panel!==document.body?panel.getBoundingClientRect():{top,bottom:top+height};
   if(scroll){const direction=position.y<rect.top+35&&intent.moveZ<0?-1:position.y>rect.bottom-35&&intent.moveZ>0?1:0;scroll.scrollTop+=direction*450*Math.min(.05,dt);}
  }
  return true;
 }
 function activate(){
  if(cursor.hidden)return false;
  if(!target)return true; // Never activate stale keyboard focus when pointing at empty space.
  const node=target;
  if(node.tagName==='SELECT'){
   closeOptions();popup=document.createElement('div');popup.className='controller-options';popup.setAttribute('role','listbox');popup.setAttribute('aria-label',node.getAttribute('aria-label')??'Choose an option');
   const rect=node.getBoundingClientRect();Object.assign(popup.style,{left:Math.max(8,Math.min(rect.left,innerWidth-240))+'px',top:Math.max(8,Math.min(rect.bottom+4,innerHeight-180))+'px'});
   for(const option of node.options){const button=document.createElement('button');button.textContent=option.text;button.disabled=option.disabled;button.setAttribute('role','option');button.setAttribute('aria-selected',String(option.selected));button.onclick=()=>{node.value=option.value;node.dispatchEvent(new Event('input',{bubbles:true}));node.dispatchEvent(new Event('change',{bubbles:true}));closeOptions();node.focus();highlight(null);};popup.append(button);}
   (owner instanceof HTMLDialogElement?owner:document.body).append(popup);
  }else if(node.matches('input[type=range]')){
   const rect=node.getBoundingClientRect(),min=Number(node.min||0),max=Number(node.max||100),step=Number(node.step)||1;
   node.value=String(min+Math.round(Math.max(0,Math.min(1,(position.x-rect.left)/rect.width))*(max-min)/step)*step);node.dispatchEvent(new Event('input',{bubbles:true}));node.dispatchEvent(new Event('change',{bubbles:true}));node.focus();
  }else{node.focus();node.click();}
  return true;
 }
 return {tick,activate,hide,back(){if(!popup)return false;closeOptions();highlight(null);return true;}};
}
