import {
  loadLabArt,
  createCanvasLab,
  createPixiLab,
} from "./visual-lab-renderers.js";
import { practiceSceneFor } from "./packages/presentation/practice-scene.js";

export async function createPracticeBackends(parent, onLost) {
  const art = await loadLabArt(),
    resolution = Math.min(devicePixelRatio || 1, 1.5),
    canvases = {},
    renderers = {};
  let disposed = false,
    pixiAvailable = false;
  const sizes = {};
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
        onLost("Graphics context lost. Aren is using Canvas.");
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
    for (const renderer of Object.values(renderers)) {
      try {
        renderer.destroy();
      } catch {
        /* A lost driver context must not strand the Canvas fallback. */
      }
    }
    for (const c of Object.values(canvases)) c.remove();
  }
  function hide() {
    for (const c of Object.values(canvases)) c.hidden = true;
  }
  return {
    hasPixi: () => pixiAvailable,
    draw(state, viewport, requested, {preview=true,catalog={}}={}) {
      if (disposed) return;
      const selected =
        requested === "pixi" && pixiAvailable ? "pixi" : "canvas";
      hide();
      canvases[selected].hidden = false;
      const rect = parent.getBoundingClientRect();
      if (
        sizes[selected]?.width !== rect.width ||
        sizes[selected]?.height !== rect.height
      ) {
        renderers[selected].resize(rect.width, rect.height);
        sizes[selected] = { width: rect.width, height: rect.height };
      }
      const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      const scene = practiceSceneFor(state, viewport, {
        reduced,
        effects: document.documentElement.dataset.effects !== "off",
        selected:!preview,catalog,
      });
      renderers[selected].draw(scene);
      return selected;
    },
    hide,
    destroy,
  };
}
