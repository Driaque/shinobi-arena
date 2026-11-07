// Versioned PNG exports; larger scenery is requested only for the active stage.
const root = new URL('../../assets/painted-v1/', import.meta.url);
const path = file => new URL(file, root).href;
export function portraitSources(id) {
  return {src:path(`portraits/${id}-192.png`),srcset:[192,384,768].map(w=>`${path(`portraits/${id}-${w}.png`)} ${w}w`).join(', ')};
}
export function stageSources(id) {
  return {src:path(`stages/${id}-640.png`),srcset:[320,640,1280].map(w=>`${path(`stages/${id}-${w}.png`)} ${w}w`).join(', ')};
}
const scenes = new Map();
export function stageArtwork(id = 'skyglass') {
  if(typeof Image === 'undefined')return null;
  if(!scenes.has(id)) {
    // Cap decoded texture memory on phones; no eager load of every battlefield.
    const width=typeof matchMedia==='function'&&matchMedia('(max-width: 900px)').matches?1280:1600;
    const image=new Image();const entry={image,ready:false};scenes.set(id,entry);
    image.decoding='async';image.onload=()=>{entry.ready=true;};image.onerror=()=>{entry.ready=false;};
    image.src=path(`stages/${id}-${width}.png`);
  }
  const entry=scenes.get(id);return entry.ready?entry.image:null;
}
// Keep the painted ground in the same world plane as the combat simulation.
export const paintedStageRect = Object.freeze({x:-160,y:-84,w:1920,h:1080});

// Expand scenery around the combat ground line to cover short/wide cameras.
export function paintedStageForView(view,width,height) {
  const base=paintedStageRect,ground=610,center=base.x+base.w/2;
  const left=-view.x/view.scale,right=(width-view.x)/view.scale;
  const top=-view.y/view.scale,bottom=(height-view.y)/view.scale;
  const factor=Math.max(1,2*Math.max(center-left,right-center)/base.w,
    (ground-top)/(ground-base.y),(bottom-ground)/(base.y+base.h-ground));
  return {x:center-base.w*factor/2,y:ground-(ground-base.y)*factor,w:base.w*factor,h:base.h*factor};
}
