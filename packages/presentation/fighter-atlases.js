import { ORIGINAL_FIGHTERS } from '../engine/originals.js';
import { FIGHTER_ATLAS_DATA } from './fighter-atlas-data.js';

// Every normalized pose has a shared foot/root anchor. Its artwork can change
// bounds without moving the simulation or changing collision/range geometry.
export const FIGHTER_FRAMES = Object.freeze(Array.from({length:16},(_,i)=>Object.freeze({
  x:(i%4)*384, y:Math.floor(i/4)*384, w:384, h:384, rootX:192, rootY:340,
})));
export const hasFighterAtlas = id => Object.hasOwn(ORIGINAL_FIGHTERS,id);
export const fighterAtlasData = id => FIGHTER_ATLAS_DATA[id];

// Rendering never awaits art. Individual failures preserve the existing fighter,
// are attempted once, and can be retried by recreating this store. Destroying a
// viewer invalidates its late image completions before they can retain assets.
export function createFighterAtlasStore(loadImage,onChange=()=>{}) {
  const entries=new Map();let disposed=false;
  return {
    request(ids){
      if(disposed)return;
      for(const id of new Set(ids)){
        if(!hasFighterAtlas(id)||entries.has(id))continue;
        const entry={status:'loading',image:null};entries.set(id,entry);
        Promise.resolve().then(()=>loadImage(id)).then(image=>{
          if(image.width!==1536||image.height!==1536)throw Error('Invalid fighter atlas dimensions');
          if(disposed)return;entry.status='ready';entry.image=image;onChange();
        }).catch(()=>{if(disposed)return;entry.status='failed';onChange();});
      }
    },
    get:id=>entries.get(id)?.status==='ready'?entries.get(id).image:null,
    readyIds:()=>[...entries].filter(([,v])=>v.status==='ready').map(([id])=>id),
    failedIds:()=>[...entries].filter(([,v])=>v.status==='failed').map(([id])=>id),
    destroy(){disposed=true;entries.clear();},
  };
}
