# Automatic Render releases

The existing public-repository Render service has required manual deploys despite its checksPass setting. The supported fallback is a secret deploy hook invoked after trusted main CI succeeds.

## One-time activation

1. Open the existing shinobi-arena-online service Settings in Render, workspace My Workspace. Copy its Deploy Hook privately.
2. In Driaque/shinobi-arena → Settings → Secrets and variables → Actions, create RENDER_DEPLOY_HOOK_URL with that value. Never paste the hook in chat, commit it or write it into logs.
3. Disable Render native auto-deploy for this service, leaving GitHub Actions as the single trigger. No plan or scaling change is needed.
4. Merge the verified change. Inspect Deploy Render: it checks current main and successful CI, pins ref to the commit, and waits for the exact version/commit and healthy storage at /health.
5. Inspect the matching Render deployment and GitHub Release. A queued/accepted trigger is not proof that a version is live.

The workflow never deploys PR commits or failed CI. An older main is skipped before triggering. No automatic retry occurs on an ambiguous hook failure, because it might already have started a deploy. Inspect deployment history before retrying.

## Validation limits

Unit tests cover stale main, failed/untrusted CI, hook validation, commit pinning, queued acceptance and secret-safe errors. End-to-end activation needs the secret and a successful real deployment. Physical-device performance and network testing are separate reliability tasks; do not mark them complete based on this workflow.

Reference: https://render.com/docs/deploy-hooks
