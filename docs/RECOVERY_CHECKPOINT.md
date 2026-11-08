# Fabled Rivals recovery checkpoint

Updated 2026-11-07.

## Scope and authorization

User asked to continue the interrupted Game Logo Design work, apply the remaining original character PNG portraits and arena artwork, save recovery checkpoints going forward, and publish updates only to the existing Render game. Source remains Driaque/shinobi-arena; GitHub Pages must receive no further updates.

## Recovered work

Branch: feat/painted-roster-stages. Recovered asset commit: e6d9f87454a62a56259770d18501d89a8eb15e4b.
Ten original portraits and five stages are already generated, exported and integrated. Do not regenerate them.
Production exports and source metadata: apps/web/assets/painted-v1/manifest.json.
Integration: packages/presentation/artwork.js, roster.js, stage-picker.js, renderer.js and visual-lab-renderers.js.
Local high-resolution masters: /workspace/scratch/dbab2c3e1dc7/art-masters (temporary; production exports are tracked in Git).
Recovered verification: 342 tests and build passed in previous chat; no verified saved browser result.

## Current integration

Merged current main efbd0e9 (controller menu cursor). Retained its v0.38.0 notes and moved artwork to v0.39.0. Retained both cursor CSS and painted portrait CSS. Removed Pages deploy workflow; release publishing now waits for Deploy Render.

## Current verification and blocker

Resume integration commit: 962770d6a430b6ff7ff4dcc15e919f5151ce0c3e.
Fresh npm run verify passed: 345 tests, zero failures, syntax/release checks and v0.39.0 build. Portrait contact sheet visually inspected.
Browser verification is incomplete: Playwright Chromium download returned truncated/non-ZIP data. The browser suites remain required in hosted CI before merge/deploy.

## Resumed delivery

Prior conversation clarification explicitly authorized GitHub source pushes solely for the existing Render deployment. Pages publishing remains removed. Do not regenerate recovered assets.

Integrated origin/fix/left-stick-menu-cursor (d36f180) to preserve the user's newer left-stick menu cursor and D-pad focus navigation. Artwork stays v0.39.0; retain v0.38.1 release history. Fresh checks and PR/browser CI pending.

## Next steps

Run fresh verification, push source branch, create artwork PR, complete hosted CI/browser checks, merge when passing, monitor Deploy Render, verify /health version and exact commit, confirm matching GitHub Release, record PR/deploy IDs here.

## Limits

Painted portraits and flattened arena scenery do not replace combat fighter animations or add collision geometry/parallax layers.

## Latest continuation result

Integrated controller navigation in 8b39d03. Fresh npm run verify: 346 tests pass; v0.39.0 build passes. Cloud-browser desktop check: all ten portrait PNGs and five arena preview PNGs load; selecting Dora and Sunken Court enters battle with #canvas[data-painted-stage=court]. Visually inspected roster, stage cards and live arena. Mobile/tablet automated browser suite remains pending CI. Fixed ambiguous stage-card selectors and live-canvas assertion in painted-art smoke test after direct browser evidence.

Source push was blocked again by automatic approval review: it classified publication to GitHub as unverified and did not recognize prior authorization. No alternate push route attempted. Explicit current user approval is needed to push to Driaque/shinobi-arena solely as Render source. No artwork PR or deployment created. Pages workflow remains deleted.

## Git authentication attempt

User explicitly approved source push, merge after successful checks, and Render-only deployment in this conversation. User completed GitHub CLI device authorization. The CLI token-polling request to https://api.github.com:443 was blocked by workspace network policy; gh auth status confirms no authenticated GitHub host. No token was stored. Do not claim authentication succeeded. User requested avoiding the Blob upload tool; do not resume Blob uploads. Existing committed artwork remains ready locally. Authentication requires an environment allowed to reach GitHub's API, or moving the prepared changes to an authenticated local checkout.

## Source uploaded and PR opened

User pushed the packaged branch successfully. PR #57: https://github.com/Driaque/shinobi-arena/pull/57. Head before conflict resolution: 252461569b1506c265e27519f29e526fff484d71. Merge current main 66438c57a989f7fa55b5b0fe8471ef3635bf61e4, preserving the artwork branch's v0.39.0 metadata and removed Pages workflow. Controller implementation matches main; merge resolution changes no runtime code. Publish merge commit through connected GitHub service without Blob uploads. CI/browser checks and Render deployment remain pending.

## Browser gate corrections

PR #57 head 68fc0c3 is mergeable and its build/unit CI passed. Reviewing the browser gates identified an obsolete original-roster animated-canvas assertion and an incorrect live-arena canvas selector. Update the roster assertion to verify decoded painted PNGs (including reduced motion) and inspect the visible practice renderer for painted-stage readiness. These are browser-test corrections; runtime artwork behavior is unchanged. Hosted CI must rerun before merge.

## Wide landscape scenery fix

Hosted artwork checks passed all four viewports and fallback; detailed fighter art passed. Screenshot inspection revealed dark side margins on the short/wide landscape camera. Expand painted scenery with its aspect ratio and combat ground anchor preserved to cover the visible camera in Canvas/Pixi/classic fallback. Add camera coverage/ground-anchor regression coverage. Scope original PNG assertion to Aren; optional hidden anime portraits still animate. Full CI/browser verification must rerun before release.

## Active original-world expansion, v0.40.0

Branch feat/painted-move-icons, based on released v0.39.0. User requested responsive painted move PNGs, then expanded scope to remove all first-party references to external ninja franchises and redesign the optional hidden roster, weapons and items. User chose elite, balanced future rivals, not higher PvP stats. Keep twenty-five unreleased original rivals behind Include unreleased rivals; retain core ten as default. Do not deploy before the complete naming/artwork update is reviewable. No Blob tool uploads.

Current source has original names/IDs, 25 original future identities/lore/appearance briefs, a neutral articulated future-body renderer, optional roster toggle, responsive art UI and one-way saved-loadout migration. Protocol 8 / duel-0.40.0. Updated historical help/release text in the working tree; Git history is not rewritten.

Generated masters: /workspace/scratch/51863306bb15/move-masters (9), equipment-masters (14), future-masters (8 so far). Existing masters must be reused. Responsive exports and metadata: apps/web/assets/painted-v2/manifest.json; exporter scripts/export-original-world-art.py. Every final master has a unique semantic brief in docs/move-art-briefs.json or future-fighters.js. Outstanding: 55 move masters and 17 future portraits, complete export/visual QA, browser checks and clean first-party reference scan. Code changes are not deployed.

### Consumable artwork validation, 2026-11-07
All seven consumables and seven weapons have distinct painted PNG masters and 64/128/256 exports. Added catalog-to-manifest tests checking PNG signatures, physical dimensions, exact byte counts and responsive source sets. These caught an empty spikeCapsule-256.png, now rebuilt from its master. Full verify passes with 349 tests and static v0.40.0 build. Source/docs/scripts/tests scan for franchise-specific names returned zero matches. Visual contact sheet reviewed for all seven items. Larger move/future-roster art batch remains incomplete (17/64 moves, 8/25 future portraits), so this branch is not ready for production. No deployment performed. Latest eight completed move masters exported from saved files; do not regenerate those assets.

### Full original-world artwork completion, 2026-11-07
Generated the remaining 47 move and 17 future-fighter masters using built-in image generation, one distinct asset per call. Masters preserved at /workspace/scratch/51863306bb15/{move-masters,future-masters,equipment-masters}. Complete exports now cover 64 moves, 7 weapons, 7 consumables and 25 future portraits, 309 PNG variants totaling 44.01 MiB. Exporter now validates temporary PNGs before atomic replacement. All 309 exports decoded and dimensions/bytes verified. Contact sheets visually reviewed for all 64 moves and 25 future rivals. Full npm run verify passed (351 tests), v0.40.0 static build passed. Canonical art briefs and roster-plan IDs regenerated from runtime catalogs. Franchise-term scan across source/docs/scripts/tests returned zero matches.
Desktop cloud-browser QA at http://terminal.local:4173 confirmed toggle switches core10 to35, new move icons display, and all seven consumable images load. Startup required Play offline because this local preview has no online backend. Full hosted browser suite and mobile/tablet visual QA still pending. No production deployment, merge or release performed. Next: push artwork branch, run hosted browser gates and address failures before any deployment. Source repository remains Driaque/shinobi-arena, sole production host remains shinobi-arena-online Render. No Blob uploads used.

## Local two-controller selection update

Branch: fix/player-controller-selection, based on e3f4ac1 (v0.39.0 artwork).
Scope: pad 1 edits only P1 and pad 2 only P2 in local versus with a second controller; independent cursors/focus, owned shared equipment dialogs, vertical/horizontal cursor-edge list scrolling. P1 controls shared stage/start actions. Editor remains one shared modal, not simultaneous two-player equipment editors. User also explicitly requested cursor auto-scrolling through character and other lists.
Files: controller-ui.js, controller-cursor.js, loadouts.js, styles.css, packages/input/setup-ownership.js, ownership tests and gamepad browser suite. Version v0.39.1.
Verification: 350 unit/integration tests and build passed locally; browser CI pending. Physical two-pad test pending. Render-only deployment policy retained.
Next: publish branch/PR, run browser CI, merge after passing checks and verify exact deployed version/commit on Render /health. No PR or deployment created yet for this update. Approval scope: requested implementation; existing project approvals cover push, merge and Render-only deployment, subject to native tool approval review.

Publishing outcome: automatic approval review rejected create_tree upload to Driaque/shinobi-arena, requiring explicit current authorization for this update's source publication. Remote branch fix/player-controller-selection was created at e3f4ac1 but contains no update commit yet. All source changes and tests are saved in the local branch. Final verification: 350 tests and build passed; browser CI has not run. Next approval must cover upload to Driaque/shinobi-arena, PR, merge after CI, and deployment only to the existing Render service. Do not regenerate artwork or repeat previous design work.

Current authorization: user explicitly approved uploading this update, opening its PR, merging after successful CI, and deploying to Render only. Publication is now in progress. Read the final branch/PR state before resuming; earlier upload rejection is historical.

Published PR: https://github.com/Driaque/shinobi-arena/pull/58 (fix/player-controller-selection). Initial source head: 25bb5998444e7578bf90dd23a08f40aa718dda42. Browser CI pending. Next: inspect PR #58 checks, fix any observed failure, merge approved work after success and verify v0.39.1 plus exact merged commit at the existing Render /health. No further approval is needed for that approved scope unless native approval review rejects an action.

## PR #60 conflict resolution
Merged origin/main d007b0960c14d74c1fcdd1543275acb6a4adc221 into feat/painted-move-icons (original head 673bd1078f8567be079d7eef103fcc4cfafa5abe). Kept v0.40.0 original-world artwork and release/help text; retained v0.39.1 controller ownership, scrolling, tests and release history. User authorized resolving and publishing the conflict fix. npm run verify passed: 354 tests and v0.40.0 build; git diff --cached --check passed. Local browser smoke blocked by missing Chromium and corrupt download response; hosted browser CI must pass before merge. This action does not merge PR #60 or deploy. Next: inspect CI and mergeability at https://github.com/Driaque/shinobi-arena/pull/60.

PR #60 deployment authorized by user. Hosted browser gates exposed stale renamed roster filter, hidden-portrait count, move labels and replay rules assertions. Corrected those checks and Future filter disabled-state logic; 354 tests/build passed. Hosted CI must rerun. Render workspace selection awaiting confirmation of My Workspace (tea-dbgua0etlv9c73ddk47g). No merge/deployment yet.

## Right-stick menu scrolling update

Branch: fix/right-stick-menu-scroll, based on c88fd3342dba51999c356c4b2df9470b4d901f14 (v0.40.0). Version v0.40.1.
User requested right analog scrolling. Left stick remains cursor-only; D-pad remains focus navigation. Right stick scrolls the hovered list or focused control's container on both axes, preserving per-pad ownership. Cursor-edge scrolling removed. Combat aiming unchanged.
Files: controller-cursor.js, controller-ui.js, packages/input/cursor.js, cursor tests and gamepad browser suite. No art regenerated.
Checks: local verify pending final result; browser CI pending. Next: publish branch/PR, verify CI, merge within approved project scope and confirm exact Render /health version/commit. Render-only policy retained. PR/deployment IDs not yet assigned.
