# Changelog

The release version (semver) is independent of the app generation
(`app/v1`).

## 0.2.1 — proposed, not released

A fix release: a module hosted by Lazurio opens at its own address. The App
stays generation `app/v1` and stack profile `app@2026.11`; nothing is
migrated and no dependency changes. Builds on 0.2.0.

### Fixed

- **The module refused its own hosted address.** Lazurio's gateway passes
  the browser's request on to the module with the browser's `Host`, the
  module's address; only its separate readiness check names loopback. The
  server of 0.1.0 to 0.2.0 accepted loopback alone, so at the module's
  address the library, its API and the decks answered `403 foreign_host`
  while the readiness check passed and the module looked started. The server
  now also accepts the hostname of the listener's external origin
  (`LAZURIO_RUNTIME_LISTENER_WEB_EXTERNAL_ORIGIN`, read by `allowedHosts()`
  of `@lazurio/module-kit` v0.2.0), compared with the request's own `Host`
  header in `app/v1/src/host.ts`. A local run has no external origin and
  still answers loopback only. Forwarded headers (`X-Forwarded-Host`,
  `Forwarded`) never widen what is accepted, and any other `Host` is still
  refused.
- Tests: `tests/host.test.ts` (loopback with and without a port, the hosted
  hostname and its look-alikes, forwarded headers, a missing `Host`) and the
  start contract against the running server: the development run local
  (loopback 200, the hosted name 403), the built version hosted (the
  library, `/api/health`, `/api/decks`, a deck's detail and the deck itself
  200 at the module's address; a foreign `Host` 403 on the library,
  `/api/decks` and `/api/health`, also with forwarded headers naming the
  module's address).

### For adopted modules

Every module adopted from 0.1.0, 0.1.1 or 0.2.0 has this fault: hosted by
Lazurio, it does not open at its address. Take 0.2.1 as
[docs/extending.md](docs/extending.md#from-020-to-021) describes: merge the
tag `v0.2.1`, run `bun run check` and open the module at its address. A
module still on 0.1.x follows the steps of 0.2.0 with the tag `v0.2.1`
instead; they bring the fix with them.

## 0.2.0 — 2026-11-10

Presentations becomes a full presentation module: decks built from a short
structured source, eleven slide types, local video, personal versions for a
prospect, Czech and English, the look of the module's design system and
skills for agents. The library and the decks wear the design system package
`design-system` (`LazurioTemplates/design-system` v2.0.0). The App stays
generation `app/v1` and stack profile `app@2026.11`; nothing is migrated.
Builds on 0.1.1.

### Added

- **Decks from source.** `data/v1/decks/<slug>/deck.source.json`
  (`lazurio.presentation.source.v1`) with its `media/`; `bun run deck:build`
  validates it (each error names its field) and writes `index.html`,
  `index.<language>.html`, `deck.meta.json` and `assets/`;
  `bun run deck:check` and a test keep the built files equal to the source.
  Bun and TypeScript only.
- **Eleven slide types**: title, section, problem, quote, options (models
  and variants), case study, timeline, metrics with a growth chart, video,
  appendix and closing ([docs/slide-types.md](docs/slide-types.md)).
- **Presenting**: a 1920 × 1080 stage fitted to the window, keys, swipe,
  full screen, the slide in the address, print to one 16:9 page per slide,
  speaker notes kept out of sight.
- **Video slides** with local files: muted when the slide opens, stopped
  when it closes, sound only with its button and only for a video that has
  sound, nothing with reduced motion, the poster in print, captions per
  language.
- **Personal version**: `?for=<name>&org=<organization>` (in Czech also
  `?pro=` and `&firma=`) shows "Prepared for …" on the title and closing
  slides; nothing is stored. The library's detail builds the link for a
  deck that makes one (`personal` in `deck.meta.json`); for a hand-written
  deck or a source with `personal: false` it says that the deck has none.
- **Czech and English**: the library follows `?lang=`, else the `locale`
  of `/.lazurio/shell.json`, else `app/v1/src/instance.ts` (Czech by
  default); a deck can carry both languages, each with its own page,
  metadata and first-slide preview, and a switch between them. The API takes
  `?lang=`.
- **Design system as a package**: `design-system` is a dependency of the App
  on a released tag (`github:LazurioTemplates/design-system#v2.0.0`, pinned
  in `bun.lock`), as the Lazurio Module Standard asks. The library imports
  `design-system/styles.css` once and uses its React components (`Button`,
  `TextField`, `TextArea`, `Alert`, `EmptyState`, `Icon`) and classes; its
  language comes from the design system's `readLazurioLocale()` and
  `resolveLocale()`. `deck:build` puts the package's stylesheet (colour roles
  of both themes, fonts, base styles) and its fonts with their licenses into
  each deck and scales `design-system/tokens` (type roles, spacing, radii) to
  the slide; a slide's tone is the design system's `data-theme`, the deck's
  controls are its buttons and icons. An Organization's own design system is
  one changed dependency line ([docs/design-system.md](docs/design-system.md)).
- **Skills for agents** in `.agents/skills/` and `.claude/skills/`:
  `deck-from-sources`, `deck-personal-version`, `deck-add-slide`.
- **Sample deck** of the invented company Example (an office coffee offer),
  every slide type in Czech and English, with a text-free, silent animation
  made for this template.
- Marketplace screens per language in `docs/screenshots/cs/` and
  `docs/screenshots/en/`.
- Tests: the deck source, the build and its drift, escaping, the link
  parameters, both languages, the sample deck, previews per language, the
  template contract (license, documents, exact versions, screens, skills,
  the design system as a package on a tag and no relative import of it, the
  listing's status against the CHANGELOG, paths that check out on Windows),
  the design system in the library and in every built deck, an adopted copy
  with its own identity and its Organization's design system pinned over SSH
  (`tests/adopted-copy.test.ts`, from the template's github: lock and from a
  module already pinned over SSH; the tests of the template alone skip
  there, the pin check accepts both forms with their lock), and the empty
  start on a fresh checkout (`tests/empty-start.test.ts`, now for the sample
  deck: its directory, its two previews and `tests/sample-deck.test.ts`).

### Changed

- The library's words come from `app/v1/src/ui-app/i18n.ts`; the "Vytvořit
  s Agentem" brief names the skill `deck-from-sources` and `deck:build`.
- A preview per language: `<slug>.<language>.jpg` beside `<slug>.jpg` for
  every further language of a deck.
- The look follows the design system's rules: no uppercase and no eyebrow
  labels above headings (the title's `eyebrow`, the section's `label` and the
  appendix mark are a running head at the top of the slide; the case study's
  client and the timeline's time sit under their titles), hairlines instead
  of thick edges and shadows, no decorative numbering of problem points, one
  black action, motion from the design system's durations and curves.
- `docs/marketplace.md`: the **Status** line says which releases are
  published (issue #7: the tag `v0.1.1` called 0.1.1 unreleased), and
  `docs/release.md` sets it in the release commit; a test compares it with
  the CHANGELOG.

### Removed

- The four-slide starter `2026-10-11-project-proposal` and its preview; the
  sample deck replaces it. Hand-written decks keep working.
- The screens of 0.1 in `docs/screenshots/*.webp` (now per language).
- The frozen Lazurio snapshot `app/v1/public/lazurio/` and its
  `vendor.lock.json`: the design system package replaces it.

### For adopted modules

Take 0.1.1 first, then merge the tag `v0.2.0` as
[docs/extending.md](docs/extending.md#from-01x-to-020) describes: keep your
identity and decks, run `bun install` (the design system package), set the
language in `app/v1/src/instance.ts`, decide whether to keep the sample
deck, and run `bun run deck:build` and `bun run check`. An Organization with
its own design system changes the `design-system` line to its own release.

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
