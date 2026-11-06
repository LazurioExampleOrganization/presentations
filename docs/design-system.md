# Design

Two looks, each from one source that is never edited here.

## Decks: the module's design system

`design-system/` is a subtree merge of a release of
`LazurioTemplates/design-system` (this release: v1.0.0, the invented brand
Example). The deck build reads `design-system/content/brand/colors/tokens.json`
through the design system's own `design-system/app/v1/src/tokens.ts`: the
colour roles of its light and dark themes, the type scale, spacing, radii,
strokes and motion become CSS custom properties of `assets/deck.css`,
scaled twice for the 1920 × 1080 slide (`width.slide` must be 1920). The
layout in `app/v1/src/deck/deck.css` names roles and scales only.

The design system names its font stack and ships no font files. A deck
must look the same on every projector and offline, so it carries the
template's local fonts (Inter Tight Variable and Geist Mono, SIL OFL 1.1)
ahead of the design system's stack, copied into each deck's `assets/` with
their licenses.

When the Organization adopts its own brand in the design system, or a newer
release of `LazurioTemplates/design-system` arrives (by merging its tag,
see [extending.md](extending.md)), `bun run deck:build` gives every deck
built from source the new look. Never copy values from the design system
into this module.

## The library: the Lazurio snapshot

`app/v1/public/lazurio/` holds a frozen snapshot of the canonical Lazurio
token and component files, so the library looks like the rest of Lazurio.
The snapshot keeps every value of the source but drops its comments, so
`tokens.css` and `components.css` are not byte-identical to the source.
`vendor.lock.json` records the source commit, the Fontsource 5.3.0 font
packages and the hash of every file; a test checks them.

The Module Standard forbids cross-repository imports and the Lazurio design
system has no distributed package, so the files are vendored. Refresh from
a reviewed source commit, update the lock, run the checks and look at the
library in the browser.

Font licenses cover font files only. The template is distributed under the
MIT License; the license grants no right to the Lazurio name and marks, see
[NOTICE](../NOTICE).
