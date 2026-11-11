# Presentations: rules for agents

Presentations is a Lazurio module template: a library of HTML presentations
built from a structured source, with first-slide previews, presenting,
printing to 16:9 PDF pages, local video, personal versions for a prospect
and a brief for creating decks with the user's own Agent. Its source and
releases live in `LazurioTemplates/presentations`. The App and the sample
deck speak Czech and English; the code and documentation are English. It is
MIT licensed. All bundled content is fictional (the invented company
Example).

## Skills

Use the module's skills (`.agents/skills/`, mirrored in `.claude/skills/`):

- `deck-from-sources`: a new deck from the person's approved sources.
- `deck-personal-version`: a personal link for one prospect. Ask first,
  every time; store nothing.
- `deck-add-slide`: one more slide of a given type.

Keep both skill folders identical; a test checks it.

## Shape of the module

- `lazurio.module.json` declares one App, `app/v1` (generation v1: no data
  layer of its own). Decks are Git files, not records in a database.
- `app/v1` is one Bun server (`src/server.ts`) that serves the React
  library, a same-origin read-only API, the decks and derived PDFs.
  Listener settings come only from module-kit `listener("web")`.
- From `main` Lazurio runs the built version: `build` writes the client to
  `dist`, and `start` runs the same server with `NODE_ENV=production`,
  serving the installed build from `LAZURIO_RUNTIME_BUILD_OUTPUT`. A
  development run (`dev`) lets Bun bundle the client itself. The preparation
  only checks that dependencies are installed; it never builds.
- A deck: `data/v1/decks/<YYYY-MM-DD>-<slug>/deck.source.json` and its
  `media/`. `bun run deck:build` writes `index.html`,
  `index.<language>.html`, `deck.meta.json` and `assets/`; never edit those
  by hand. The format is in [docs/slide-types.md](docs/slide-types.md).
  A hand-written deck (an `index.html` without a source) still works.
- Each deck needs a real first-slide JPEG per language in
  `app/v1/public/previews/` (`<slug>.jpg`, `<slug>.<language>.jpg`); the
  client build refuses a deck without one.
- Derived PDFs go to `generated/v1/decks/<slug>/exports/`. The browser
  prints them; the App never generates or stores PDFs itself.
- The library's language: `?lang=`, else the `locale` of
  `/.lazurio/shell.json` where the App's origin answers it, else
  `app/v1/src/instance.ts`. Every text is in `app/v1/src/ui-app/i18n.ts`
  (library) and `app/v1/src/deck/messages.ts` (deck controls), in both
  languages; never mix languages on one screen.
- The look of the library and the decks comes from the package
  `design-system` at a released tag (`app/v1/package.json`): the library
  imports `design-system/styles.css` and its React components, the deck
  build puts its stylesheet and fonts into each deck and scales
  `design-system/tokens` to the slide. Never copy its files or import it by
  a relative path; a newer design system is a new pin. Use only `--ds-*`
  roles and the `--slide-*` scale, and keep its rules (no uppercase, no
  eyebrow labels, hairlines, one black action). See
  [docs/design-system.md](docs/design-system.md).

## Stack

Stack profile `app@2026.11` of Lazurio: Bun 1.4.4, TypeScript 7.0.2, Biome
2.6.4, Vite 8.3.5, React 19.3.1, `bun test`, `@lazurio/module-kit` v0.2.0.
Every dependency has an exact version and `bun.lock` is committed. Change
the stack only through a profile release or a generation change, see
[docs/extending.md](docs/extending.md).

## Working on the module

- Work in a task worktree under `.worktrees/` and a pull request. Never push
  to `main`.
- One gate: in `app/v1`, `bun install --frozen-lockfile` and
  `bun run check` (type check, Biome and all tests: the deck sources against
  their built files, both languages, the client build, the development run
  and the built version). CI runs the same.
- For a UI or deck change, also open the App and the deck in a browser, in
  both languages, and check the library, the detail, the personal version,
  the Agent brief, presenting and the print preview.
- No cross-repository runtime imports, no `.env*`, no CDN fonts, no network
  calls and no storage from decks.
- Facts, numbers, quotes, names and logos on slides only from the person's
  approved sources. Media own or licensed, recorded in the deck's
  `media/README.md`; music and effects only with a verified license.
- Keep `NOTICE` current when fonts, assets or other third-party files enter
  the tree.

## Releases and adoption

- Releases follow [docs/release.md](docs/release.md): annotated tag
  `v<semver>` and a GitHub Release, each only on the owner's explicit
  instruction. The release version is independent of the App generation.
- Adoption into another Organization follows [docs/adoption.md](docs/adoption.md);
  the adopted module keeps its own identity and lease. The values in
  `lazurio.module.json` and `app/v1/package.json` here are placeholders
  (`REPLACE-WITH-ORG-NAME`, `replace-with-org-slug-presentations-v1`, port
  20000); the scaffold of the adopting Organization replaces them.

## This Organization's copy

This module belongs to Lazurio Example Organization, which works in English
and keeps all its data fictional. It was adopted from
`LazurioTemplates/presentations` at `v0.1.0`
(`4b023772fbe45c2209b6eb1ff44009239ed1ac99`) and is at `v0.2.0`
(`2629dce5a7c3108bc88c2d1f3ec4f539356ac63f`), taken by merging each release
tag; `LICENSE` and `NOTICE` stay with the copy. On every merge of a newer
release the Organization keeps its identity: `lazurio.module.json`
(`company`, port lease) and `lazurio.runtime` `id`, `company` and `module` in
`app/v1/package.json`; and its setting in `app/v1/src/instance.ts`:
`language` is `en`, so the library is in English and shows the English
variant and preview of the sample deck. Everything else takes the
template's side, and the Organization has no other changes of its own.

The design system is the package `design-system` at
`github:LazurioExampleOrganization/design-system#v2.0.0`: by the Owner's
decision of 2026-11-11 this module stands on the Organization's own design
system, which wears the template's Example brand (released on 2026-11-11).
The repository is public, so CI installs it without a key
([docs/design-system.md](docs/design-system.md#another-design-system)).
Every template merge keeps that line in `app/v1/package.json`; a new release
of the design system is a pull request that moves the pin. Review and merge follow the
Organization's root `AGENTS.md`.
