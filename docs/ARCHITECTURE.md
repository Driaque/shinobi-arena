# Architecture decisions

## ADR 001 · Local-first browser fighter

Accepted for the foundation. Native browser modules keep M0 reproducible without a package registry.
This is a scaffold decision, not a claim that a complete game needs no libraries.
Evaluate Canvas 2D directly versus a rendering library during M1; a renderer must not own combat rules.
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
