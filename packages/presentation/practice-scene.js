import { sceneFor } from "./visual-lab.js";

// Presentation only: the selected character IDs, loadouts, physics and results stay intact.
export function practiceSceneFor(state, viewport, settings = {}) {
  const scene = sceneFor(state, settings);
  scene.viewport = { ...viewport };
  for (const actor of scene.fighters) {
    const fighter = state.fighters[actor.id];
    // The standing atlas pose is 302px tall; match the engine's 120*scale body height.
    actor.scale = (120 / 302) * (fighter.scale ?? 1);
    actor.alpha = fighter.invulnerable > 0 ? 0.45 : 1;
  }
  // These remain in the existing Canvas combat-cue layer for this integration.
  scene.zones = [];
  scene.projectiles = [];
  scene.bursts = [];
  return scene;
}
