# Shinobi Arena

A playable browser fighting prototype with a **four-character selectable roster**, desktop keyboard controls,
landscape phone controls, local two-player and a basic computer opponent.

## Play

https://driaque.github.io/shinobi-arena/

Choose VS COMPUTER or LOCAL TWO PLAYER, select both characters, equip each fighter with a weapon, and enter the arena. First to two round wins.
Available fighters: Naruto, Sasuke, Hinata and Orochimaru. Weapons: kunai, shuriken and katana.

Rounds last 90 seconds. Knockout wins; at timeout, higher remaining HP wins; equal HP or a double
knockout draws. Tap an attack again to use it again after recovery. Specials spend chakra.

| Action | P1 | P2 |
| --- | --- | --- |
| Move / double-tap directional dash | A / D | Left / right arrows |
| Jump / double jump | W twice | Up arrow twice |
| Explicit back / forward dash | Q / E | Double-tap direction |
| Basic hit | J | N |
| Equipped weapon | H | B |
| Guard | K | M |
| Signature jutsus | U / I | Comma / period |
| Bloodline jutsu (where available) | O | Slash |
| Replacement | R | V |
| Pause | P or Escape | P or Escape |

Phone: hold sideways. Left thumb moves/jumps; right thumb attacks/guards. One phone controls Naruto;
use the computer opponent. Local two-player uses a shared desktop keyboard. Switching apps, losing
focus or rotating into portrait pauses the local match; resume explicitly.

## Implemented

- 60 Hz simulation separate from rendering and device input.
- Movement, double jump, forward/back dash, facing, arena/body collision.
- Startup/active/recovery attack phases, single-hit swings, hitstun, guard, knockback.
- Character-specific signatures and bloodline techniques; weapons selected before battle.
- Replacement escape, guard-piercing attacks, damage weakening, poison and burn with visible timers.
- Rasengan/Chidori, clones, Fireball, Gentle Fist, snake strikes, Sharingan and Byakugan adaptations.
- HP, chakra spending/regeneration, timer, round scoring, next round and rematch.
- Deterministic baseline computer opponent using legal action inputs.
- Responsive arena, multi-touch capture/cancellation, portrait gate, explicit pause/resume.
- Procedural character/stage animation without external asset downloads.

## Limits

Prototype artwork, not detailed anime sprites. No online play, configurable
key bindings, audio, accounts or saved replays yet. Local two-player can be limited by a keyboard's
hardware key rollover. Computer strategy is simple. Physical iPhone/Android validation remains necessary.

## Develop

Node 22:

```sh
npm ci
npm run verify
npm run dev
```

Open http://localhost:4173. Rebuild after source edits.

Browser checks (complete local match, rematch, pause, emulated mobile multi-touch and rotation):

```sh
npx playwright install --with-deps chromium --only-shell
npm run test:browser
```

An alternate local Chromium executable can be supplied using `CHROMIUM_PATH`.
CI and deployment run unit checks, build and browser checks before publishing.

## Structure

`packages/engine` owns combat; `packages/input` owns independent input sources and quick-tap capture;
`apps/web` owns browser events and procedural rendering. Neither engine nor input library imports the DOM.
Simulation rules version: `duel-0.3.0`.

See [project plan](docs/PROJECT_PLAN.md), [combat rules](docs/COMBAT_RULES.md), [character kits](docs/CHARACTER_KITS.md),
[mobile design](docs/MOBILE_DESIGN.md), [architecture](docs/ARCHITECTURE.md),
[delivery](docs/DELIVERY.md) and [validation](docs/VALIDATION.md).

No third-party character assets are bundled. Asset provenance is recorded in
[the asset register](docs/ASSET_REGISTER.md). No repository license has been selected yet.
