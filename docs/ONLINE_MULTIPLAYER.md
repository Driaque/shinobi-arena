# Online multiplayer (v0.12)

Choose **Online Matchmaking**, enter a 2–20 character display name, and select your own fighter and weapon. Find opponent joins a FIFO queue. The next available player starts a shared match after a three-second countdown. Both players use the normal P1 keys or mobile analog/action controls on their own device; the second connection controls the right-side P2 fighter. The HUD identifies your slot and shows both player names and fighters.

Cancel search leaves the queue. Leave match, changing modes, or a dropped connection forfeits an active match. Both players press Ready for next round. At match completion each player returns to matchmaking independently. Names are unverified labels, not accounts or reserved identities.

## Run locally

Use Node 22 or later:

```sh
npm ci
npm run verify
npm start
```

Open `http://localhost:4175` in two browsers. To test on phones on the same network, use the machine's LAN address and port 4175. The server binds `0.0.0.0` and serves the built game plus `/ws`. `PORT` is configurable. Two players must use the same server. `npm run dev` continues to serve the static client alone.

## Live service

- Game and server: https://shinobi-arena-online.onrender.com
- Existing client: https://driaque.github.io/shinobi-arena/ (default server in `apps/web/online-config.json`).
- One free Node service in Ohio, named `shinobi-arena-online`, created in the confirmed Render workspace through the Render connector. Live configuration currently deploys on commits and uses Render's default TCP health probe. The `/health` HTTP endpoint is also available for direct readiness checks.
- Both players enter Online Matchmaking, choose names and loadouts, and Find opponent. They can be on different networks. Matchmaking pairs the first two waiting players; it does not reserve a private brother/friend room.

## Deploy

GitHub Pages only hosts the client. It cannot run the Node/WebSocket match server. The repository includes `render.yaml` for one Node web service: import this repository as a Render Blueprint, select its region, and deploy. The service runs `npm ci && npm run verify`, then `npm start`; `/health` is the health check. `autoDeployTrigger: checksPass` requests checks-gated updates when provisioning through this Blueprint. The existing connector-created service uses on-commit deployment; the Blueprint is a reproducible template, not its active policy. The service also serves the whole game, automatically using its own WebSocket endpoint. No separate frontend configuration is needed when playing at the server's URL.

The checked-in `apps/web/online-config.json` supplies the default server. To override it for GitHub Pages, set the repository **Actions variable** `ONLINE_SERVER_URL` to `https://YOUR-SERVICE.onrender.com`, then rerun Deploy Pages. The build writes `online-config.json`; the client converts the address to secure WebSocket `/ws`. You can instead enter the server address under Server connection in the lobby. Do not put credentials in the URL. `ALLOWED_ORIGINS` accepts comma-separated frontend origins and defaults to `https://driaque.github.io`; the server's own origin is also accepted. HTTPS pages require WSS.

Render's free service can sleep when idle; a cold start may exceed the client's 15-second connection timeout. Retry once the service is awake. An always-on service is preferable for regular play. Check current hosting terms before choosing a plan. Deployment restarts disconnect current matches; queues and matches live in memory, so they do not survive a restart.

## Protocol and ownership

- `hello` checks protocol and engine rules version; `join` validates the name and catalog loadout.
- The client sends explicit cancellation and waits for the prior WebSocket close acknowledgement before rejoining; this prevents self-pairing with a stale queue entry on slow networks.
- `queued` reports position; `matched` assigns slot, opponent profiles and initial state.
- The server advances the existing engine at 60 Hz. Clients send sequenced, whitelisted input at up to 60 Hz. The server sends full authoritative snapshots at 20 Hz. HP, stamina, cooldowns, hit confirmation, round scores, and time all belong to the server. Client-supplied HP, positions and time are ignored.
- One-shot input edges are consumed once. An eight-packet bound limits queued inputs; sequence numbers reject old/duplicate packets. Input stops after 30 ticks without a fresh packet. WebSocket ping/pong detects lost peers. Client timeout also detects a silent server.
- Both clients acknowledge round changes. Completed rooms close automatically; inactive result rooms expire after two minutes.
- WebSocket origin checks, 4 KiB message limits, 180 messages/second, connection/match caps, slow-client backpressure, handshake deadlines and heartbeat cleanup bound a single process. These limits do not replace service-level abuse protection.

## Current limits

This is an unranked online prototype: one process, maximum 200 connections and 80 concurrent rooms; these are safety caps, not measured capacity promises. Keep one instance: multiple replicas need shared matchmaking and explicit match ownership/routing. There is no account authentication, rating system, reconnect/resume, private invite, spectator mode or cross-region routing yet. New names do not prove identity; similarly named players are permitted.

The client renders authoritative snapshots without prediction, interpolation or rollback. Latency and jitter affect control responsiveness. Opening controls, going to portrait or switching tabs clears local input but does not pause the opponent's match. Server restart and disconnect finish the match rather than attempting unsafe state recovery. Public play requires the running Render service; publishing the static UI alone does not provide a queue.

## Verification

`npm run verify` includes protocol validation, FIFO/cancel, version mismatch, countdown ownership, stale/duplicate input, edge consumption, round readiness, forfeit/requeue, resource limits, room expiry, and a real WebSocket exchange with origin rejection. `npm run test:browser` also launches a server and two isolated browser contexts (desktop and landscape mobile), enters two original characters, checks cancel/requeue, drives each fighter from its own device, confirms shared combat damage, then disconnects and requeues. CI and Pages deployment run these checks.

References: [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages), [Render WebSockets](https://render.com/docs/websocket), [Render Blueprints](https://render.com/docs/blueprint-spec), [Render free services](https://render.com/docs/free).

For a manual public-server smoke check after deployment (do not run against a busy queue), use `ONLINE_TEST_URL=https://shinobi-arena-online.onrender.com CHROMIUM_PATH=/path/to/chromium node scripts/online-smoke.mjs`. This creates two temporary test players and leaves afterward. The standard CI suite continues to use an isolated local server. `ONLINE_TEST_USE_PROXY=1` enables a test-environment HTTPS proxy when required; proxy TLS interception is permitted only for that explicit QA mode. Normal app connections use the browser's normal TLS verification.

## v0.13 inventory protocol

Protocol 2 / rules `duel-0.13.0` include two weapon slots and four consumable IDs in the validated profile. The server creates runtime charges and owns swapping, tool startup/recovery, projectile interception, poison and Raijin coordinates. Old tabs must refresh after deployment. The client still uses local P1 bindings for whichever online slot it owns. Visibility remains local and cannot change the other player's controls or server rules.

Leaderboard, spectating and fight replays are planned separately in [issue #7](https://github.com/Driaque/shinobi-arena/issues/7).
