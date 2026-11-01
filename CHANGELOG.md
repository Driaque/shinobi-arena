# Release notes

## 0.29.1
- Add Discord's required application User-Agent header to server-side OAuth requests.
- Add redacted provider-stage diagnostics and isolate disabled OAuth tests from production configuration. Real provider authorization remains under verification. [Release notes](docs/releases/0.29.1.md).

## 0.29.0

- Add Discord sign-in and explicit guest-profile linking, cross-device game sessions and device logout. Conflicting profiles are never merged automatically.
- Add Profile / sign in entry point and private linked-account details. Production activation requires a configured Discord developer application. [Release notes](docs/releases/0.29.0.md).

## 0.28.3

- Make matchmaking cancelable during profile loading, ignore stale attempts, share concurrent profile requests and restore controls after connection failures.
- Bound the complete connection attempt and clear stale latency readings. [Release notes](docs/releases/0.28.3.md).

## 0.28.2

- Prepare CI-gated, commit-pinned Render deployment with live health/version verification. Activation requires the repository deploy-hook secret.
- Health responses include release version and Render commit. [Release notes](docs/releases/0.28.2.md).

## 0.28.1

- Remove painted-pose crossfades in PixiJS and Canvas to prevent doubled limbs and translucent fighters during running and attacks. Hold a stable idle silhouette with subtle breathing.
- Record the prioritized quality, Discord identity, friend-play and mastery roadmap as planned work. [Release notes](docs/releases/0.28.1.md).

## 0.28.0

- Add detailed painted 16-pose combat sheets for all ten original fighters, including refreshed Aren artwork, across the main Pixi/Canvas presentation.
- Load selected artwork independently, preserve existing bodies on image failure, and support retry and texture cleanup without resetting fights.
- Correct same-tick Player 2 model refreshes; preserve animated character-selection thumbnails. [Release notes](docs/releases/0.28.0.md).

## 0.27.1

- Animate character-selection thumbnails with shared PixiJS rendering, breathing, gentle sway, colored motes and lightning accents for Winta and Kael. Hover, focus and selection strengthen the effects.
- Pause hidden portraits, honor reduced motion and decorative-effects settings, and retain static portraits if graphics are unavailable. [Release notes](docs/releases/0.27.1.md).

## 0.27.0

- Enable PixiJS scenery, fields and projectiles in every battle mode, live spectating and archived replay playback; preserve selected fighter identities and add a global Canvas choice/fallback/retry.
- Add ten original rivals with distinct kits, silhouettes and connected Skyglass lore. Aren is playable; Silent, Winta and Dora retain their established mechanics. Default selection is Aren vs Winta.
- Hide the 25 anime prototype fighters unless Include Naruto / Boruto fighters is checked. Stories are available in the character kit panel.
- Confirm Silent/Winta as blood brothers, expand character grid height and compact post-fight tips with expandable match stats.
- Protocol 7 requires old clients to refresh; existing combat rules, replay schema, results and rewards remain unchanged. [Release notes](docs/releases/0.27.0.md).

## 0.26.0

- Support portrait without pausing, an orientation gate or forced landscape fullscreen; recommend landscape and keep active touch fights in a stable viewport.
- Add a separate saved portrait control layout, full-field native selects and label activation. Suppress rapid-tap zoom on the fight surface while preserving menu scrolling and browser zoom elsewhere.
- Smooth Aren pose transitions and root motion without stretching artwork or changing rules. Render elemental fields, guard shields and hit rings in the Practice backend; retain weapon/projectile/text compatibility cues.
- [Release notes](docs/releases/0.26.0.md).

## 0.25.0

- Integrate the Aren appearance and Skyglass Terrace into main-game Practice with persisted Canvas/PixiJS settings and state-preserving switching.
- Keep existing loadouts, controls and combat cues; add lazy loading, Canvas fallback, recoverable graphics retry and cleanup outside Practice. Ranked/CPU/local battles and replay viewing retain their existing renderer.

## 0.24.0

- Add an opt-in PixiJS Visual Lab with original Aren sprites and Skyglass Terrace artwork, the existing combat engine, touch/keyboard practice and a real five-hit aerial showcase.
- Compare Canvas 2D and WebGL against the same scene, with device-local measurements, resolution controls, reduced motion and Canvas fallback. The main game renderer and online rules remain unchanged.

## 0.23.0

- Rebrand the game as Fabled Rivals across the splash, header, online arena, browser metadata, FR monogram/favicon and current release publishing.
- Keep existing profile/settings storage keys, service addresses, repository and historical notes compatible. The original-roster rollout and dedicated domain remain pending.

## 0.22.1

- Remove the personal GitHub Pages launch banner, splash/footer links and canonical address. Preserve the branded splash, current browser profiles, tournament podiums and stable result polling.

## 0.22.0

- Completed tournaments show a champion, first runner-up and shared second runners-up when no bronze match was played.
- Tournament polling checks for updates without rebuilding the results view; readers choose when to refresh.
- Canonical play links and a direct-backend reminder point to the static splash-first entry without redirecting or migrating private profiles.

## 0.21.1

- Publish the exact successful main CI artifact to Pages, with trusted-event and current-commit checks, instead of repeating browser tests during publishing.

- Normalize tournament round scores and damage by player identity, enforce benchmark starting sides and recover existing pilot scorelines from immutable match records.

## 0.21.0

- Eight-entrant AI character benchmark: 28 round-robin matches, balanced sides, live league standings and seeded quarterfinals, semifinals and final. Benchmark outcomes are separate from player statistics, Elo and rewards.
- Persistent character assignments and server-derived standings; direct replay buttons on completed tournament pairings.


## 0.20.0

Toggleable Practice hints, 64 shared jutsu pictograms and compact mobile icon controls. Persistent player-created tournaments with signups, bracket battles, automatic progression, points and exclusive balanced equipment variants. [Release notes](docs/releases/0.20.0.md).

## 0.19.0

Expanded arena, proportionate smaller fighters, tactical jutsu routes and strategy advisor, named builds, bounded rated-match meta statistics, comfort/aiming settings, coaching, recorded Practice and replay takeover, plus optional reconciled online movement prediction. [Release notes](docs/releases/0.19.0.md).

## 0.18.0

Fix movement blend lag; add depth movement, visible equipped jutsus/Charge/Crouch, larger detailed fighters, Akatsuki roster additions original music/layered combat audio, startup readiness splash and browsable release history. [Release notes](docs/releases/0.18.0.md).

## 0.17.0

Held crouch guards survive blocked-hit recovery; explicit low-guard HUD and mobile two-finger support. Fighters and corresponding body collisions are 12% smaller, preserving old replay scale. [Release notes](docs/releases/0.17.0.md).

## 0.16.0

Launcher jump cancels, aerial basic strings, four aerial strategy techniques, bounded juggles, smoother air steering and visual interpolation. Detailed fighter poses and Moonlit Shrine scenery. [Release notes](docs/releases/0.16.0.md).

## 0.15.1

Isolate test processes from hosted database credentials and store live arena data in a dedicated PostgreSQL schema. Includes all v0.15 strategy, ranking, spectator and replay features. [Release notes](docs/releases/0.15.1.md).

## 0.15.0

Strategy loadout grids (54 jutsus, seven slots), elemental ground effects and status tactics, active chakra recovery, persistent Elo profiles/results, read-only spectating and versioned replay playback. [Full release notes](docs/releases/0.15.0.md).

## 0.14.0

Dora — AquaPrincess: playable original fighter, bladed fans, water weaken, wind pull and fire finisher, Triune Flow counters, Limit Release, regal concept portrait and online support. [Full release notes](docs/releases/0.14.0.md).

## 0.13.0

Two-weapon loadouts, four one-use consumable slots, tactical tools including Flying Raijin kunai, per-control visibility settings and automatic GitHub release notes.

Full notes: [v0.13.0](docs/releases/0.13.0.md).

Future version updates must include `docs/releases/<version>.md`. CI checks for that file; the Release workflow publishes it after verified deployment.
