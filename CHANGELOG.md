# Changelog

The release version (semver) is independent of the app generation
(`app/v1`).

## 0.1.1 — 2026-11-08

A fix release: Lazurio runs the built version from `main` instead of the
development server. The App stays generation `app/v1` and stack profile
`app@2026.11`.

### Fixed

- The built version from `main` (Lazurio Module Standard): `lazurio.runtime`
  declares `start_script: start` and `build_output: dist` beside
  `build_script: build`. From `main` Lazurio builds the client into `dist`
  and starts the server with `NODE_ENV=production`, which serves the
  installed build from `LAZURIO_RUNTIME_BUILD_OUTPUT` (the package's own
  `dist/` in a local production run). A development run lets Bun bundle the
  client (HTML import with hot reload) and serves `public/` beside it.
- The preparation no longer builds: `check:prepared` checks only that the
  dependencies are installed, and `prepare:app` is gone. The first-slide
  preview check runs in the client build.
- The health path is `/api/health`, which answers from the server in both
  runs and refuses a foreign Host.
- `docs/adoption.md` (issue #3): the name check reads the owner of
  `gh api repos/<Organization>/<name>`, because GitHub redirects a moved
  repository; the release check compares the tag with the recorded commit,
  since the registry records no artifact digest yet; the module is created
  with `--teams` and a dry run first; the Lazurio release needed for the
  built version (LazurioPlatform v0.1.11 or newer) is named.
- `docs/release.md` and `docs/marketplace.md` no longer promise an archive
  digest in the registry entry.
- The empty start of `docs/adoption.md` passes `bun run check`: the start,
  design and discovery tests work with an empty library, everything about the
  starter is in `tests/template-seed.test.ts`, `data/v1/decks/.gitkeep` keeps
  the library's directory in a fresh checkout, and
  `tests/empty-start.test.ts` runs the whole suite on such a checkout.

### For adopted modules

Merge the tag `v0.1.1`. Keep your identity in `lazurio.module.json` and
`lazurio.runtime` (`id`, `company`, `module`); take the scripts,
`start_script`, `build_output`, the health path and the preparation from the
template. If your module added its own `prepare:app` steps, move a build into
`build` and keep only idempotent preparation in a `prepare_script`. After the
merge, `bun run check` in `app/v1`; after the person merges, start the module
from `main` and check the library in the browser.

## 0.1.0 — 2026-11-03

- Library of presentations with first-slide previews, metadata and sources.
- HTML playback with arrow navigation and browser printing to 16:9 PDF pages.
- "Vytvořit s Agentem" brief for creating a presentation with the user's own
  Agent.
- Synthetic four-slide starter presentation; no customer data.
- Lazurio design system snapshot with locally hosted Inter Tight Variable and
  Geist Mono.
- Stack profile "app without own data": Bun 1.4.4, TypeScript 7.0.2,
  Biome 2.6.4, Vite 8.3.5, React 19.3.1, exact pins; `bun run check` is the
  single gate.
- Documentation for agents, adoption into another Organization and further
  development; Marketplace screenshots.
- Released under the MIT License; see LICENSE and NOTICE.
