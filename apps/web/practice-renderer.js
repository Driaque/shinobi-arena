import {createRenderer} from './renderer.js';
export const GRAPHICS_KEY='fabled.practice.graphics.v2';
export const BATTLE_GRAPHICS_KEY='fabled.battle.graphics.v1';
const valid=v=>['classic','canvas','pixi'].includes(v)?v:'classic';
const read=(key,fallback)=>{try{return localStorage.getItem(key)??fallback;}catch{return fallback;}};
let graphics=read(BATTLE_GRAPHICS_KEY,'pixi')==='canvas'?'canvas':'pixi';
let modulePromise=null,retryAttempt=0;
function loadModule(){
 if(!modulePromise){const url=new URL('./practice-pixi.js',import.meta.url);url.search=new URL(import.meta.url).search;if(retryAttempt)url.searchParams.set('retry',String(retryAttempt));modulePromise=import(url.href).catch(e=>{modulePromise=null;throw e;});}
 return modulePromise;
}
export function createPracticeRenderer(canvas,{getMode=()=>'',catalog={},viewer=false,onSettings=()=>{}}={}){
 const base=createRenderer(canvas,catalog),select=viewer?null:document.querySelector('#practice-renderer'),message=viewer?null:document.querySelector('#practice-graphics-status'),retry=viewer?null:document.querySelector('#practice-graphics-retry');
 let requested=valid(read(GRAPHICS_KEY,'classic')),backends=null,loading=false,generation=0,active=false,preview=false,failed=false,gpuLost=false,disposed=false,lastState=null,lastOptions={},label='Loading battlefield…';
 if(select)select.value=requested;
 function report(text){label=text;if(message&&message.textContent!==text)message.textContent=text;if(retry)retry.hidden=!failed&&!gpuLost;}
 function release(){generation++;loading=false;backends?.destroy();backends=null;active=false;gpuLost=false;}
 function refresh(){if(lastState&&!disposed)render(lastState,lastOptions);}
 async function load(){const epoch=++generation;loading=true;report('Loading battlefield graphics…');try{
  const module=await loadModule();if(epoch!==generation||disposed)return;
  const next=await module.createPracticeBackends(canvas.parentElement,()=>{if(epoch!==generation||disposed)return;gpuLost=true;report('Graphics context lost. Using the Canvas battlefield.');refresh();});
  if(epoch!==generation||disposed){next.destroy();return;}backends=next;gpuLost=!next.hasPixi();
 }catch{if(epoch===generation&&!disposed){failed=true;report('Battlefield graphics could not load. Original Canvas is available. Retry graphics to reconnect.');}}
 finally{if(epoch===generation){loading=false;refresh();}}}
 function configure(force=false){if(force){if(!modulePromise)retryAttempt++;release();}requested=valid(select?.value);failed=false;try{localStorage.setItem(GRAPHICS_KEY,requested);}catch{}refresh();}
 const change=()=>configure();if(select)select.addEventListener('change',change);if(retry)retry.onclick=()=>configure(true);
 const globalChange=event=>{if(event.detail?.retry)release();failed=false;refresh();};window.addEventListener('arena:graphics',globalChange);
 const render=(state,options={})=>{
  if(disposed)return;lastState=state;lastOptions=options;
  preview=!viewer&&getMode()==='training'&&Boolean(state.training)&&requested!=='classic';
  const want=preview?requested:graphics;
  if(!backends&&!loading&&!failed)load();
  active=Boolean(backends);
  if(!active){base(state,options);canvas.dataset.presentation='classic';}
  else try{
   base(state,{...options,layers:{background:false,actors:!preview,nativeAren:true,nativeEffects:true}});
   const actual=backends.draw(base.frame.state,base.frame.viewport,want,{preview,catalog});
   canvas.dataset.presentation=(preview?'aren-':'selected-')+actual;
   report(gpuLost&&want==='pixi'?'WebGL unavailable. Canvas battlefield is active.':(actual==='pixi'?'PixiJS':'Canvas')+' · '+(preview?'Aren + sparring echo':'selected fighters + Skyglass Terrace'));
  }catch{release();failed=true;base(state,options);canvas.dataset.presentation='classic';report('Battlefield rendering stopped. Original Canvas restored. Retry graphics to recover.');}
  canvas.dataset.renderTick=state.tick;
 };
 window.addEventListener('pagehide',release);
 render.preview=()=>preview&&active;
 render.status=()=>({requested,label,loading,fallback:failed||gpuLost,presentation:canvas.dataset.presentation??'classic'});
 render.dispose=()=>{disposed=true;lastState=null;window.removeEventListener('pagehide',release);window.removeEventListener('arena:graphics',globalChange);select?.removeEventListener('change',change);release();base.dispose();};
 if(!viewer&&!document.querySelector('#graphics-settings')){
  const button=document.createElement('button');button.id='graphics-settings';button.textContent='Graphics';button.type='button';document.querySelector('.tools').append(button);
  const dialog=document.createElement('dialog');dialog.id='graphics-dialog';dialog.className='keys-dialog';dialog.innerHTML='<h2>Battlefield graphics</h2><label>Renderer<select id="battle-renderer"><option value="pixi">PixiJS · all modes</option><option value="canvas">Canvas · compatibility</option></select></label><p>Skyglass Terrace and combat effects apply to every mode, live spectating and replay viewing. Selected fighters keep their own appearance. WebGL failure falls back to Canvas.</p><p id="battle-graphics-status" role="status"></p><button id="battle-graphics-retry">Retry graphics</button><button id="graphics-close">Done</button>';document.body.append(dialog);
  const field=dialog.querySelector('select');field.value=graphics;field.onchange=()=>{graphics=field.value==='canvas'?'canvas':'pixi';try{localStorage.setItem(BATTLE_GRAPHICS_KEY,graphics);}catch{}window.dispatchEvent(new Event('arena:graphics'));dialog.querySelector('#battle-graphics-status').textContent=label;};
  button.onclick=()=>{onSettings();dialog.querySelector('#battle-graphics-status').textContent=label;dialog.showModal();};dialog.querySelector('#graphics-close').onclick=()=>dialog.close();dialog.querySelector('#battle-graphics-retry').onclick=()=>{if(!modulePromise)retryAttempt++;window.dispatchEvent(new CustomEvent('arena:graphics',{detail:{retry:true}}));};
 }
 report('Battlefield graphics apply to every mode. The Practice appearance selector only changes the preview.');
 return render;
}
