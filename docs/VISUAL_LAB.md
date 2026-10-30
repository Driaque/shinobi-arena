# Fabled Rivals Visual Lab

An opt-in rendering experiment at `/visual-lab.html`, linked below the main game. It uses the existing free-practice combat engine, with original display fighter Aren and a mirror sparring echo. Aren is a visual stand-in for existing sword rules, not a new online character.

## Architecture

- `packages/presentation/visual-lab.js`: local practice setup, deterministic input timeline, atlas views and pure render-scene projection. It never modifies authoritative combat state while sampling visuals.
- `apps/web/visual-lab-renderers.js`: Canvas 2D and PixiJS 8.22.0/WebGL renderers consume the same scene. Sprites retain aspect ratio; a shared camera fits air movement. GPU textures and pooled sprites are reused across frames; each renderer has explicit teardown.
- `apps/web/visual-lab.js`: a fixed 60 Hz simulation driven by requestAnimationFrame; keyboard/multi-pointer controls, analog gestures, pause/reset, lifecycle handling, benchmarking and local export. Neither path waits for a server.
- `scripts/build.mjs`: esbuild bundles PixiJS into the lab entry only. No runtime CDN requests or third-party asset fetches. Browser HTML references are versioned. The existing main game keeps its renderer.

## Measurement protocol

The comparison warms up each renderer for 30 rendered frames, resets practice, then plays exactly 300 simulation ticks at 60 Hz using the same scripted inputs. Canvas runs first, then PixiJS. The scene, art, resolution and effect settings are shared. Use repeated runs on a physical device; ordering, JIT compilation, browser scheduling and thermal state can affect results.

Reported frame p95 is requestAnimationFrame interval. CPU render p95 measures the synchronous JavaScript render call; it does not wait for GPU completion. Input-to-render submission measures event handling through the next render call, not display presentation. JS heap, where available, excludes GPU memory and is an approximate browser-specific estimate. Benchmarking suppresses optional audio. Exports contain browser/device metadata and local timings; they are not uploaded.

Automated tests use Chromium with software WebGL and landscape mobile emulation. They validate functionality and exercise the measurement/export path; physical iPhone Safari speed, thermals and memory need testing on the user's phone. No speedup is assumed.

## Art and provenance

Built-in image generation produced the original concept assets; no existing anime character was requested. PNG masters were encoded to WebP without resizing for runtime delivery. The atlas has sixteen key poses, not a finished skeletal rig or a full production animation library.

- `apps/web/assets/visual-lab/aren-atlas.webp`: 1254 × 1254, transparent. Original dark-skinned athletic fighter, short ivory locs, teal split coat, charcoal clothing, brass armor and a curved sword. Sixteen side-facing poses: idle/breathing, run steps, dash, jump rise/fall, sword anticipation/strike/follow-through, aerial strike, crouch guard, hit reaction, awakening and elemental palm thrust. Atlas crop rectangles and body origins are explicit so pose changes do not stretch the figure.
- `apps/web/assets/visual-lab/skyglass-terrace.webp`: 1672 × 941. Original stone dueling terrace at blue hour, mountain citadel, brass/stone architecture, suspended bridges, waterfalls, cloud chasms, teal lanterns and warm sunset. Open foreground and no characters, words or recognizable existing anime insignia.

Generation prompts requested polished hand-painted anime game assets, consistent costume/proportions, full figures, transparent atlas background and an open side-on battlefield. The built-in image generation tool was used for both assets; the prompts' production requests are summarized above. Art remains concept material for iteration. Exact prompts and runtime asset paths are preserved in [VISUAL_LAB_ART_PROMPTS.md](VISUAL_LAB_ART_PROMPTS.md).

PixiJS and bundled dependencies retain their upstream license notices. The build publishes the PixiJS MIT license at `/third-party/pixi.js-LICENSE.txt` and bundled dependency notices at `/third-party/visual-lab-NOTICES.txt`.

## Initial automated timing observation

The local Chromium software-WebGL run recorded about 16.7 ms frame p95 for Canvas and 33.4 ms for PixiJS on this scene, with CPU submission p95 around 0.3 ms and 1.0 ms respectively. This run does not demonstrate a PixiJS speedup. It is not a hardware GPU or iPhone benchmark; both rendering modes remain available pending physical-device evaluation.
