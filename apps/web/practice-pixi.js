import {isOriginalFighter} from './packages/engine/originals.js';
import {
  loadLabArt,
  createCanvasLab,
  createPixiLab,
} from "./visual-lab-renderers.js";
import { practiceSceneFor } from "./packages/presentation/practice-scene.js";
import { createFighterAtlasStore } from './packages/presentation/fighter-atlases.js';
import {WEAPON_ART,weaponArtUrl,cutoutBackground} from './packages/presentation/weapons.js';

export async function createPracticeBackends(parent, onLost, onArtChange=()=>{}) {
  const art = await loadLabArt(),
    resolution = Math.min(devicePixelRatio || 1, 1.5),
    canvases = {},
    renderers = {};
  let disposed = false,
    pixiAvailable = false;
  const sizes = {};
  let selectedFighters=[], visible=null;
  let bounds=parent.getBoundingClientRect();
  const reducedMotion=matchMedia("(prefers-reduced-motion: reduce)");
  const observer=new ResizeObserver(()=>{bounds=parent.getBoundingClientRect();});
  observer.observe(parent);
  const sheets=createFighterAtlasStore(async id=>{
    const url=new URL('./assets/originals/'+id+'.webp',import.meta.url);
    url.search=new URL(import.meta.url).search;
    const image=new Image();image.src=url.href;await image.decode();return image;
  },onArtChange);
  const runs=createFighterAtlasStore(async id=>{
    const url=new URL('./assets/originals/runs/'+id+'.webp',import.meta.url);
    url.search=new URL(import.meta.url).search;
    const image=new Image();image.src=url.href;await image.decode();return image;
  },onArtChange);
  art.sheets=sheets;art.runSheets=runs;
  // Painted weapon icons, cut out once and reused as in-fight sprites.
  const weapons=new Map();
  function requestWeapons(ids){
    for(const id of new Set(ids)){
      if(!WEAPON_ART[id]||weapons.has(id))continue;
      weapons.set(id,null);
      const url=new URL(weaponArtUrl(id),import.meta.url);
      url.search=new URL(import.meta.url).search;
      const image=new Image();image.src=url.href;
      image.decode().then(()=>{
        if(disposed)return;
        const c=document.createElement('canvas');c.width=c.height=256;
        const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(image,0,0,256,256);
        const pixels=x.getImageData(0,0,256,256);cutoutBackground(pixels.data,256,256);x.putImageData(pixels,0,0);
        weapons.set(id,c);
      }).catch(()=>{/* The slash trail still shows without the painted weapon. */});
    }
  }
  art.weapons=weapons;
  function add(name) {
    const c = document.createElement("canvas");
    c.className = "practice-art-canvas";
    c.dataset.practiceArt = name;
    c.hidden = true;
    c.setAttribute("aria-hidden", "true");
    parent.prepend(c);
    canvases[name] = c;
    return c;
  }
  try {
    renderers.canvas = createCanvasLab(add("canvas"), art, resolution);
    try {
      renderers.pixi = await createPixiLab(add("pixi"), art, resolution, () => {
        pixiAvailable = false;
        onLost("Graphics context lost. Selected fighters are using Canvas.");
      });
      pixiAvailable = true;
    } catch {
      /* The Canvas appearance remains usable without WebGL. */
    }
  } catch (error) {
    destroy();
    throw error;
  }
  function destroy() {
    if (disposed) return;
    disposed = true;
    observer.disconnect();
    for (const renderer of Object.values(renderers)) {
      try {
        renderer.destroy();
      } catch {
        /* A lost driver context must not strand the Canvas fallback. */
      }
    }
    for (const c of Object.values(canvases)) c.remove();
    sheets.destroy();runs.destroy();weapons.clear();
  }
  function hide() {
    for (const c of Object.values(canvases)) c.hidden = true;
    visible=null;
  }
  return {
    hasPixi: () => pixiAvailable,
    fighterIds:()=>sheets.readyIds(),
    failedSheets:()=>sheets.failedIds(),
    runningFighterIds:()=>runs.readyIds(),
    failedFighters:()=>[...new Set([...sheets.failedIds(),...runs.failedIds()])].filter(id=>selectedFighters.includes(id)),
    draw(state, viewport, requested, {preview=true,catalog={}}={}) {
      if (disposed) return;
      selectedFighters=preview?[]:state.fighters.map(f=>f.character).filter(isOriginalFighter);
      if(!preview){sheets.request(selectedFighters);runs.request(selectedFighters);}
      requestWeapons(state.fighters.flatMap(f=>[f.weapon,...(f.weapons??[])]));
      const selected =
        requested === "pixi" && pixiAvailable ? "pixi" : "canvas";
      if(visible!==selected){hide();canvases[selected].hidden=false;visible=selected;}
      const rect = bounds;
      if (
        sizes[selected]?.width !== rect.width ||
        sizes[selected]?.height !== rect.height
      ) {
        renderers[selected].resize(rect.width, rect.height);
        sizes[selected] = { width: rect.width, height: rect.height };
      }
      const reduced = reducedMotion.matches;
      const scene = practiceSceneFor(state, viewport, {
        reduced,
        effects: document.documentElement.dataset.effects !== "off",
        selected:!preview,catalog,atlasFighters:sheets.readyIds(),runningFighters:runs.readyIds(),
      });
      renderers[selected].draw(scene);
      canvases[selected].dataset.fighterModels=scene.fighters.map(f=>f.atlasId??'aren-preview').join(',');
      canvases[selected].dataset.runningModels=scene.fighters.map(f=>f.runAtlas?f.atlasId+':'+f.runVariant+':'+f.frameIndex:'none').join(',');
      return selected;
    },
    hide,
    destroy,
  };
}
