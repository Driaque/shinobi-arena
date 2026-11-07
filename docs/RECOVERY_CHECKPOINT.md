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

## Local two-controller selection update

Branch: fix/player-controller-selection, based on e3f4ac1 (v0.39.0 artwork).
Scope: pad 1 edits only P1 and pad 2 only P2 in local versus with a second controller; independent cursors/focus, owned shared equipment dialogs, vertical/horizontal cursor-edge list scrolling. P1 controls shared stage/start actions. Editor remains one shared modal, not simultaneous two-player equipment editors. User also explicitly requested cursor auto-scrolling through character and other lists.
Files: controller-ui.js, controller-cursor.js, loadouts.js, styles.css, packages/input/setup-ownership.js, ownership tests and gamepad browser suite. Version v0.39.1.
Verification: 350 unit/integration tests and build passed locally; browser CI pending. Physical two-pad test pending. Render-only deployment policy retained.
Next: publish branch/PR, run browser CI, merge after passing checks and verify exact deployed version/commit on Render /health. No PR or deployment created yet for this update. Approval scope: requested implementation; existing project approvals cover push, merge and Render-only deployment, subject to native tool approval review.

Publishing outcome: automatic approval review rejected create_tree upload to Driaque/shinobi-arena, requiring explicit current authorization for this update's source publication. Remote branch fix/player-controller-selection was created at e3f4ac1 but contains no update commit yet. All source changes and tests are saved in the local branch. Final verification: 350 tests and build passed; browser CI has not run. Next approval must cover upload to Driaque/shinobi-arena, PR, merge after CI, and deployment only to the existing Render service. Do not regenerate artwork or repeat previous design work.

Current authorization: user explicitly approved uploading this update, opening its PR, merging after successful CI, and deploying to Render only. Publication is now in progress. Read the final branch/PR state before resuming; earlier upload rejection is historical.

Published PR: https://github.com/Driaque/shinobi-arena/pull/58 (fix/player-controller-selection). Initial source head: 25bb5998444e7578bf90dd23a08f40aa718dda42. Browser CI pending. Next: inspect PR #58 checks, fix any observed failure, merge approved work after success and verify v0.39.1 plus exact merged commit at the existing Render /health. No further approval is needed for that approved scope unless native approval review rejects an action.
