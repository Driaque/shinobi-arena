# Repository and delivery

## Source and production

Source repository: https://github.com/Driaque/shinobi-arena, main branch.
Production game: https://shinobi-arena-online.onrender.com.

User decision, 2026-11-07: deploy game updates only to the existing Render service. Do not publish updated builds to GitHub Pages. The source repository is still used by Render; source pushes and hosted Pages publishing are separate operations. The Pages publishing workflow has been removed.

## Validation and deployment

CI runs npm run verify and five groups covering all browser smoke suites. Only successful current-main CI may trigger Deploy Render. scripts/deploy-render.mjs pins the hook to the verified commit for the existing service and waits for /health to report the matching version, commit and healthy storage. Never expose the deploy hook.

Release notes waits for successful CI and Deploy Render for the exact source SHA before publishing the immutable versioned GitHub Release. Every version requires docs/releases/<version>.md, CHANGELOG.md, package version and the in-game release link to agree.

## Recovery

Maintain docs/RECOVERY_CHECKPOINT.md at major milestones and before approval handoffs. Include completed changes, source commit, asset locations, checks, remaining steps, approval scope and PR/deployment links. Commit and push checkpoints with the source when authorized. Never rely on a chat transcript or temporary workspace as the only record of work.

## Rollback

Revert the defective change through a checked PR and deploy the resulting verified main commit to Render. Verify the exact live version and commit before reporting recovery.
