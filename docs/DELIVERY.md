# Repository and delivery

## Repository

Remote: https://github.com/Driaque/shinobi-arena
Default branch: `main`. Visibility: public.
The repository has been created and the prepared foundation is being imported.
Pages and environment settings must be configured separately before deployment can succeed.

Clone for local work:

```sh
git clone https://github.com/Driaque/shinobi-arena.git
cd shinobi-arena
npm ci
npm run verify
npm run dev
```

## CI

`.github/workflows/ci.yml`: pull requests, pushes to main, manual dispatch.
Pinned action commits; read-only contents permission; checkout credentials not persisted.
Node version comes from `.nvmrc`; `npm ci` uses the committed lockfile.
`npm run verify` performs JavaScript syntax checks, unit tests and a static build.
Both CI and deployment also install Chromium and run `npm run test:browser` before uploading a build.
Build output is retained for seven days. Old CI runs for the same ref are cancelled.
No deployment occurs from a pull request; no `pull_request_target` workflow is used.

## CD

`.github/workflows/deploy-pages.yml`: main pushes and manual dispatch.
Build job reruns verification and packages `dist`. Deploy job needs that successful build and is
guarded to main; only it gets `pages: write` and `id-token: write`.
Production deployments are serialized without cancellation of an in-progress deployment.
Relative asset paths support GitHub project-site URLs without hard-coded repository names.

After deciding to publish, set repository Settings -> Pages -> Build and deployment -> Source:
GitHub Actions. Configure the `github-pages` environment to allow main only. If you want a manual
production gate, add required reviewers where your GitHub plan supports them.
The initial deployment may fail until Pages is enabled; CI remains independently useful.
No cloud provider secret is needed. Never put passwords/tokens in source.

## Recommended repository settings (not applied)

Protect main with PR reviews and required `Verify` check. Confirm the displayed check name after
the first hosted CI run before selecting it. Disable force pushes and branch deletion. Required
review policy should still allow the maintainer to work with the available collaborators.
Use short feature branches. Dependabot proposes weekly action/dependency updates; verify before merging.
Initial foundation CI passed on GitHub. The user has loaded the initial Pages prototype.
Branch protections and environment restrictions have not been verified.

## Rollback

Revert the bad change using a PR, verify, and merge to main. The deployment workflow rebuilds the
reverted state. For emergency operational procedures, document who can bypass protection and why.
Do not move main backwards or rely on retained CI artifacts as a permanent release archive.

## Future checks

Browser smoke automation now covers a complete local two-player match, rematch, pause, multi-touch,
rotation gate and control bounds. Extend it to computer play and physical-device evidence. Add measured performance budgets, then fail
only on repeatable regressions. Add backend migration/integration/security checks when a backend exists.

References:
- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/lock


## v0.12 online service

The backend now exists at `apps/server`; it shares `packages/engine` and validates messages through `packages/network`. `npm run verify` includes real transport and matchmaking tests. `npm run test:browser` also tests two isolated desktop/mobile sessions, shared damage, cancellation, rotation and disconnect/requeue. The existing Pages workflow receives the optional `ONLINE_SERVER_URL` Actions variable at build time.

`render.yaml` defines a separate single-instance Node service with `/health`, checks-gated auto deploy and graceful shutdown. It is a deployment definition; no Render deployment has been provisioned by committing the file. See [ONLINE_MULTIPLAYER.md](ONLINE_MULTIPLAYER.md) for concrete setup and operational limits.
