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

## ADR 003 · Online networking is an experimental decision

Deferred. HTTP and persistent transports may support lobby/session traffic, but a transport alone
does not solve responsive fighting. Benchmark prediction/reconciliation and rollback using the same
fixed-step core. If server and client use different engine implementations, rule drift becomes a
major risk; prefer a shared simulation or prove cross-implementation parity with golden tests.
Replay/input logs alone do not prevent cheating. Online authority and result validation are separate requirements.

## ADR 004 · Keep games distinct

The eventual platform owns catalogue, identity, rooms, lifecycle and results. A fighting game owns
collision and combat rules. Another game owns its own board/scoring rules. Avoid one giant rules
engine that forces every game into fighting-game states. Add shared interfaces only after two working examples.

## Delivery boundaries

Today: static browser shell -> GitHub Pages. No backend or cloud credentials.
Later: separate backend delivery with infrastructure-as-code, short-lived cloud identity, integration tests,
staging verification and explicit production promotion. Do not place API secrets in a static build.


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
