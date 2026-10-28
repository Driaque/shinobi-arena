# Architecture decisions

## ADR 001 · Local-first browser fighter

Accepted for the foundation. Native browser modules keep the runtime free of external libraries; Playwright is a development-only test dependency.
This is a scaffold decision, not a claim that a complete game needs no libraries.
Canvas 2D is selected for the first playable duel; it owns presentation only, not combat rules.
Angular can later own the catalogue/account shell; it should not drive each simulation frame.
C#/.NET is a candidate for platform APIs and session services after the online spike defines needs.

## ADR 002 · Separate simulation from devices and rendering

Input adapter -> tick-indexed input frame -> simulation -> state/events -> renderer/audio.
The simulation imports no DOM, rendering, clock, network or audio APIs. Advance it with an explicit
tick and inputs. Character definitions are versioned data interpreted by trusted game code.
Use integer/fixed-point quantities where reproducibility requires them. Never read wall-clock time
inside combat rules. Inject seeded randomness; log seed, rules version and ordered inputs for replay.
Specify ordering for simultaneous hits, KO, projectile expiry, block and effect expiration.

Snapshots contain positions, velocities, facing, HP/chakra, move phase, timers and round state.
Input frames identify player, match, sequence/tick and actions. Reject impossible rates and stale frames.
Represent startup/active/recovery, hitstun/blockstun and hit-once-per-target explicitly.
Test deterministic replay and cross-runtime behaviour before promising rollback compatibility.

## ADR 003 · Authoritative shared-engine online prototype

Accepted for v0.12. One Node process owns FIFO matchmaking and room lifecycle; `ws` provides the persistent transport. The server imports the exact same headless engine as local play and advances it at 60 Hz. Clients send bounded, sequenced intentions; they never send authoritative positions, HP or results. Full snapshots arrive at 20 Hz. This reuses the existing combat kernel without maintaining a second implementation.

The first online version deliberately has no prediction, interpolation or rollback. Round readiness is explicit; losing a connection forfeits rather than trying to merge diverged state. Queue and rooms are in memory, so one instance is required and restarting loses active sessions. This fits an unranked prototype; measured capacity, shared matchmaking/routing, identity, reconnection and latency compensation remain follow-up work. Protocol/catalog validation and bounded transport resources constrain clients, while service-level abuse protection remains a hosting concern. See [online protocol and deployment](ONLINE_MULTIPLAYER.md).

## ADR 004 · Keep games distinct

The eventual platform owns catalogue, identity, rooms, lifecycle and results. A fighting game owns
collision and combat rules. Another game owns its own board/scoring rules. Avoid one giant rules
engine that forces every game into fighting-game states. Add shared interfaces only after two working examples.

## Delivery boundaries

The static browser shell deploys to GitHub Pages. The v0.12 Node/WebSocket backend has a separate `render.yaml` deployment blueprint and also serves the complete game itself. GitHub CI verifies both, including two real browser connections. Public matchmaking requires a running backend; a Pages deploy alone cannot supply it. The deployed single-instance Render service is in Ohio, and the public server address is committed in `apps/web/online-config.json`. The connector-created service currently follows on-commit deployment with TCP health probes; adopting the Blueprint applies its declared checks-gated deployment and HTTP `/health` check. `ONLINE_SERVER_URL` is a public endpoint setting, never a credential. Do not place API secrets in a static build.


## ADR 005 · Character kits and composable effects

Accepted for 0.3.0. Character and weapon catalogues select trusted move definitions. Loadouts are
validated before match creation and retained across rounds. Signatures, equipped weapon and bloodline
are distinct action slots; absence of a bloodline is represented explicitly rather than a fallback attack.
Effect instances carry type, duration, potency and next-tick time. Reapplication refreshes one instance
without resetting its periodic damage schedule. Movement/escape use the same device-independent action
contract on keyboard, touch and computer input. The simulation remains independent of DOM and rendering.
Balance values are prototype tuning; the architecture does not imply balanced competitive play.


## ADR 006 · Analog input and local control preferences

Accepted for 0.4.0. The input frame carries a bounded `moveX` axis alongside action booleans. The engine
uses keyboard directions when held, otherwise the axis; it knows nothing about joystick pixels or DOM.
The browser adapter owns radial dead-zone normalization, capture and cancellation. A pure preference
module handles safe bounds, collision checks, binding conflicts and persisted-data validation.
Settings use a versioned browser-local schema with separate viewport profiles; editing is a draft and
requires Save. This is separate from combat/match data and does not require a backend.

## ADR 007 · Explicit comeback forms and hit-confirm chains

Accepted for 0.6.0. Awakening definitions are data, referenced from eligible character kits. Actual damage
is centralized so charge excludes overkill and respects defence. Activation state, duration and usage are
per fighter/per round. Move overrides resolve through the same action dispatcher and revert on expiry.
The input buffer is tick-bounded; only confirmed basics can cancel into configured follow-ups. Combo
continuation depends on the target still being in hitstun, with explicit scaling and no DOT hit counting.
All of this remains headless/replayable. Presentation adds aura, counters and optional camera shake;
reduced-motion preference disables shake. Control schema migration preserves existing preferences.


## ADR · Shared simulation for training

Accepted in v0.10.0. A serializable training session wraps the existing fixed-tick duel engine. The kernel has explicit training exceptions for clock/round resolution and a nonlethal HP floor; practice resource/health/cooldown assists are applied by the wrapper. Authored scenarios generate legal dummy inputs and observe real engine state/events to complete objectives. DOM/rendering never owns challenge success. The web adapter handles device-local completion IDs and displays current remapped bindings. Leaving Training creates a new ordinary match with no practice flags. See [TRAINING.md](TRAINING.md).

## ADR · Server-owned inventory and versioned releases

Accepted for v0.13. Inventory selection is immutable loadout data; runtime weapon slot, charges, selected item, poison coating, timed zones and Raijin markers live in the shared serializable simulation. The protocol accepts catalog IDs and action intentions only; clients cannot submit counts, effects or warp coordinates. Existing single-weapon fixtures remain compatible locally, while wire/rules versions intentionally change for online clients. Each new round reconstructs runtime inventory from validated loadouts.

Control visibility belongs to versioned device preferences, separate from combat state. It removes touch nodes and collision constraints, never the underlying keyboard action. Build-time version queries fingerprint the complete browser module graph so a fresh version does not combine new HTML with an old cached engine.

Version changes require curated notes and matching changelog/UI links. A trusted successful main-branch Pages deployment triggers idempotent GitHub Release publication; the job verifies the exact current main SHA and skips an already published version. Leaderboard identity/results storage, read-only spectators and compatible replay retention are tracked separately in issue #7.
