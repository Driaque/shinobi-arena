# Release requirements

For every version update:

- Add `docs/releases/<package.json version>.md` describing shipped behavior, controls, compatibility, and relevant limits. Keep planned features clearly separate.
- Update `CHANGELOG.md` and the in-game release-notes link/version when bumping the version.
- Run `npm run verify` and gameplay browser checks for gameplay, input, or UI changes.
- Publish the matching GitHub Release after verified deployment. `.github/workflows/release.yml` does this once per version; inspect its result before calling a version released.
- Do not claim leaderboard, spectating, replays, or other backlog features are implemented until their end-to-end flows work and have tests.
