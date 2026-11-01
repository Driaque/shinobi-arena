# Rendering audit, October 31, 2026

## Findings

The game uses PixiJS 8.22.0. The scene already uses a single manually driven renderer with autoStart false, cached texture views and fixed per-pose roots. Adding another ticker or replacing frame selection with AnimatedSprite would not add missing animation poses. The original fighter renderer articulates limbs continuously; the painted run cycle uses only two separate silhouettes. Do not blend these paintings, earlier crossfades produced double limbs.

Local matches previously sampled only authoritative ticks, even on high-refresh displays. Cosmetic projection now uses observed displacement, capped to one tick. Network interpolation and replay sampling retain their established paths.

## Applied

Restore continuous procedural bodies as the default over the Pixi scenery layer; expose painted art as an independent preference. Keep one frame loop. Retain static Graphics geometry; update only dynamic ground geometry. Disable event traversal in the noninteractive Pixi scene. Avoid per-draw hidden mutations and layout reads.

## Art implementation

Aren and Silent now use dedicated layered Canvas artwork driven by the original articulated pose. Rear cloth and hair, segmented legs, torso armor, arms, bracers, face and crests are composed in depth order. Existing attack weapon effects remain attached to the same hand coordinates. Other fighters retain their original procedural bodies. Painted sheets and selection portraits are unchanged.

## Next art milestone

Author coherent run, jump, landing, guard and attack sequences or layered rigs for a single fighter before expanding the roster. Keep foot roots, body proportions and weapon attachment points consistent. Evaluate the result against the procedural baseline in motion, including frame pacing and input response on actual desktop and mobile hardware. Asset generation alone does not meet this quality gate.

## Primary references

- https://pixijs.com/8.x/guides/concepts/performance-tips , stable Graphics geometry, sprite batching, event traversal and profiling first.
- https://pixijs.com/8.x/guides/components/ticker , delta-based updates, update priority and frame caps.
- https://pixijs.com/8.x/guides/components/application/ticker-plugin , application render loop ownership and manual rendering.

No measured hardware FPS improvement is claimed without a device trace. Headless browser checks verify rendering behavior and compatibility, not subjective animation quality.
