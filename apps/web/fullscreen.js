export function createFullscreen({element,target=element,button,onTransition,notice,documentRef=document,windowRef=window}){
 const doc=documentRef,win=windowRef;
 let busy=false,locked=false;
 const native=()=>doc.fullscreenElement??doc.webkitFullscreenElement??null;
 function apply(mode){
  if(element.dataset.screenMode===mode)return;
  element.dataset.screenMode=mode;element.classList.toggle('play-view',mode!=='window');
  doc.documentElement.classList.toggle('play-view-open',mode!=='window');
  button.textContent=mode==='window'?'Full screen':'Exit view';button.setAttribute('aria-pressed',String(mode!=='window'));
  onTransition();resize();
 }
 function resize(){element.style.setProperty('--play-height',`${win.visualViewport?.height??win.innerHeight}px`);}
 function change(){if(native())apply('native');else if(element.dataset.screenMode==='native'){apply('window');unlock();}}
 function unlock(){if(locked){try{win.screen.orientation?.unlock?.();}catch{}locked=false;}}
 async function toggle(){
  if(busy)return;busy=true;button.disabled=true;
  try{
   if(native()){
    const exit=doc.exitFullscreen??doc.webkitExitFullscreen;
    if(exit)await exit.call(doc);if(!native()){apply('window');unlock();}return;
   }
   if(element.dataset.screenMode==='expanded'){apply('window');unlock();return;}
   // Call directly in the button's activation handler, before any awaited work.
   const standard=typeof target.requestFullscreen==='function'&&doc.fullscreenEnabled!==false;
   const legacy=typeof target.webkitRequestFullscreen==='function'&&doc.webkitFullscreenEnabled!==false;
   try{
    if(standard)await target.requestFullscreen({navigationUI:'hide'});
    else if(legacy)await target.webkitRequestFullscreen();
   }catch{/* The visible play-view fallback remains usable if fullscreen is denied. */}
   if(native()){
    apply('native');
    // Respect the player's chosen orientation, including portrait fullscreen.
   }else{apply('expanded');notice('Play view is active. Native fullscreen is unavailable here; the address bar may remain.');}
  }catch{notice('Unable to exit fullscreen. Use your browser’s fullscreen exit and try again.');}finally{busy=false;button.disabled=false;}
 }
 button.addEventListener('click',toggle);doc.addEventListener('fullscreenchange',change);doc.addEventListener('webkitfullscreenchange',change);
 doc.addEventListener('keydown',event=>{if(event.code==='Escape'&&element.dataset.screenMode==='expanded'){apply('window');unlock();}});
 win.addEventListener('resize',resize);win.visualViewport?.addEventListener('resize',resize);
 apply('window');resize();return {toggle};
}
