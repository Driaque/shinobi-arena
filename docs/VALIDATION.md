# Playable duel validation

## Archived v0.6.0 report

Local validation on October 26, 2026:

- `npm run verify`: passed JavaScript syntax checks, 70 unit tests and static build.
- Browser test clock is explicitly paused and advanced by the harness, keeping combo input timing
  independent of CI runner wall-clock speed. The combo scenario closes to melee range before tapping.
- `npm run test:browser`: passed using Playwright 1.62.1 with an alternate local Chromium 153 binary.
  The standard browser download endpoint was unavailable in the workspace; CI installs Playwright's
  matching Chromium using its normal installer.
- Browser scenarios: keyboard movement and damage, frozen timer while paused, complete local match,
  next round, rematch/reset, CPU round completion, simultaneous touch movement+attack, individual
  finger release, touch cancellation, portrait input gate, landscape explicit resume, control bounds
  at-least-48px touch targets at 844×390 and 667×375, character/weapon selection reaching the simulation, Byakugan activation and Replacement cooldown display. No browser page errors were observed.
- Screenshots of desktop and landscape mobile were visually inspected locally.
- New control tests cover proportional analog movement/dead zone, axis reset, keyboard/axis arbitration,
  default layout bounds/overlap detection, key conflicts/reserved keys, settings round trips and corrupt-data fallback.
- Roster browser checks cover both sixteen-character grids, independent choices, native arrow-key selection,
  Computer/Player Two labels, mirror matches, selected loadouts reaching combat, and small landscape card bounds.
- New combo/form checks cover hit-confirm chains, combo scaling, guard/whiff/Replacement breaks, actual
  HP-loss charging, awakening eligibility, one-use/expiry/reset rules, stat modifiers, signature overrides,
  deterministic transformed replays, and migration of existing control preferences.
- Browser combat checks include a visible three-hit combo and charging/activating/expiring Kurama through
  real combat inputs, plus name search and Naruto/Boruto filtering.
- Browser control checks cover stick + attack multi-touch, release/cancel, drag/resize, rebind/duplicate rejection,
  reload persistence, old/new key behaviour, Cancel rollback, overlap-save rejection and small-screen bounds.
- New mechanics tests cover double jumping, both directional dashes, Replacement costs/cooldowns/immunity,
  guard penetration, poison/burn ticks and expiry, weakening, Byakugan, unavailable bloodlines, loadout
  preservation/validation, cooldown rejection and effect reapplication without stacking.
- Tests also cover action timing, one-hit swings, block chip, double KO, insufficient chakra, fireball/jump
  interactions, interruption, collision, round lifecycle, deterministic replay equivalence and computer play.
- Physical iPhone/Android checks remain pending. Chromium emulation is not a Safari compatibility claim.
- Hosted CI/deployment results for each commit are in the repository Actions tab.

Initial foundation GitHub CI passed before this change. No performance/scalability measurements or
online-play claims are made. Browser smoke automation does not replace interactive combat tuning.



## v0.7.0 — Silent and Winta

Engine checks cover individual sword chains, guard absorption/reflect and counter expiry, full-pierce bypass, pull/metal vulnerability without accidental DOT, guard/Replacement avoidance, lightning-only amplification, actual-damage lifesteal/HP cap/overkill, awakening expiry/reset/faster chains, and deterministic replay. Browser smoke covers all 18 roster entries, Originals / TNR filter, both concept images, selected Tachi/Kaiken loadouts, real guard reflect/counter HUD and the existing desktop/mobile suite. Mobile screenshots include the original portraits at landscape size. Prototype art and playtest balance remain limitations.

## v0.8.0 — movement, tactics and mobile controls

Added engine regression coverage for simultaneous jump/dash, dash cancellation, air-dash landing reset, movement buffering, consecutive fast taps, stamina exhaustion/recovery, timed parries and pierce bypass, guard break/recovery, weapon guard pressure, whiff/recovery punishes and CPU counterplay against basic-only rushes at six tap rates. Preference checks cover dock bounds, opacity/placement persistence and old custom-key/layout migration including P2 dash conflicts.

Browser smoke now verifies real multi-pointer jump → air dash, a separate battle/deck boundary, repeated-tap viewport scale/scroll stability, dock/overlay switching, opacity save/reload/cancel, and the existing roster/combat/round/editor paths. Existing idle-opponent round checks allow stamina recovery instead of assuming unlimited rapid basics. The weaken test clears recovery state to isolate its 30% modifier from the new punish bonus.

Physical device Safari gesture behavior and human balance feedback remain manual checks; Chromium emulation alone does not establish either.

Local v0.8 result: `npm run verify` passes syntax checks, all 98 unit tests and the static build. `npm run test:browser` passes the complete desktop/mobile suite, with no page errors. Dock/gameplay/editor screenshots were visually reviewed.

## v0.9.0 — CPU difficulty

`npm run verify`: syntax checks, **108 unit tests**, and static build pass. Added coverage for all four policies, Easy fallback/default and grace period, recovery gaps, combo limits and pressure differences, reaction thresholds, equal starting fighter stats, pure/deterministic CPU decisions, resource budgets for every character/mode, difficulty preservation between rounds, and a learner winning on Easy with spaced basics. The existing anti-spam stress test now explicitly selects Xtreme. Browser scenarios cover the four options, saved difficulty, disabling the selector for local P2 and pausing/preserving an active mobile fight when difficulty changes.

## v0.10.0 — training arena and guided learning

Local syntax checks, **123 unit tests**, and the static build pass. Training coverage includes nonlethal/time-free simulation, resource and cooldown assists, reset/config retention, legal dummy inputs, all four objective detectors and false-positive cases, unsupported-form fallback, free-practice-only form charging, phase/cost/range readout, input explanations and deterministic replay. Existing match tests still pass.

The browser suite now runs both ordinary gameplay and training scenarios. Training checks complete all four drills through actual keyboard inputs (including real damage-earned awakening), complete movement/combo drills through multi-touch, save/reload four completion badges, exercise settings/reset/resource costs, leave training without assists leaking, and test Controls pause/portrait handling and small-landscape toolbar bounds. Desktop/mobile coach and range overlays were visually reviewed. Physical-device Safari behavior and human learning/balance feedback remain manual validation.

## v0.11.0 — analog movement and fullscreen

Syntax checks, **138 unit tests**, and the static build pass. Added coverage for centered/released double pulls, absolute dash direction while facing away, repeated up-pull jumps, hold/jitter/slow-pull suppression, diagonal intent, crouch/stand/jump transitions, melee and projectile behavior, source isolation, pulse reset and preference migration without stealing S. Fullscreen controller tests cover synchronous activation, native/prefixed success and exit, missing/rejected API fallback, Escape, visual viewport sizing and orientation-lock failure.

Both browser suites pass. New mobile scenarios complete the movement drill entirely through stick pulls, crouch via down/neutral/cancel, enter/exit a viewport-filling presentation and force unsupported-fullscreen fallback with a visible notice. Existing gameplay/training, multi-touch, resource, persistence and portrait checks remain in place. Physical iPhone/Safari fullscreen and gesture checks remain manual; emulation does not establish OS-level support.

Hosted deployment caught a portrait-prompt timing race after native fullscreen exit (the parallel CI run passed). The gate now reads layout viewport dimensions and responds to window/visualViewport/orientation resize signals in addition to media queries. The browser test waits for the actual portrait prompt transition before asserting the paused-resume state.


## v0.12.0 — online matchmaking

Syntax checks, **147 unit/integration tests**, static build, and desktop/mobile/training/online browser checks pass locally. New tests cover name/loadout validation, version checks, FIFO/cancellation, authoritative slot/input ownership, frozen countdowns, duplicate and stale packets, one-shot consumption, round readiness, disconnect forfeits, capacity/rate caps, room expiry, and real WebSocket transport with rejected origins.

The online browser test uses independent desktop and landscape mobile contexts: queue/cancel/requeue, Silent vs Winta with independent weapons, P1 keyboard and P2 analog/actions, damage synchronized between both browsers, disconnect and requeue, then return to CPU. It observes the real network state to approach within melee range rather than assuming fixed wall-clock movement. Screenshots are retained in CI artifacts.

These checks use a local server and emulated touch. Public internet latency, hosting availability, physical phones and production capacity remain unverified. A static deployment does not make the multiplayer server live. See ONLINE_MULTIPLAYER.md for the separate hosting requirement.


## Internet deployment

The confirmed Render workspace now hosts `https://shinobi-arena-online.onrender.com` on one free Ohio service. `/health` responded successfully and the public WSS upgrade returned the expected protocol/rules greeting. Internet QA exposed a cancel/immediate-requeue race: a new connection could arrive before the old queue entry was removed. The client now sends explicit cancellation and waits for the old close acknowledgement before reconnecting, with generation guards and a bounded wait. The online browser scenario exercises that sequence before pairing and combat. `ONLINE_TEST_URL` runs the same two-client scenario against a deployed endpoint; default CI remains isolated. Explicit proxy QA mode tolerates the test network's TLS interception only; normal gameplay uses ordinary browser TLS validation.

The checked-in public endpoint configures Pages automatically; an Actions variable can override it. The live connector-created Render service uses on-commit deployment and TCP probes, while `render.yaml` documents optional checks-gated deployment and an HTTP health check. No paid compute upgrade or account/authentication feature was added.


## Hotfix — missing static files crashed the online server

Render logs confirmed repeated exit-code-1 restarts with `ERR_HTTP_HEADERS_SENT` in `apps/server/index.js`. The static handler committed 200 headers before awaiting the file read; a missing file then tried to send 404 headers and rejected the async request handler. The corrected handler reads the file before committing success headers, returns 404 for missing files/directories, handles other read failures as 500, and guards closed/already-started responses. The local static development server was checked for the same ordering issue and a…751 tokens truncated…ritative seven/two/four limits, bloodline ownership, custom-slot awakening mapping, elemental zones, poison-slow, binding, knockback, bleed, guard-dependent absorb, charging, chakra steal, healing, cleansing, haste/ward and the named Winta attacks. Existing combat/input/server suites remain required.

History tests cover hashed identity tokens, rename/recovery, file-backed restart durability, duplicate/concurrent result delivery, pair caps, early forfeits, draws/cancellations, pagination, retention and read-only HTTP endpoints. Accepted input recording is resimulated and compared with the original final state including ground effects and tools. Spectators are tested against input/ready/join/result mutation attempts and do not take queue/player slots.

The sixth browser suite exercises desktop/mobile loadout grids, seven-jutsu cap, Save/Cancel/reload, real ground damage, mobile palette casting and hold-to-charge, two ranked clients plus a third spectator, forfeit ratings, replay playback/seek/speed/download, profile restore and server restart. Production PostgreSQL validation remains a deployment gate until DATABASE_URL is connected.

v0.16 adds engine coverage for environment gating without resource loss, a five-hit launcher/chase/air-jutsu route, whiff/guard/bind rejection, air budgets across double jumps, juggle recovery including simultaneous projectiles, landing interruption, deterministic replay and finite cosmetic interpolation. The aerial browser suite exercises keyboard combos, searchable tags, mobile analog jumping and aerial menu gating, reduced-motion rendering, and desktop/mobile scenery captures.
