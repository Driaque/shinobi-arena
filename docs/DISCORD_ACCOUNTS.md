# Discord accounts and activation

## Production setup

Create a Discord developer application named Fabled Rivals under the owner's Discord account. A community server is not required for OAuth sign-in. A separate community server can later host announcements, matchmaking, feedback, playtests and events.

Configure one OAuth2 redirect URI exactly:

https://shinobi-arena-online.onrender.com/auth/discord/callback

Set these variables on the existing Render service:

- DISCORD_CLIENT_ID: the application ID (public identifier).
- DISCORD_CLIENT_SECRET: the private OAuth2 client secret, entered directly into secured service settings. Never put it in chat, source, frontend variables or logs.
- PUBLIC_ORIGIN: https://shinobi-arena-online.onrender.com

No bot token is used. The authorization request asks for identify only. Do not enable broader scopes to make login work. Keep the existing ALLOWED_ORIGINS list for trusted frontend origins; the backend origin is accepted explicitly. Never derive redirect origins from request Host headers.

Merge only after code and browser checks pass. Activate configuration, inspect the resulting Render deployment, then perform a real linking/login test. Existing automated provider tests use controlled responses and cannot validate registration details or Discord's live popup policies.

## Player flows

An existing guest opens Profile / sign in and selects Link this profile to Discord. After consent, the same player ID gains a Discord link and a 30-day game session. Their original recovery credential remains valid, as do history, ratings and tournament reward ownership.

On another device, Continue with Discord signs into the linked player. For a first-time Discord user without a link, it creates one player. Signing in from a browser already holding another profile asks for explicit confirmation; no merge occurs. Link conflicts preserve both profiles and explain how to sign in instead.

Device logout revokes only the current session; the server closes WebSockets using that session. Other sessions and the guest recovery credential remain valid. A maximum of ten game sessions per account is retained. Local controls, loadout presets and practice preferences are not synchronized by this release.

## Authorization boundaries

The trusted game sends a POST to start with a random request secret and optional existing guest authorization. The server accepts only explicitly trusted game origins. The popup first visits the backend, which binds this flow to an HTTP-only SameSite=Lax cookie, then redirects to Discord using state and S256 PKCE.

The callback validates state, expiry, browser cookie and issuer before exchanging the code. It obtains basic identity, discards provider tokens, and sends a one-time proof only to the initiating trusted game origin. It does not link a profile at callback time. The game checks popup source, origin and flow, then redeems the proof with its original request secret and authenticated guest ownership for linking. Only that final exchange writes the link and creates a hashed game session. Proofs expire after a minute and cannot be replayed.

In-progress flows are memory-only and bounded; restarting the server requires a fresh attempt. Game sessions and links are persistent. Provider labels are used only in private account UI; Discord IDs and session credentials are not part of leaderboards or match snapshots.

## Validation

Tests cover preserved history/statistics and IDs, concurrent logins, conflict rollback, logout and expiry, ten-session limits, storage restart, browser-bound callbacks, state/issuer/PKCE checks, denial, stale/replayed proof rejection, forged origins and Host headers, authenticated socket logout, popup origin/source validation and cross-device browser flow.

Production checklist: link an existing guest; verify the same ID/history after login from a second browser; reject linking a different existing guest to that Discord; log out one browser and confirm the other still works; cancel consent; block popups and verify the recovery message. Do not claim production readiness until this succeeds with real Discord credentials.

Official reference: https://docs.discord.com/developers/topics/oauth2
