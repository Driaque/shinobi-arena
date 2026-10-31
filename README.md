> **v0.28.3: Safer matchmaking cancellation, timeouts and retries.** [Release notes](docs/releases/0.28.3.md).

# Fabled Rivals

Master your style. Forge your legend.

Formerly Shinobi Arena. The current roster is a development prototype; a fully original roster and setting are planned for public rollout. This branding update does not replace the prototype characters.

A playable browser fighting prototype with a **28-character selectable roster spanning Naruto, Boruto and TNR originals**, desktop keyboard controls,
a landscape analog stick and customizable touch controls, online matchmaking, local two-player and a computer opponent.

## Practice graphics

PixiJS scenery and combat effects are enabled by default in CPU, local, Training, online, live spectating and replay playback. Graphics → Renderer selects PixiJS or Canvas compatibility for all views. Missing WebGL falls back to Canvas. Selected fighters keep their own appearance; Aren uses his existing sprite atlas. The separate Training → Practice appearance preview remains optional. Weapons, status cues and text retain a Canvas compatibility layer.

The default roster is Silent, Winta, Dora, Aren, Eira, Kael, Nyra, Rook, Veyra and Oryn. Each fighter has a connected backstory under Story & connections. Check Include Naruto / Boruto fighters to reveal the 25 prototype anime fighters; the checkbox starts off each visit. [Roster lore](docs/ORIGINAL_ROSTER.md).

## Visual Lab

Open the Visual Lab link below the game, or visit `/visual-lab.html` on the existing host. Compare PixiJS/WebGL and Canvas 2D using identical original artwork, local practice state and camera. The guided demo earns a five-hit aerial combo; switch to free practice for keyboard/touch controls. This is an optional rendering prototype, separate from online fights. See [Visual Lab design and measurement limits](docs/VISUAL_LAB.md).

## Play

https://shinobi-arena-online.onrender.com/

The current Render address remains available while a dedicated game-branded domain is selected. Personal GitHub Pages launch promotions have been removed. Opening a sleeping Render service can still display the provider’s loading screen before the application starts; this patch does not change hosting.

For online play, choose ONLINE MATCHMAKING, enter your name, choose your own fighter/weapon, and Find opponent. The shared internet server is configured automatically. Both players choose Find opponent; the first available pair enters a match. For solo/shared-keyboard play choose VS COMPUTER or LOCAL TWO PLAYER, select both characters, equip each fighter with a weapon, and enter the arena. First to two round wins.
Both sides have independent visual character grids with portraits and selection badges. Tap a card, or use the keyboard to navigate the radio group. The opponent grid is labelled Computer or Player Two to match the mode.

Available fighters include ten Akatsuki members (Pain, Konan, Kisame, Deidara, Sasori, Hidan, Kakuzu, Zetsu, Obito and Itachi), the Naruto/Boruto cast, and Dora, Silent and Winta. Search by name or filter Akatsuki/era; both grids scroll independently. Select up to seven jutsus, two weapons and four consumables from their grids.

Rounds last 90 seconds. Knockout wins; at timeout, higher remaining HP wins; equal HP or a double
knockout draws. Tap an attack again to use it again after recovery. Specials spend chakra.

Default keyboard bindings (customizable in Controls → Keyboard):

| Action | P1 | P2 |
| --- | --- | --- |
| Move / double-tap directional dash | A / D | Left / right arrows |
| Jump / double jump | W twice | Up arrow twice |
| Explicit back / forward dash | Q / E | [ / ] |
| Basic hit | J | N |
| Equipped weapon | H | B |
| Guard | K | M |
| Signature jutsus | U / I | Comma / period |
| Bloodline jutsu (where available) | O | Slash |
| Replacement | R | V |
| Awakening (when ready) | T | Y |
| Swap equipped weapon | F | 7 |
| Choose / use consumable | C / X | 8 / 9 |
| Pause (offline) | P or Escape | P or Escape |

Phone: hold sideways. Use the left analog stick to move, the separate jump/dash buttons to maneuver, and the right action cluster to fight. Push the stick farther to move faster. Up/down changes arena depth; double-pull sideways to dash. Use the dedicated Jump/Crouch actions. Open **Controls** to adjust opacity, switch below-arena/overlay placement, drag and resize controls, or edit keyboard bindings. Save keeps the settings on this device; Cancel discards the draft. One phone controls your own fighter in online mode;
use the computer opponent for solo play. Local two-player uses a shared desktop keyboard. Switching apps, losing
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

Combat balance and artwork remain prototypes, not a finished competitive fighter or detailed anime sprite production. Online play uses the deployed Render server and currently has no prediction/rollback or reconnect support. Audio, accounts and saved replays are not implemented. Local two-player can be limited by a keyboard's
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
`apps/server` owns the online queue and authoritative matches; `packages/network` validates the wire protocol.
Simulation rules version: `duel-0.18.0`.

See [project plan](docs/PROJECT_PLAN.md), [combat rules](docs/COMBAT_RULES.md), [character kits](docs/CHARACTER_KITS.md),
[mobile design](docs/MOBILE_DESIGN.md), [control settings](docs/CONTROL_SETTINGS.md), [architecture](docs/ARCHITECTURE.md),
[delivery](docs/DELIVERY.md) and [validation](docs/VALIDATION.md).

No third-party character assets are bundled. Asset provenance is recorded in
[the asset register](docs/ASSET_REGISTER.md). No repository license has been selected yet.



### v0.7.0: The Northern Calamity

28 selectable fighters now include **Silent — Cold Metal** and **Winta — Frozen Sun**, and **Dora — AquaPrincess**, under **Originals / TNR**, with user-supplied concept portraits. Silent has sword counters, Tetsugan guard reflect/absorption and a pulling metal-vulnerability strike. Winta has lightning pressure and a lifestealing strike. Their proposed awakenings change signatures and speed up sword chains. Tachi and Kaiken are selectable equipment. [Character kits and adaptation notes](docs/ORIGINAL_CHARACTERS.md).

### v0.8.0: movement, counterplay and clear mobile controls

Jump and dash work together, including one air dash per landing cycle and fast-tap buffering. Stamina limits basic/weapon spam; timed parries, guard breaks and +20% recovery punishes reward defense, spacing and varied attacks. The CPU responds to startup, recovery and guard. P2 has [ / ] dash shortcuts.

Controls now default to a separate deck **below** the fight, with a camera sized for the remaining viewport. Controls → Opacity adjusts visibility from 25–100%; Placement can restore an overlay. Preferences migrate without losing existing keys/layouts. Live play suppresses native touch zoom/scroll gestures; fullscreen requests landscape where browsers support it.

### v0.9.0: choose your CPU difficulty

The top bar now offers **Easy / Medium / Difficult / Xtreme**, with **Easy** selected by default. Easy gives you a three-second opening, single attacks and long pauses to learn your controls. Higher modes add longer combos, faster reactions and tighter counterplay. The CPU gets no bonus HP, damage or resources, and every mode respects stamina and cooldowns. Changing difficulty pauses and preserves your current fight; your choice is saved on this device. [Difficulty tuning](docs/DIFFICULTY.md).

### v0.10.0: training arena and guided challenges

Choose **Training** in Mode. **Practice** configures idle/guarding/attacking dummies, infinite stamina/chakra, HP refills, instant cooldowns and range/recovery overlays. **Reset / Retry** instantly resets the arena. Four real-input challenges teach double jump → air dash, three-hit combos, guard → weapon counters and damage-earned awakening. The coach explains misses and rejected actions; completed challenges save on this device. [Training guide](docs/TRAINING.md).

### v0.11.0: movement gestures and fullscreen

The analog controls horizontal and shallow arena-depth movement. Double-pull left/right within 300 ms to dash. Dedicated actions perform Jump and Crouch, and the equipped row exposes Hold Charge. Keyboard Z/L changes depth; W/S remains Jump/Crouch. Full screen uses native fullscreen where available, otherwise an expanded play view. [Controls and browser behavior](docs/CONTROL_SETTINGS.md).

### v0.12.0: online matchmaking

Enter a display name, select your fighter/weapon, and wait in the shared queue. Pairing assigns one fighter to each device, with a three-second countdown. The Node/WebSocket server runs combat, sends shared state, handles round readiness and forfeits disconnected players. Desktop and mobile use their normal local controls. Includes a Render deployment blueprint and CI coverage with two independent browser sessions. [Online architecture and deployment](docs/ONLINE_MULTIPLAYER.md).

### v0.13.0: inventory, tactical items and control visibility

Choose two weapons and four one-use consumables per round before a match or joining matchmaking. **F** swaps weapons; **C** selects an item and **X** uses it. Items include delayed paper bombs, throwing kunai, shuriken fans, poison coating, defensive smoke and a two-stage Flying Raijin marking kunai/warp. These actions respect startup, recovery, stamina, shared cooldowns and hitstun; the online server owns their state. The HUD displays active weapons and remaining inventory.

**Controls → Visible controls** offers a checkbox for every touch control. Save persists the choice; Cancel discards it. Hidden buttons keep their keyboard bindings and no longer reserve collision space. The analog stick can replace horizontal dash buttons; keep Jump available for aerial movement. Existing preferences migrate without overwriting custom keys.

[Full v0.13.0 release notes](docs/releases/0.13.0.md) · [Release history](CHANGELOG.md). Version updates require notes, and verified deployments publish a matching GitHub Release automatically.

The implementation for [online milestone #7](https://github.com/Driaque/shinobi-arena/issues/7) is in v0.15.0. See [online arena and storage](docs/ONLINE_ARENA.md). Production activation requires DATABASE_URL and matching client/server deployment.
