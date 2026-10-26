# Shinobi Arena

Working title for a browser-based 2D fighting game and, later, a reusable game platform.
Desktop keyboard and landscape phone controls are first-class inputs.

## Current status

Foundation scaffold: responsive control lab, multi-source input state, resource/outcome primitives,
automated unit tests, static build, and GitHub Actions. **Not a playable fighter yet.**
No character artwork, fighting animations, AI, multiplayer networking, or backend is implemented.
Naruto vs Sasuke is the planning example; the scaffold contains neutral placeholders.

## Run

Use Node 22 (see `.nvmrc`). No external runtime or development packages are needed yet.

```sh
npm ci
npm run verify
npm run dev
```

Open http://localhost:4173. Rebuild after source edits. The dev server binds to localhost only.
Keyboard: A/D move, W jump, J attack, K block, U/I specials.
The control lab shows input states, not movement or combat.

## Project map

| Location | Purpose |
| --- | --- |
| `apps/web` | Browser interface, landscape gate, input adapter |
| `packages/input` | Device-independent held-action state |
| `packages/engine` | Initial headless combat primitives |
| `tests` | Input and combat-rule tests |
| `docs/PROJECT_PLAN.md` | Product scope, milestones, acceptance criteria |
| `docs/MOBILE_DESIGN.md` | Landscape interaction design and device checks |
| `docs/ARCHITECTURE.md` | Simulation boundaries and networking strategy |
| `docs/DELIVERY.md` | CI/CD, repository setup, rollback |
| `docs/BACKLOG.md` | Ordered implementation backlog |

## Delivery

`CI / Verify` checks pull requests and main. `Deploy Pages` verifies main independently and
deploys the resulting static artifact. Deployment needs GitHub Pages enabled with **GitHub Actions**
as its source. See `docs/DELIVERY.md`. No cloud secrets are required for this static foundation.

## Portfolio objective

Show responsive play plus evidence of sound engineering: a deterministic simulation,
versioned move data, device-independent inputs, recoverable sessions, measurable performance,
and architectural decisions with explicit tradeoffs. Features are claims only when demonstrated.

## Assets

No third-party character assets are bundled. Record provenance and permitted use for every
asset added in `docs/ASSET_REGISTER.md`. No open-source license has been selected for this repository yet.
