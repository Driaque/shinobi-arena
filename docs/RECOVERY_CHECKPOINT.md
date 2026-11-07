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

## Completed production delivery, 2026-11-07

PR #57 merged as e3f4ac146a32cb8138900e56d3d893fd124445f3 (v0.39.0). PR CI run 42419780937 and main CI run 42420335924 passed every group. 347 unit/integration tests and build passed; browser coverage includes all ten portrait PNGs, five stages, four viewports, image-failure fallback, Canvas/Pixi, controller/touch/gameplay suites. Final landscape evidence visually confirms no background side margins.

Deploy Render workflow 42420872649 completed successfully. /health confirmed ok=true, storageHealthy=true, version=0.39.0 and commit=e3f4ac146a32cb8138900e56d3d893fd124445f3. Live manifest contains ten portraits/five stages; sampled Silent portrait and Sunken Court PNG bytes match tested files. Production remains exclusively https://shinobi-arena-online.onrender.com.

GitHub release https://github.com/Driaque/shinobi-arena/releases/tag/v0.39.0 published and visually verified against exact commit e3f4ac1. Used the signed-in GitHub website because the connector lacks release creation. Existing release automation incorrectly selects a later skipped Deploy Render run instead of the earlier successful deployment; this release was published manually after independent CI/health verification. That automation defect remains for a focused future fix.

This final checkpoint is saved on the already-merged feature branch without changing main or triggering another production deployment. No further artwork generation or deployment is needed for this update.
