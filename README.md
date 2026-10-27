# Shinobi Arena

A playable browser fighting prototype with a **16-character selectable roster spanning Naruto and Boruto**, desktop keyboard controls,
a landscape analog stick and customizable touch controls, local two-player and a basic computer opponent.

## Play

https://driaque.github.io/shinobi-arena/

Choose VS COMPUTER or LOCAL TWO PLAYER, select both characters, equip each fighter with a weapon, and enter the arena. First to two round wins.
Both sides have independent visual character grids with portraits and selection badges. Tap a card, or use the keyboard to navigate the radio group. The opponent grid is labelled Computer or Player Two to match the mode.

Available fighters: Naruto, Sasuke, Hinata, Orochimaru, Kakashi, Sakura, Gaara, Itachi, Rock Lee, Shikamaru, Minato, Madara, Boruto, Sarada, Mitsuki and Kawaki. Search by name or filter by era; each player’s grid scrolls independently. Weapons: kunai, shuriken and katana.

Rounds last 90 seconds. Knockout wins; at timeout, higher remaining HP wins; equal HP or a double
knockout draws. Tap an attack again to use it again after recovery. Specials spend chakra.

Default keyboard bindings (customizable in Controls → Keyboard):

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
| Awakening (when ready) | T | Y |
| Pause | P or Escape | P or Escape |

Phone: hold sideways. Use the left analog stick to move, the separate jump/dash buttons to maneuver, and the right action cluster to fight. Push the stick farther to move faster; vertical stick motion does not jump. Open **Controls** to drag and resize controls, or edit keyboard bindings. Save keeps the settings on this device; Cancel discards the draft. One phone controls Naruto;
use the computer opponent. Local two-player uses a shared desktop keyboard. Switching apps, losing
focus or rotating into portrait pauses the local match; resume explicitly.

## Implemented

- 60 Hz simulation separate from rendering and device input.
- Movement, double jump, forward/back dash, facing, arena/body collision.
- Startup/active/recovery attack phases, single-hit swings, hitstun, guard and knockback.
- Buffered three-hit basic chains, hit-confirm weapon/jutsu cancels, combo scaling and launching finishers.
- Damage-unlocked awakenings on selected fighters: Kurama, Susanoo, Eight Gates, Karma and Sage Mode.
- Awakening meters/timers, changed stats/signatures, aura effects, hit counters and floating damage.
- Character-specific signatures and bloodline techniques; weapons selected before battle.
- Replacement escape, guard-piercing attacks, damage weakening, poison and burn with visible timers.
- Rasengan/Chidori, clones, Fireball, Gentle Fist, snake strikes, Sharingan and Byakugan adaptations.
- HP, chakra spending/regeneration, timer, round scoring, next round and rematch.
- Deterministic baseline computer opponent using legal action inputs.
- Proportional analog movement with dead zone, independent multi-touch actions, and safe cancellation.
- Drag/resize control editor, key rebinding for both players, conflict checks and device-local persistence.
- Responsive arena, portrait gate and explicit pause/resume.
- Procedural character/stage animation without external asset downloads.

## Combos and awakenings

Tap Basic three times with rhythm; holding does not auto-combo. A short input buffer helps link stages.
After a confirmed basic hit, weapon or signature input can cancel recovery. Guards, whiffs, recovery gaps
and Replacement break the sequence. Later connected hits scale down in damage.

For selected characters, actual HP lost fills the awakening meter. When READY, press T/Y or tap Awaken
while free to act. One activation per round, with a visible duration; it does not heal or grant immunity.
Naruto’s Kurama Chakra Mode changes his signatures to Kurama Rasengan and Chakra Claw.

## Limits

Combat balance and artwork remain prototypes, not a finished competitive fighter or detailed anime sprite production. No online play, audio, accounts or saved replays yet. Local two-player can be limited by a keyboard's
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
Simulation rules version: `duel-0.6.0`.

See [project plan](docs/PROJECT_PLAN.md), [combat rules](docs/COMBAT_RULES.md), [character kits](docs/CHARACTER_KITS.md),
[mobile design](docs/MOBILE_DESIGN.md), [control settings](docs/CONTROL_SETTINGS.md), [architecture](docs/ARCHITECTURE.md),
[delivery](docs/DELIVERY.md) and [validation](docs/VALIDATION.md).

No third-party character assets are bundled. Asset provenance is recorded in
[the asset register](docs/ASSET_REGISTER.md). No repository license has been selected yet.

