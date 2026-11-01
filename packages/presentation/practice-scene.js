import { sceneFor } from "./visual-lab.js";
import { MOVES } from '../engine/index.js';
import { FIGHTER_FRAMES, fighterAtlasData } from './fighter-atlases.js';

// Presentation only: the selected character IDs, loadouts, physics and results stay intact.
export function practiceSceneFor(state, viewport, settings = {}) {
  const scene = sceneFor(state, settings);
  scene.viewport = { ...viewport };
  scene.decorative=settings.effects!==false;
  for (const actor of scene.fighters) {
    const fighter = state.fighters[actor.id];
    // The standing atlas pose is 302px tall; match the engine's 120*scale body height.
    actor.scale = (120 / 302) * (fighter.scale ?? 1);
    actor.alpha = fighter.invulnerable > 0 ? 0.45 : 1;
    if(settings.selected && settings.atlasFighters?.includes(fighter.character)){
      actor.atlasId=fighter.character;
      actor.frame=FIGHTER_FRAMES[actor.frameIndex];
      actor.blendFrame=FIGHTER_FRAMES[actor.blendIndex];
      actor.scale=120/fighterAtlasData(fighter.character).standingHeight*(fighter.scale??1);
    }
  }
  // Fluid bodies are drawn continuously by the original foreground renderer.
  if(settings.fluid)scene.fighters=[];
  // Native elemental fields; smoke, item cues and all text stay in the overlay.
  scene.zones = (state.zones ?? []).filter(z => z.kind === 'elemental').map(z => ({...z, element: MOVES[z.move]?.ground?.element ?? 'water'}));
  scene.projectiles = (state.projectiles??[]).map(p=>({...p,color:settings.catalog?.moves?.[p.move]?.color??MOVES[p.move]?.color??'#ffcb88',element:settings.catalog?.moves?.[p.move]?.element??MOVES[p.move]?.element??(MOVES[p.move]?.effect==='burn'?'fire':undefined)}));
  if(settings.selected)scene.fighters=scene.fighters.filter(f=>state.fighters[f.id].character==='aren'||settings.atlasFighters?.includes(state.fighters[f.id].character));
  return scene;
}
