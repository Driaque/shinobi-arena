# Release requirements

For every version update:

- Add `docs/releases/<package.json version>.md` describing shipped behavior, controls, compatibility, and relevant limits. Keep planned features clearly separate.
- Update `CHANGELOG.md` and the in-game release-notes link/version when bumping the version.
- Run `npm run verify` and gameplay browser checks for gameplay, input, or UI changes.
- Publish the matching GitHub Release after verified deployment. `.github/workflows/release.yml` does this once per version; inspect its result before calling a version released.
- Do not claim leaderboard, spectating, replays, or other backlog features are implemented until their end-to-end flows work and have tests.

# Production delivery and recovery

- Deploy production updates only to the existing shinobi-arena-online Render service (https://shinobi-arena-online.onrender.com). Do not publish updates to Driaque GitHub Pages. The GitHub repository remains the source repository for Render.
- Maintain docs/RECOVERY_CHECKPOINT.md after major steps and before approval handoffs. Record branch/commit, completed work, asset paths, checks and limitations, next action, exact approval scope, PR/deployment IDs when known. Commit and push checkpoints with the work so another chat can recover without repeating generation.
- Never call a queued deployment live. Verify the exact version and source commit at /health before reporting success.
