# Design

The library and the decks both wear the module's design system: the package
`design-system`, a released tag of `LazurioTemplates/design-system` (this
release: `v2.0.0`, the invented brand Example), or the Organization's own
design system. It is a dependency of the App in `app/v1/package.json`;
`bun.lock` pins its commit and checksum. Nothing of it is copied into the
repository or imported by a relative path (Lazurio Module Standard: a
design system's assets come as a dependency on its package).

## The library

`app/v1/src/ui-app/main.tsx` imports `design-system/styles.css` once (tokens,
fonts, base styles and the components' CSS); the screens use the design
system's React components (`Button`, `TextField`, `TextArea`, `Alert`,
`EmptyState`, `Icon`) and its classes (`ds-card`, `ds-type-*`). The
library's own layout in `src/ui-app/index.css` names only `--ds-*` tokens.
The language comes from `readLazurioLocale()` and `resolveLocale()` of the
design system, with the Organization's default in `src/instance.ts`.

## Decks

`bun run deck:build` puts the design system into each built deck, so a deck
opens offline and from a file:

- `assets/deck.css` starts with the package's `styles.css`, its imports
  inlined: the colour roles of both themes as `--ds-color-*`, the fonts and
  the base styles. A slide's tone is the design system's `data-theme`
  (`light` or `dark`); the page itself is `data-theme="light"`.
- Then the slide scale, generated from `design-system/tokens`: the type
  roles (`hero`, `display`, `title`, `lead`, `body`, `body-sm`, `label`,
  `meta`, `status`), the spacing and the radii at twice their size for the
  1920 × 1080 slide, as `--slide-*` custom properties
  (`app/v1/src/deck/theme.ts`).
- Then the layout of the slide types (`app/v1/src/deck/deck.css`), which
  names only those roles and scales.
- `assets/fonts/` holds the package's font files with their licenses,
  unchanged.
- The deck's controls are the design system's buttons and icons.

The decks keep the design system's rules: no uppercase and no eyebrow labels
above headings (a slide's running head sits at its top), hairlines instead
of shadows, one black action, the accent only where it marks something.

## Another design system

An Organization that has its own design system (its adopted
`LazurioTemplates/design-system`, released at a tag) changes one line in
`app/v1/package.json` and runs `bun install`, `bun run deck:build` and
`bun run check`:

```json
"design-system": "git+ssh://git@github.com/<Organization>/design-system.git#v<version>"
```

The imports stay the same, because both packages are named
`design-system`. A new brand is a new release of that design system and a
new pin here. See [extending.md](extending.md#the-design-system).

Font licenses cover the font files only. The template is distributed under
the MIT License; the license grants no right to the Lazurio name and marks,
see [NOTICE](../NOTICE).
