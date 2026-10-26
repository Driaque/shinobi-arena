# Foundation validation

Local validation on October 26, 2026:

- `npm run verify`: passed JavaScript syntax checks, 12 unit tests and static build.
- GitHub workflow and Dependabot YAML: parsed successfully with Python PyYAML.
- Action commit pins: resolved from the corresponding upstream GitHub tag refs.
- Browser smoke test: not executed successfully; Playwright was available but its browser executable was absent.
- Physical iPhone/Android checks: pending. No mobile browser compatibility claim is made yet.
- Remote repository created: https://github.com/Driaque/shinobi-arena. Hosted Actions results are available in its Actions tab; Pages requires repository configuration.

The tests cover multi-source held input, cancellation reset, resource spending and round outcome primitives.
They do not establish a complete combat engine or real browser pointer handling.
