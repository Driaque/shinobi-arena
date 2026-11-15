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

Right-stick scrolling publication: PR https://github.com/Driaque/shinobi-arena/pull/61. Initial source head cca5e55dcf531f0aaf71da270a04c4430c6dd69d. Local verify passed: 356 tests and production build. Browser CI pending. User requested this control adjustment; prior project authorization covers publication, merge after CI, and Render-only deployment. Next: inspect PR #61 latest checks, resolve observed failures, merge and verify exact Render version/commit. Do not regenerate assets. If resuming after a completed merge, inspect main and /health instead of republishing the feature.

## Fight feel and sprite-only fighters, 2026-11-14

Branch feat/ui-css-audit at 2e6664c. Everything below is uncommitted working-tree work on top of the user's own staged CSS changes (apps/web/index.html, apps/web/styles.css, deleted styles-audit-improvements.css), which were not touched. Nothing was committed, pushed, merged or deployed. Version stays 0.40.0; no release notes, CHANGELOG entry or in-game link were changed because no version was bumped.

User request: play the game headlessly, make fighter art uniform (sprites only, no Canvas-style character models for released fighters) and leave a local build with considerably better feel.

### Completed
- Dynamic fight camera: packages/presentation/camera.js (fightCameraTarget, fightViewport, createFightCamera, cameraForScene). Closes in on exchanges, pulls back when fighters separate, keeps heads and floor in frame, never shows more than the base view. Fixed under reduced motion or the new Feel setting.
- Impact pause on hits and a held finishing blow: packages/presentation/impact.js (impactPauseMs, KO_HOLD_MS), wired in apps/web/main.js and apps/web/adventures.js. Offline modes only; online and co-op are unchanged. Engine and rules version untouched (duel-0.40.0, protocol 8).
- Real-time impact presentation in apps/web/renderer.js and apps/web/visual-lab-renderers.js: screen shake, zoom punch, hit sparks, additive sprite flash and jolt. HUD fades while an airborne fighter is behind it.
- Released fighters always render from sprite atlases; the fighter-style selector is gone and the procedural body is only a fallback when a sheet fails to load. The 25 unreleased rivals still use the procedural body because they have no sprite sheets.
- Feel settings "Dynamic fight camera" and "Impact pause on hits" in apps/web/experience.js (storage key shinobi.experience.v1).
- Repaired three truncated PNG exports that had been broken since e3f4ac1: apps/web/assets/painted-v1/stages/skyglass-1280.png, stages/forge-1600.png and portraits/rook-768.png; byte counts updated in apps/web/assets/painted-v1/manifest.json. Surviving original rows were kept and the missing rows were resampled from the neighbouring export of the same painting, so the lower part of each is softer than a true re-export from the master.
- Tests: new tests/fight-camera.test.js; tests/painted-art.test.mjs now walks PNG chunks and inflates image data so truncated exports fail; tests/practice-presentation.test.js updated for sprite-only scenes. Smoke scripts updated: scripts/navigation-helper.mjs (steadyTiming), aerial, practice-pixi, training, experience, fighter-art, global-pixi.

### Checks
- node scripts/check.mjs passes. node scripts/run-checks.mjs: 359 tests, 359 pass. node scripts/build.mjs: Static build dist/ v0.40.0.
- node scripts/check-release.mjs fails on this Windows checkout ("Write complete release notes for 0.40.0") because docs/releases/0.40.0.md is checked out with CRLF; same at HEAD, so npm run verify does not complete here.
- Browser suites run one at a time against the final build: 18 pass (gamepad, navigation, adventures, social, progression, discord, fighter-art, global-pixi, practice-pixi, visual-lab, character-league, training, online, dora, aerial, shield-scale, tactical-experience, tournaments). 6 fail with the same assertion as HEAD plus the staged CSS changes: painted-art (35 !== 10 roster count), browser (#roster-era option), inventory and startup-history (release-notes text), strategy-arena (expects duel-0.20.0), experience (stale move-name pattern). Those six were not changed by this work and still need fixing before a release.
- Headless play at 1280x720 and 844x390 on the Pixi and Canvas paths: no page errors; round result overlay appears after the finishing hold.

### Limits and open items
- Seven tracked truncated temp files remain under apps/web/assets/painted-v2 (ilyra, morwen, sevrin, tessara, vorrik -768.tmp.png, items/veilCanister-256.tmp.png, moves/horizonRush-256.tmp.png). Not referenced by the manifest; left for the user to delete.
- Stages are single flattened paintings without parallax layers. Sprite and stage art quality was not regenerated; that needs the art pipeline and masters.
- Arena canvas is short (about 365 px at 1280x720, 154 px at 844x390) because the control dock and HUD take the rest; fighters read small. Layout was left alone because of the user's in-progress CSS work.

### Next action and approval scope
User reviews the local build (node scripts/build.mjs, then node scripts/serve.mjs --port 4173). If accepted: commit, bump to 0.41.0 with docs/releases/0.41.0.md, CHANGELOG and in-game release-notes link, fix the six stale browser suites, run npm run verify on an LF checkout, then push and deploy to the shinobi-arena-online Render service only. No approval has been given yet for commit, push, PR or deployment.

## Painted weapons in hand and cleanup, 2026-11-15

Branch feat/fight-feel, created from 673bd10 and pushed to origin on 2026-11-15 at the user's request (feat/ui-css-audit with the dropped audit commit 2e6664c is left as it was). This section and the previous one are committed together on that branch. The user dropped the CSS audit work (2e6664c); their staged revert of it (apps/web/index.html, apps/web/styles.css, deleted styles-audit-improvements.css) is untouched, so the working tree equals 673bd10 plus this work. Not merged and not deployed; production is unchanged. Version stays 0.40.0.

User request: replace the line-drawn weapon animation, drop the CSS audit, delete what is unused or unreferenced, and advise on sprite-sheet and stage art generation and branching.

### Completed
- packages/presentation/weapons.js (new): WEAPON_ART (grip, tip, length, style per weapon), HAND_ANCHORS (leading hand per atlas fighter for poses 8, 9, 10, 11, measured on the sheets), cutoutBackground, weaponPoseFor, weaponSpriteFor, strikeArcFor. Presentation only; engine untouched (duel-0.40.0, protocol 8).
- Painted equipment icons (apps/web/assets/painted-v2/weapons/<id>-256.png) are cut out of their backdrop at load time in apps/web/practice-pixi.js and drawn as sprites in the fighter's hand by both labs in apps/web/visual-lab-renderers.js, with an additive slash trail on active frames, a thrust streak for the conduit spike, a spinning held disc and a painted orbit-disc projectile. Unarmed strikes get a tapered swoosh.
- packages/presentation/practice-scene.js passes weapon, arc and projectile sprite to the labs. apps/web/practice-effects.js no longer draws line weapons, the ellipse strike arc or the weapon-name label. The procedural body in apps/web/renderer.js (unreleased rivals and the load-failure fallback) still draws its own line weapons.
- Deleted: the seven truncated temp exports under apps/web/assets/painted-v2 (fighters ilyra, morwen, sevrin, tessara, vorrik -768.tmp.png, items/veilCanister-256.tmp.png, moves/horizonRush-256.tmp.png; the finished exports beside them are intact) and apps/web/roster-pixi.js, which nothing imported. scripts/build.mjs no longer bundles it and scripts/global-pixi-smoke.mjs asserts static roster portraits instead of aborting that module.
- docs/ORIGINAL_FIGHTER_ART.md documents weapons in hand and that HAND_ANCHORS must be re-measured when a sheet is regenerated.
- Tests: new tests/weapon-presentation.test.js.

### Checks
- node scripts/check.mjs passes. node scripts/run-checks.mjs: 364 tests, 364 pass. node scripts/build.mjs: Static build dist/ v0.40.0.
- Browser suites against the final build: the same 18 pass and the same 6 fail as in the previous section (painted-art, browser, inventory, startup-history, strategy-arena, experience); no new failures.
- Headless training-mode captures at 1280x720 for all seven weapons, an aerial cut, three fighters, and both the Pixi and Canvas paths: weapon sits in the hand in each phase, no page errors.
- node scripts/check-release.mjs still fails on this CRLF checkout, as before.

### Limits and open items
- One hand position per pose per fighter; the three attack poses still snap because each sheet has a single frame per phase. More frames need new sheets.
- Left in place although unused outside their module: packages/engine/items.js ITEM_ACTIONS (engine not touched) and several exported constants that are used internally.
- Arena canvas is still about 365 px tall at 1280x720; layout was not changed.
- Art masters are not in this checkout, so sprite and stage quality cannot be re-exported from here.

### Next action and approval scope
User tests the branch build locally and on a phone over the LAN (node scripts/build.mjs, then node scripts/serve.mjs --port 4173 --host 0.0.0.0). Approved so far: commit and push of this branch only. Not approved: PR, merge to main, version bump or Render deployment. Next work, on separate branches: item art and item-use animation, guard/shield identity, then sprite-sheet and stage art quality.

## Release 0.41.0 prepared: fight feel, sprite-only fighters, crest and items, 2026-11-15

Branch feat/items-guard-identity. It contains feat/fight-feel (baa8c21: the two sections above, now committed and pushed), the guard and item work (5fdb840) and a merge of origin/main at ec9cf11 (v0.40.1, PRs #58 to #61). The only merge conflict was this file; both histories are kept.

### Approval scope
On 2026-11-15 the user asked in the conversation to open a PR with all changes so far, merge it and deploy to Render. That covers: push of this branch, one PR to main, merge after CI passes, and the automatic Deploy Render run to the existing shinobi-arena-online service. Nothing goes to GitHub Pages. The GitHub CLI was not logged in and the GitHub MCP server failed to connect; the user chose to run gh auth login themselves.

### Completed in this step
- The Rival's Crest guard (packages/presentation/guard.js), the Rival's Mark hit spark (impactCuesFor in packages/presentation/impact.js) and painted item cues (packages/presentation/items.js) on shared shape helpers (packages/presentation/shapes.js). Drawn by apps/web/visual-lab-renderers.js in both the Canvas and Pixi labs; item art is loaded and cut out in apps/web/practice-pixi.js. The overlay in apps/web/renderer.js no longer draws smoke circles, the blast ring, the waypoint marker or the bomb timer text in sprite mode. Charge and ward restyled in apps/web/practice-effects.js.
- Sounds in apps/web/audio.js: toss, blast, warp, shatter; item actions no longer use the generic wind sound and a guard break plays once.
- Version 0.41.0: package.json, package-lock.json, docs/releases/0.41.0.md, CHANGELOG.md and the in-game release-notes link in apps/web/index.html.
- docs/ORIGINAL_FIGHTER_ART.md documents the guard, impact and item cues and what a new item needs.
- Tests: new tests/item-guard-presentation.test.js (13 tests). scripts/browser-smoke.mjs now waits for the third hit of the timed chain, because impact pauses land it slightly later in real time; the chain itself still connects with the pause on and off.

### Checks
- node scripts/check.mjs and node scripts/check-release.mjs pass (the new release notes are LF). node scripts/run-checks.mjs: 382 tests, 382 pass. node scripts/build.mjs: Static build dist/ v0.41.0.
- All 24 browser suites pass locally against the v0.41.0 build. The six suites that failed on the older branch base were fixed on main by 10a4de3 and pass after the merge.
- Headless captures of guard, parry, guard break, hits and all seven items on the Pixi and Canvas paths, plus training-mode play of the real build on both: no page errors.
- Not checked: the new sounds by ear, and physical phones or controllers.

### Limits
- Presentation only. Engine, rules version and online protocol are unchanged.
- Sprite and stage art were not regenerated; masters are not in this checkout. That work is planned for a separate branch.
- Unreleased preview rivals still use the procedural body and line-drawn weapons.

### Next action
Push, open the PR, wait for CI (Build and unit checks plus five browser groups), merge, watch Deploy Render, then confirm version 0.41.0 and the merge commit at https://shinobi-arena-online.onrender.com/health and that Release notes published v0.41.0. Do not call it live before /health matches. Record the PR number, merge commit and deployment result in the next checkpoint.

## Release 0.41.0 live on Render, 2026-11-15

### Result
- PR #64 (https://github.com/Driaque/shinobi-arena/pull/64) merged to main as 990339587d5df1dba9b8dae800cdb499572571b7 after all seven PR checks passed on f1cd0c5.
- CI on main: run 43686295765, success. Deploy Render: run 43686849692, success. Release notes: run 43686849661, success; GitHub Release v0.41.0 published 2026-11-15T06:46:39Z.
- https://shinobi-arena-online.onrender.com/health reports version 0.41.0 and commit 990339587d5df1dba9b8dae800cdb499572571b7. The previous production build was 0.40.1 at ec9cf11. Nothing was published to GitHub Pages.

### Stage paintings on phones
- Before this release, production served truncated stages/skyglass-1280.png (196,673 bytes; requested by screens up to 900px wide) and stages/forge-1600.png (1,638,729 bytes; wider screens). Neither decoded in a phone-sized headless Chromium.
- On 0.41.0 all ten stage exports the game can request (five stages at 1280 and 1600) decode fully from production in the same check.
- Not checked: a physical phone. If other stages fail to load on a device, that is a different cause.

### Limits
- The new sounds were not checked by ear, and physical phones and controllers were not checked.
- This checkpoint is on branch docs/checkpoint-0.41.0, not on main, so that a docs-only commit does not start another production deploy. Merge it with the next change.

### Next action
The user plays 0.41.0 on their phone and reports back. Sprite-sheet and stage art quality is planned on a separate branch; it needs the art masters and an image generator, neither of which is in this checkout.

## Sprite conversion and stage art

Source checkout docs/checkpoint-0.41.0 at bf1808c. User selected art generation and full sprite integration for the preview roster, plus battle stage art improvements. First generated source is art-source/fighters/vael-draft.png. The raw sheet needs frame cropping and alpha inspection before registration. The live sprite path currently gates fighters through settings.atlasFighters in packages/presentation/practice-scene.js. Next steps are to normalize and test Vael in battle, generate the rest of the roster against the painted portraits, switch fighter and stage rendering to bitmap assets, and verify the five stages and supported battle modes in a browser. No gameplay checks or deployment for this change yet. Current approval scope is local asset generation and integration.

### Option B integration checkpoint

Feature branch: feat/story-roster-sprite-atlas, based on bf1808c. The commit containing this entry has the complete checkpoint. The 35 roster slots are visible by default. The 24 fighters without combat atlases are shaded and selectable in development. The launch setting is data-story-locks="on" in apps/web/index.html. It uses encounter unlock metadata from packages/engine/story.js and device-local completed-encounter progress independent of the replay checkpoint. Northern Echoes currently assigns no preview unlocks. Vael uses apps/web/assets/fighter-sprites/vael.png, derived from art-source/fighters/vael-draft.png, with pose and weapon-grip metadata in packages/presentation. Both active arena backends fall back to painted arena art. Remaining preview fighters still use procedural bodies in development battles.

Checks: npm run verify passed with 382 tests and a static build. Chrome global graphics smoke passed in desktop and touch portrait layouts with all five stage selections, Vael's atlas, development silhouettes, the launch lock setting, and Canvas/WebGL switching. No chapter currently exercises an actual preview unlock. Next: assign unlocks as the new encounters land, finish fighter atlases in story order, refresh painted stages, and remove the remaining procedural fallback. Feature-branch push only. No version bump, PR, production deployment, or release was requested for this checkpoint.

### Expanded mobile touch viewport

Branch feat/story-roster-sprite-atlas, based on 64cd422. The commit containing this entry has the complete checkpoint. Expanded touch is the default when a coarse pointer is available and no controls preference is saved. Saved layouts continue to load. Settings > Controls > Placement selects Expanded touch, the below-arena dock, or a customizable overlay. The expanded preset puts movement and primary actions at the edges, moves equipment and techniques into the Kit, and raises the fight camera's floor line. Arena movement bounds are unchanged. No new assets were needed.

Verification: npm run verify passed with 382 tests and a fresh build. Chrome global graphics smoke passed with expanded portrait and landscape bounds, touch jump, item cycling, kit open/close and renderer recovery. Existing browser-smoke and gamepad-smoke passed against the saved dock and controller layouts. Screenshots are test-results/expanded-touch-390.png and test-results/expanded-touch-844.png. Real-device Safari was not exercised. Approval scope is feature-branch commit and push only. Next production action, if requested, is version/release preparation and verified Render deployment. No PR or deployment ID.

### v0.42.0 mobile test release preparation

User requested deployment to the existing Render production service for physical mobile testing. Feature branch feat/story-roster-sprite-atlas contains roster and expanded touch work through 323e0b5. Integrated main 8353ffac05ddcbf555836380657c53d9cc2e0cda (v0.41.1 online reconnection). Production baseline health matched that exact commit. Versioned notes are docs/releases/0.42.0.md. Approval scope covers verification, PR merge after passing checks, Render deployment through the existing workflow and the matching GitHub Release. Next action is verify and submit the PR. No deployment has started.
