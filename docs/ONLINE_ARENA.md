# Online arena: identity, rankings, spectating and replays

## Player experience

Open Arena from the top bar. Live matches lists public ongoing rooms; Watch live enters as a read-only spectator. Rankings shows Elo and placement status. Past fights lists server-recorded matches and forfeits, with replay playback and download. My profile shows personal history and the private recovery code needed to restore this browser profile on another device. Never share a recovery code with another player.

Online matchmaking has separate casual and ranked queues. A server-issued opaque token is stored under the arena server’s origin in browser storage; the database stores its SHA-256 hash. Display names can change without creating another identity. Tokens are sent over HTTPS / WSS in Authorization headers or the join message, never URLs or public snapshots. Public endpoints never accept client-submitted results, ratings, HP or inventories.

These profiles establish possession of a browser/recovery code, not a verified person. There is no email recovery, account linking or reconnect support in this version. Losing both the browser storage and the recovery code loses access to that profile. Clearing controls does not clear identity.

## Rating rules

- Elo starts at 1000 with K=24. Expected score is 1 / (1 + 10^((opponentRating - rating)/400)); win=1, draw=0.5, loss=0. Changes round to the nearest integer.
- Five rated results complete placement; tiers: Genin below 1200, Chūnin from 1200, Jōnin from 1400, Kage from 1600. Leaderboard positions are ordered by rating, rated games and stable ID; placement status is always visible. W/L/D totals include casual matches and are labeled separately from rated games.
- Casual results retain history and W/L/D but never change Elo. The first three ranked matches per identity pair per UTC day can change rating. Repeated matches afterward remain in history with an explicit pair-limit label.
- Winner rewards require 1200 active simulation ticks (20 seconds). Earlier player forfeits charge the leaver 12 rating without rewarding the winner, subject to the same pair cap. The leaver’s penalty counts toward placement; the unrewarded winner does not gain a placement result.
- Leaving during countdown before play, an abandoned room without a determinable leaver, and server shutdown cancel ranking changes. A completed best-of-three is recorded immediately; later disconnects cannot turn it into a second result or forfeit.

These are prototype anti-farming constraints, not a full anti-Sybil or competitive integrity system. Client input is authoritative only as intent; the server owns simulation and outcomes.

## Spectators

Spectators use their own WebSocket subscription and never take either player slot or enter a matchmaking queue. Maximum 40 spectators per room and 200 total connections; bounded outgoing buffers disconnect slow viewers. All fights are public in this version. Input, ready, join and result messages from a spectator are explicitly rejected. Cancel and disconnect only remove the viewer. Watching a match with your active/queued profile requires leaving your own match first.

## Replay format and retention

The server records validated initial loadouts, ordered accepted per-tick inputs with run-length compression, round transitions and snapshots at five frames per second plus important boundaries. Replay schema 1 includes its original move/character/awakening catalog and rules version. Playback interpolates positions between recorded snapshots, so later game balance changes cannot resimulate the old fight differently. The accepted input track is also retained and tested against the live engine’s final state for the same rules version.

Replays support pause, seek, 0.5× / 1× / 2× speed and JSON download. Playback has no multiplayer connection and cannot write results. The viewer displays fighter names, HP, chakra, effects, round and score. Player recovery tokens are excluded from archives. Newer incompatible replay schemas are rejected explicitly.

Archives retain the latest 200 replays for at most 14 days. Ratings and match metadata remain after the compressed archive expires. Up to 4500 snapshots and 40000 input segments are recorded per fight; recordings reaching a cap are explicitly marked truncated. The resulting archive must be at most 4 MiB compressed. Matchmaking is bounded to 20 simultaneous matches on the current single-process server.

## Storage and deployment

Production requires PostgreSQL via DATABASE_URL. The server initializes additive players/matches tables and indexes before listening. Rankings and results commit in one transaction with a unique match ID. Duplicate delivery cannot double count results. Transaction writes are serialized and use a PostgreSQL transaction advisory lock; the pool has three connections. Replay data is gzip-compressed BYTEA. No credentials are stored in source control.

Local development uses node:sqlite with a file under data/ (gitignored); tests default to an isolated in-memory database unless durability is under test. In-memory previews do not enable ranked play. A Render production start without DATABASE_URL fails explicitly, preserving the previous live deployment rather than silently storing ratings on an ephemeral filesystem.

The Render preview database created for this feature is shinobi-arena-history in Ohio, workspace My Workspace. It expires November 27, 2026. The expiry is supplied through STORAGE_EXPIRES_AT and displayed in Arena. Export/migrate before that date; a new long-lived database can use the same schema. See DEPLOYMENT_V15.md for the final connection step.

Persistence failures are logged without connection strings, retain up to 100 pending results and retry every five seconds. Ranked joins are disabled while persistence is unhealthy. This bounded in-process retry queue does not survive a process crash during a database outage; a durable outbox is future work. Graceful shutdown drains accepted persistence work. Game-server /health reports storage status and pending writes; a failed database startup prevents listening.
