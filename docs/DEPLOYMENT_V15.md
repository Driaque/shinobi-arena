# v0.15 deployment and database handoff

The free database is provisioned: shinobi-arena-history, PostgreSQL 17, Ohio, ID dpg-dbh5gg7lk1mc73faaoi0-a. It is separate from the ephemeral web-service filesystem and expires November 27, 2026. The initial v0.15.0 build exposed test-environment inheritance; v0.15.1 isolates test processes and uses the shinobi_arena PostgreSQL schema. The database connection and expiry settings are saved on the existing service.

## Connect once

In the Render database dashboard, open Connect and copy Internal Database URL. Set it as DATABASE_URL on the existing shinobi-arena-online service (srv-dbgvadou01pc73b5hrig) in the same workspace/region. Keep the connection string private. Set STORAGE_EXPIRES_AT to 2026-11-27T20:17:04.722093Z. The available Render connector can create the database and set environment variables, but does not expose a database connection-info operation; therefore the URL must be supplied through Render’s dashboard or an authorized authenticated fallback.

After the connection is set: merge the verified feature branch to main, wait for CI and Pages, manually deploy the existing public-repository Render service, wait for live status and verify /health, /api/status, the loadout grid, ranked joins, a third spectator, result persistence and replay playback. Refresh both devices for protocol 3 / duel-0.15.0. Publish/inspect the versioned release notes before calling the release live.

## Export and migration

Use Render’s Connect instructions for an external TLS connection with your own secured environment variable, then pg_dump in custom format to export all players, matches and replay archives. Treat the export as private because it contains identity-token hashes. Restore with pg_restore into a compatible PostgreSQL instance, set the new internal DATABASE_URL, redeploy, and verify existing recovery codes and ratings before decommissioning the source. Keep encrypted backups outside the expiring free database. Downloaded replay JSON files preserve individual fights but do not back up identities or ratings.

Do not commit URLs, passwords, recovery codes, SQL exports or local SQLite files. Paid hosting changes require a separate user decision.

The live schema is shinobi_arena. Include this schema in pg_dump/pg_restore and verify its players and matches tables. Public-schema records created by the unsuccessful initial build are isolated test data, not live arena history.
