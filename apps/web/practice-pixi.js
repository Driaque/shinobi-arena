import {
  loadLabArt,
  createCanvasLab,
  createPixiLab,
} from "./visual-lab-renderers.js";
import { practiceSceneFor } from "./packages/presentation/practice-scene.js";
import { createFighterAtlasStore } from './packages/presentation/fighter-atlases.js';

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
  art.sheets=sheets;
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
    sheets.destroy();
  }
  function hide() {
    for (const c of Object.values(canvases)) c.hidden = true;
    visible=null;
  }
  return {
    hasPixi: () => pixiAvailable,
    fighterIds:()=>sheets.readyIds(),
    failedFighters:()=>sheets.failedIds().filter(id=>selectedFighters.includes(id)),
    draw(state, viewport, requested, {preview=true,catalog={},fluid=false}={}) {
      if (disposed) return;
      selectedFighters=preview||fluid?[]:state.fighters.map(f=>f.character);
      if(!preview&&!fluid)sheets.request(state.fighters.map(f=>f.character));
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
        selected:!preview,catalog,atlasFighters:sheets.readyIds(),fluid,
      });
      renderers[selected].draw(scene);
      canvases[selected].dataset.fighterModels=scene.fighters.map(f=>f.atlasId??'aren-preview').join(',');
      return selected;
    },
    hide,
    destroy,
  };
}
