# Training arena · v0.10.0

Choose **Training** in Mode, select both fighters and equipment, and press Start training. The same movement, attack, guard, status and awakening rules run in the training simulation. There is no round timer, win/loss or knockout: without HP refills a fighter stays at 1 HP. Switching back to a match constructs a fresh ordinary match, so training assists do not carry over.

**Practice** pauses and opens settings. Start free practice / Start drill applies settings and resets the arena. Done returns to the paused session; Resume continues it. **Reset** (or **Retry** during a challenge) resets both positions, HP, resources, actions, effects, projectiles and challenge steps while keeping the selected loadouts and training configuration. Reset does not erase challenges already completed on this device. Normal blur/visibility, landscape rotation and Controls-editor pause behavior remain in force.

## Free practice

| Setting | Behavior |
| --- | --- |
| Idle dummy | No attacks or defense; learn movement, spacing and combos |
| Guarding dummy | Holds grounded guard; use pierce, guard pressure and recovery punish windows |
| Attacking dummy | Approaches if needed and attempts one legal basic every 2.5 seconds, after a one-second opening |
| Infinite stamina / chakra | Refills both meters before and after each tick; normal action eligibility still applies |
| Refill health | Restores both HP bars after each tick; actual damage still accumulates awakening charge |
| Instant cooldowns | Clears technique/dash cooldowns; does not remove attack recovery or the one-air-dash-per-landing limit |
| Show ranges and recovery | Draws indicative melee reach and body bounds, plus actual phase/recovery tick labels; projectiles use travel collision rather than these melee rectangles |
| Charge awakening | Free-practice-only shortcut to ready/re-arm a supported form; cannot satisfy a guided challenge |

Resource and health refills default on; instant cooldowns default off; range/phase overlays default on. Training configuration lasts for the session. Existing device control-layout/key settings continue to apply.

## Guided challenges

| Challenge | Evidence required | Scenario |
| --- | --- | --- |
| Double jump → air dash | Two real jump impulses and an air dash in the same airborne sequence | Idle dummy. Landing early resets progress; dashing before the second jump does not qualify. |
| Three-hit combo | Opening, second and launching basic each actually connect in one confirmed chain | Idle dummy at melee range. Holding Basic, recovery gaps or a weapon follow-up do not satisfy the three basics. |
| Guard → weapon counter | A real guarded/parried strike followed by an equipped hit during recovery/parry stun | Dummy uses a katana every 2.5 seconds. An unguarded attack or a late weapon hit does not qualify. |
| Unlock your awakening | Actual damage fills charge, then a legal awakening activation | Paced basic dummy stops attacking when READY. Wait for hitstun to end. If the selected fighter has no form, the drill explicitly uses Naruto while retaining the chosen weapon. |

The counter drill equips the dummy with a katana to give a consistent recovery window. Every other selected character/weapon is retained where supported. Dummy behavior is fixed by each guided scenario; free-practice dummy selection remains independently configurable.

A completed drill stays complete until Retry/Reset. Only the four validated completion IDs are saved under `shinobi-arena.drills.v1`; there are no accounts or remote progress sync. Completion is recorded from actual state/events, not a Next button. Instructions display the current remapped keyboard bindings and action names; touch controls complete the same objectives.

## Coach and feedback

The coach shows the next objective, step progress, current distance, attack cost/range and dummy phase. It explains range/height misses, guarded hits, unavailable bloodlines, stamina/chakra shortages, cooldowns, hitstun, airborne guard attempts and used jump/dash limits. Buffered actions are described as buffered, rather than falsely claiming they fired. Full descriptions remain available in Practice; compact landscape feedback can truncate long lines.

Range rectangles are learning aids; facing, relative height, guard, invulnerability and projectiles still affect collision. Turning overlays off changes only rendering. The renderer reads state and cannot advance challenge progress.

## Implementation and validation

`packages/engine/training.js` owns serializable practice configuration, legal dummy input, observations, progress, metrics and reset behavior. It wraps the same `stepMatch` kernel, whose only training-specific exceptions are no time/round resolution and a one-HP damage floor. Normal match costs, timing, effects and damage charge are retained.

`apps/web/training.js` owns the settings dialog, coach, remapped instruction labels and device progress. Training progression uses simulation ticks, not wall-clock time; identical inputs/settings produce identical state. `scripts/training-smoke.mjs` exercises all four challenges via real browser keyboard/touch input, including actual damage-earned awakening. Existing gameplay smoke checks run before it in CI and Pages deployment.

Physical-device mobile/Safari checks and human teaching feedback remain manual. Procedural visuals are still prototype art; this release does not add finished sprites or sound.
