# Project plan · draft 1

Date: October 26, 2026. Working name: Shinobi Arena. Owner: Daniel.

## Current delivery status

Playable local duel and baseline computer opponent are implemented, including specials, rounds,
procedural art, landscape controls and browser smoke checks. M1 keyboard remapping and M2 asset/audio
work remain pending. M3 physical-device validation is pending. No online features are implemented.
See README and COMBAT_RULES for current behaviour.

## Product

A browser fighter with character selection, responsive movement, character-specific attacks,
and complete rounds. Players use a keyboard on desktop and two-thumb controls with the phone
held sideways on mobile. Initial Naruto/Sasuke move concepts are design examples, not bundled content.

Longer-term: a catalogue of games with shared identity, sessions, results, and invitations.
Each game owns its mechanics and victory conditions. Build the fighter before generalizing.

## Decisions and assumptions

- Real-time side-view 2D combat, not turn-based combat.
- Milestone 1 playable mode: two players on one desktop, with rebindable, non-overlapping controls.
- First solo/mobile release includes player vs computer. A single phone controls one fighter.
- Mobile online PvP follows networking validation; two people do not share the same phone.
- No accounts required for local or practice play.
- Default match proposal: 90-second rounds, first to two round wins.
- Knockout: HP reaches zero; double knockout draws. Timeout: higher remaining HP wins;
  equal HP draws. Initial fighters have equal max HP. Drawn rounds do not award a win.
- Combat supports left/right, jump, basic attack, block, and two specials.
- Proposed examples: Naruto (combo, Rasengan, clone strike), Sasuke (combo, Chidori, fireball).
- Specials cost chakra. Exact numbers and regeneration rules are tuning decisions, not established requirements.
- One stage, fixed camera first; no destructible scenery, airborne combos, or transformations initially.
- Performance budgets below are targets to measure, not current results.

## Milestones

### M0 · Foundation — this delivery

Scaffold, plan, landscape control lab, unit tests, lockfile, CI/CD definitions.
Done when local `npm run verify` passes and setup blockers are documented.
Remote repository: https://github.com/Driaque/shinobi-arena. Hosted CI and deployment status are tracked in GitHub Actions.

### M1 · Playable desktop duel

Fixed-step simulation, walking/jumping/facing, grounded collisions, two placeholder fighters,
basic attack, block, HP, timer, rounds, rematch, keyboard remapping.
Attack phases are startup, active, recovery; damage uses hitboxes against hurtboxes.
A single swing cannot repeatedly damage the same opponent every tick.
Both fighters' same-tick hits resolve under a documented simultaneous-hit policy.

Acceptance: two people finish a match; no movement through arena boundaries; block and hitstun
have tested rules; refreshing starts a new local session; rules reject actions during recovery.

### M2 · Character identity and solo play

Character selection, two distinct specials per fighter, chakra, effects, animation and audio;
practice mode and a basic computer opponent using the same input contract as people.
AI observes legal game state and uses explicit reaction delays; no hidden boosts.

Acceptance: visitor completes player-vs-computer match; specials cannot spend unavailable chakra;
restart and replay work; original/authorized assets replace placeholders before claiming polished art.

### M3 · Landscape mobile release

Carry the control layout from M0 into gameplay. Add configurable button size/spacing and safe-area support.
Implement portrait pause/resume, multi-touch, pointer cancellation and interrupted-session behaviour.

Acceptance: test on a physical iPhone in Safari and Android in Chrome, in both landscape directions.
Hold movement and attack with two fingers, slide off buttons, interrupt with a system gesture,
rotate twice, switch apps and return. No held action survives interruption. Resuming requires intent.
Local matches pause while hidden or portrait. Online matches later keep server time running.

### M4 · Online feasibility and private PvP

Before committing architecture, build a two-client network spike with simulated latency/jitter/loss.
Compare authoritative-server prediction/reconciliation with deterministic rollback.
Record fairness, input latency, correction behaviour and hosting cost. Select one approach in an ADR.
Then add invite rooms, version negotiation, match ownership, reconnect policy, rate limits and results.

Acceptance: two devices finish matches without divergent authoritative results; retries don't duplicate
actions; disconnect rules and expired reconnects are visible; stale or forged actions are rejected.
Demonstrate at 50/100/150 ms RTT test profiles and publish observations, including limitations.
Never accept client-supplied damage, HP or victory as authoritative.

### M5 · Portfolio release

Input-recorded replays tied to simulation/rules versions, debug hitbox overlay, performance overlay,
accessibility/settings pass, CI browser tests, device evidence, architecture case study and release notes.
Publish measured results, not assumed scalability. Provide a no-login solo demo for reviewers.

### M6 · Platform proof

Add a second game with a different scoring model. Extract shared session/result/catalogue services
only where both games need them. Demonstrate another developer adding a character or trusted game module
without changing platform identity/session code. No arbitrary uploaded executable code initially.

## Quality targets

- Simulation: 60 fixed ticks per second, independent of render frequency.
- Rendering: target smooth 60 fps on an explicitly named representative mobile device;
  measure p95 frame time, long frames, memory and battery/thermal behaviour.
- Bound simulation catch-up to prevent a hidden tab from causing an update spiral.
- Control targets at least 48 CSS px with adjustable spacing; do not disable page zoom globally.
- Don't hide essential information using colour alone; respect reduced motion for UI effects.
- Unit tests for state transitions and invariants; integration tests for rounds and replay equivalence.
- Browser tests for desktop and mobile input; physical-device checks before mobile release.

## Risks and scope controls

Art/animation production and combat feel are major workstreams. Start with placeholders and one
move before expanding. Local two-player control support does not establish online feasibility.
Do not add rankings, monetization, tournaments, chat, or Kubernetes to the initial release.
Estimate calendar dates after M1 reveals asset and implementation effort.
