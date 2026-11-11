# Architecture

One Bun process serves the React library, a same-origin read-only API, the
decks as static files and derived PDFs. From `main` Lazurio builds the
library with Vite and starts the server in production, serving that build;
a development run lets Bun bundle the library itself. There is no
browser-side mutation and no content backend: decks are Git files and every
change is a pull request.

## Decks

```text
data/v1/decks/<YYYY-MM-DD>-<slug>/
  deck.source.json   the source: languages, metadata, slides (people and agents)
  media/             images, videos, posters, captions (people and agents)
  index.html         built: the primary language
  index.<lang>.html  built: each further language
  deck.meta.json     built: metadata per language, the slide outline
  assets/            built: deck.css (the design system's styles, the
                     slide scale, the layout), deck.js (runtime), fonts/
                     (the design system's fonts and their licenses)
```

`app/v1/src/deck/` holds the build: `source.ts` (the shape of the source
and its validation, errors by field path), `slides.ts` (one renderer per
slide type, every text escaped), `render.ts` (the page per language and
`deck.meta.json`), `theme.ts` (the design system package's stylesheet and
fonts, and its tokens as `--slide-*` custom properties at slide scale), `build.ts` (files, drift and writing) and
`runtime.ts` with `link.ts` (the browser script, bundled by `Bun.build`).
`src/cli/deck-build.ts` is `bun run deck:build` and `deck:check`.

The build is deterministic: a test rebuilds every deck that has a source
and fails when the committed files differ, so the source stays the truth.

A built deck is self-contained: it opens from the App, from a file or from
any static host, loads nothing from the network and stores nothing. The
slide position lives in the address; a personal version is the link's query
(`for`, `org`), rendered with `textContent`.

## The library

`src/decks.ts` discovers decks (a directory with an `index.html`), reads
`deck.meta.json` and answers per language (`?lang=`): the variant in that
language when the deck has it, else its primary language, so one screen
never mixes languages. `src/ui-app/` is the React library; its language
comes from the address, Lazurio's shell document or `src/instance.ts`.

## Boundaries

Paths and symlinks cannot leave the deck and export stores; the server
answers only a `Host` of loopback or, when Lazurio hosts the module, the
hostname of the listener's external origin (`allowedHosts()` of module-kit,
compared in `src/host.ts`; forwarded headers never count), and refuses any
other; missing listener settings stop the start; missing
previews stop the client build. A deck without metadata and an empty
library stay usable.

Adoption uses the standard scaffold for the repository, slot and lease, and
a merge of the release that keeps it an ancestor; later releases are merges
of their tags. No grants or credentials are copied. The design system is
the package `design-system` at a released tag, a dependency of the App;
a newer one is a new pin.

Local preview is not proof of a released installation in another
Organization; that gate stays with the Marketplace pilot.
