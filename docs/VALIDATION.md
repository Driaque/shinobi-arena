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
