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
