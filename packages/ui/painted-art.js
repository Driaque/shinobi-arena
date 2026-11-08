import {JUTSUS,WEAPONS,ITEMS,CHARACTERS} from '../engine/index.js';
const root=new URL('../../assets/painted-v2/',import.meta.url);
const catalogs={technique:JUTSUS,weapon:WEAPONS,item:ITEMS,fighter:CHARACTERS};
export function artworkSources(kind,id){
 if(!Object.hasOwn(catalogs[kind]??{},id))return null;
 const sizes=kind==='fighter'?[192,384,768]:[64,128,256];
 const directory={technique:'moves',weapon:'weapons',item:'items',fighter:'fighters'}[kind];
 const path=size=>new URL(`${directory}/${id}-${size}.png`,root).href;
 return {src:path(sizes[0]),srcset:sizes.map(size=>`${path(size)} ${size}w`).join(', '),sizes};
}
export function artworkMarkup(kind,id,{size=32,fallback=''}={}){
 const art=artworkSources(kind,id);if(!art)return fallback;
 return `<span class="painted-artwork" data-painted-kind="${kind}" data-painted-id="${id}" aria-hidden="true"><span class="painted-fallback">${fallback}</span><img class="painted-image" data-painted-art="${id}" src="${art.src}" srcset="${art.srcset}" sizes="${size}px" width="256" height="256" alt="" loading="lazy" decoding="async"></span>`;
}
export function mountEquipmentIcon(node,kind,id){if(!node)return;let holder=node.querySelector(':scope > .equipment-control-art');if(!holder){holder=document.createElement('span');holder.className='equipment-control-art';node.prepend(holder);}if(holder.dataset.artId===id)return;holder.dataset.artId=id;holder.innerHTML=artworkMarkup(kind,id,{size:32,fallback:kind==='weapon'?'WPN':'ITEM'});}
if(typeof document!=='undefined')document.addEventListener('error',event=>{const image=event.target;if(image?.matches?.('img.painted-image')){image.hidden=true;image.parentElement.dataset.artFailed='true';}},true);
