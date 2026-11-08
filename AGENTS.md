# Presentations: rules for agents

Presentations is a Lazurio module template: a library of HTML presentations
with first-slide previews, playback, printing to 16:9 PDF pages and a brief
for creating decks with the user's own Agent. Its source and releases live
in `LazurioTemplates/presentations`; Lazurio Example Organization adopts it
from the Marketplace like any other Organization. It works in English (the
app UI is Czech for now) and is MIT licensed. All bundled content is fictional.

## Shape of the module

- `lazurio.module.json` declares one app, `app/v1` (generation v1: no own data
  layer). Decks are Git files, not records in a database.
- `app/v1` is one Bun server (`src/server.ts`) that serves the React
  gallery, a same-origin read-only API, deck sources and derived PDFs.
  Listener settings come only from module-kit `listener("web")`.
- From `main` Lazurio runs the built version: `build` (`build_script`) writes
  the client to `dist` (`build_output`), and `start` (`start_script`) runs
  the same server with `NODE_ENV=production`, serving the installed build
  from `LAZURIO_RUNTIME_BUILD_OUTPUT`. A development run (`dev`) lets Bun
  bundle the client itself. The preparation only checks that dependencies are
  installed; it never builds.
- Deck sources: `data/v1/decks/<date-slug>/index.html` with `.slide`
  sections, arrow navigation and print CSS, optional local assets and an
  optional `deck.meta.json`. Each deck needs a real first-slide JPEG in
  `app/v1/public/previews/<date-slug>.jpg`; the client build refuses a deck
  without one.
- Derived PDFs go to `generated/v1/decks/<slug>/exports/`. The browser prints
  them; the app never generates or stores PDFs itself.
- `app/v1/public/lazurio/` and each deck's `lazurio/` folder hold a frozen
  design snapshot. Never edit it; refresh it as `docs/design-system.md` says.

## Stack

Stack profile "app without own data" (Lazurio Marketplace, 2026-11): Bun
1.4.4, TypeScript 7.0.2, Biome 2.6.4, Vite 8.3.5, React 19.3.1, `bun test`,
`@lazurio/module-kit` v0.2.0. Every dependency has an exact version and
`bun.lock` is committed. Change the stack only through a profile release or a
generation change, see [docs/extending.md](docs/extending.md).

## Working on the module

- Work in a task worktree under `.worktrees/` and a pull request. Never push to
  `main`.
- One gate: in `app/v1`, `bun install --frozen-lockfile` and `bun run check`
  (typecheck, lint and all tests, which build the client and start both the
  development run and the built version). CI runs the same.
- For a UI or deck change, also open the app through the Lazurio lifecycle and
  check the gallery, detail, Agent brief and playback in the browser.
- No cross-repository runtime imports, no `.env*`, no CDN fonts, no network
  calls from decks.
- Keep `NOTICE` current when fonts, assets or other third-party files enter
  the tree.

## Creating a presentation with the user

Ask for purpose, audience, outcome and approved sources, and show an outline
first. Use the receiving Organization's Knowledgebase and design system;
mark uncertainties instead of inventing facts or identity. Keep the synthetic
starter, put new work in its own directory with a real preview, show it in the
browser and prepare a PR. Preview, copying the brief or a PR do not authorize
publication of a presentation.

## Releases and adoption

- Releases follow [docs/release.md](docs/release.md): annotated tag
  `v<semver>` and a GitHub Release, each only on the owner's explicit
  instruction. The release version is independent of the app generation.
- Adoption into another Organization follows [docs/adoption.md](docs/adoption.md);
  the adopted module keeps its own identity and lease. The values in
  `lazurio.module.json` and `app/v1/package.json` here are placeholders
  (`REPLACE-WITH-ORG-NAME`, `replace-with-org-slug-presentations-v1`, port
  20000); the scaffold of the adopting Organization replaces them.

## This Organization's copy

This module belongs to Lazurio Example Organization, which works in English
and keeps all its data fictional. It was adopted from
`LazurioTemplates/presentations` at `v0.1.0`
(`4b023772fbe45c2209b6eb1ff44009239ed1ac99`) and is at `v0.1.1`
(`68f539df31ad46ac938ae71346e7b3b17cd5b525`); `LICENSE` and `NOTICE` stay
with the copy. On every merge of a newer release the Organization keeps its
identity: `lazurio.module.json` (`company`, port lease) and
`lazurio.runtime` `id`, `company` and `module` in `app/v1/package.json`;
everything else takes the template's side. Review and merge follow the
Organization's root `AGENTS.md`.
