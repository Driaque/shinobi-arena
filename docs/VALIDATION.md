# Playable duel validation · 0.6.0

Local validation on October 26, 2026:

- `npm run verify`: passed JavaScript syntax checks, 70 unit tests and static build.
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

