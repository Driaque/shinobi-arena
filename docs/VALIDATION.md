# Playable duel validation · 0.2.0

Local validation on October 26, 2026:

- `npm run verify`: passed JavaScript syntax checks, 28 unit tests and static build.
- `npm run test:browser`: passed using Playwright 1.62.1 with an alternate local Chromium 153 binary.
  The standard browser download endpoint was unavailable in the workspace; CI installs Playwright's
  matching Chromium using its normal installer.
- Browser scenarios: keyboard movement and damage, frozen timer while paused, complete local match,
  next round, rematch/reset, CPU round completion, simultaneous touch movement+attack, individual
  finger release, touch cancellation, portrait input gate, landscape explicit resume, control bounds
  and at-least-48px touch targets at 844×390. No browser page errors were observed.
- Screenshots of desktop and landscape mobile were visually inspected locally.
- Tests cover action timing, one-hit swings, block chip, double KO, insufficient chakra, fireball/jump
  interactions, interruption, collision, round lifecycle, deterministic replay equivalence and computer play.
- Physical iPhone/Android checks remain pending. Chromium emulation is not a Safari compatibility claim.
- Hosted CI/deployment results for each commit are in the repository Actions tab.

Initial foundation GitHub CI passed before this change. No performance/scalability measurements or
online-play claims are made. Browser smoke automation does not replace interactive combat tuning.
