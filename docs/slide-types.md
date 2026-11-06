# Slide types and the deck source

A deck built from source lives in `data/v1/decks/<YYYY-MM-DD>-<slug>/`:

| Path | Who writes it |
| --- | --- |
| `deck.source.json` | people and agents: the deck's words and slides |
| `media/` | people and agents: images, videos, posters, captions (own or licensed, origin in `media/README.md`) |
| `index.html`, `index.<language>.html`, `deck.meta.json`, `assets/` | `bun run deck:build` only; never edit them by hand |

In `app/v1`: `bun run deck:build <slug>` builds one deck, `bun run deck:build`
every deck with a source, `bun run deck:check` changes nothing and fails when
a built deck differs from its source (`bun run check` runs the same test).
An error names the field, for example `deck.slides[3].points[1].title.en`.

A deck written by hand (an `index.html` without `deck.source.json`, as in
release 0.1) still works in the library; the build leaves it alone.

## The deck

```json
{
  "schema_version": "lazurio.presentation.source.v1",
  "languages": ["cs", "en"],
  "title": { "cs": "…", "en": "…" },
  "purpose": "offer",
  "status": "draft",
  "owner": "…",
  "audience": ["…"],
  "sources": ["…"],
  "primary_goal": "…",
  "created_at": "2026-11-02",
  "updated_at": "2026-11-06",
  "personal": true,
  "slides": []
}
```

- `languages`: `cs`, `en` or both; the first is the primary language and
  becomes `index.html`, every further one `index.<language>.html`.
- **Text** is either one string, the same in every language (a number, a
  name), or an object with one string per language of the deck, nothing
  more and nothing less. Never put Czech words in a plain string of a
  bilingual deck: the English page would show them.
- `purpose` and `status` are lowercase codes; the library translates the
  known ones (`offer`, `project-proposal`, `draft`, `working-draft`,
  `final`, `synthetic-example`) and shows others as they are.
- `personal: false` turns the "Prepared for …" line off (default on).
- 1 to 60 slides. Every slide may add `tone` (`light` or `dark`; title,
  section and closing are dark by default) and `notes` (speaker notes, kept
  in the page but never shown).

## The eleven slide types

| Type | Use it for | Fields (`?` optional) | Limits |
| --- | --- | --- | --- |
| `title` | the opening | `eyebrow?`, `title`, `subtitle?`, `meta?`, `image?` | the "Prepared for" line appears under the subtitle |
| `section` | a divider between parts | `label?`, `title`, `lede?` | |
| `problem` | what hurts today | `title`, `lede?`, `points[]` of `{title, text}` | 2–4 points |
| `quote` | one voice of a client or colleague | `quote`, `author`, `role?` | real quotes only with the person's consent |
| `options` | models, variants, packages | `title`, `lede?`, `options[]` of `{name, summary?, points[], badge?, highlight?}` | 2–4 options, 1–5 points each, at most one `highlight` |
| `case` | a case study | `client`, `title`, `context?`, `challenge`, `solution`, `results[]` of `{value, label, note?}`, `image?` | 1–3 results |
| `timeline` | how cooperation goes, a plan | `title`, `lede?`, `steps[]` of `{when?, title, text?}` | 2–6 steps; they appear one by one |
| `metrics` | growth and numbers | `title`, `lede?`, `metrics[]` of `{value, label, note?}`, `chart?` of `{label, unit?, bars[] of {label, value}}` | 1–4 metrics, 2–8 bars; the last bar is the current one, in the accent colour |
| `video` | a local video | `title`, `lede?`, `video` of `{src, poster, captions?, audio?, autoplay?}` | `.mp4` or `.webm` and a poster image in `media/` |
| `appendix` | detail for questions | `title`, `lede?`, `items[]` of `{title, text}`, `table?` of `{columns[], rows[][]}` | items or a table or both; 2–5 columns, 1–8 rows |
| `closing` | the ask and the contact | `title`, `lede?`, `contact?` of `{name, role?, email?, phone?}`, `actions[]` of `{label, href}` | 1–2 actions; `href` is `https://`, `mailto:` or `tel:` |

Images (`image`, `poster`) are `{ "src": "media/<file>", "alt": <text> }`
for `image` and a plain `media/<file>` for a poster; `.jpg`, `.png`,
`.webp` or `.svg`.

## Video

- Local files only, in `media/`; no streaming service and no network.
- A video starts **muted** when its slide opens and stops when the slide
  closes; with `"autoplay": false` it waits for Play. Reduced motion starts
  nothing by itself.
- Sound never starts by itself. Only a video with `"audio": true` shows the
  sound button.
- `captions` names a WebVTT file per language (`{"cs": "media/x.cs.vtt"}`).
- Printing shows the poster instead of the video.
- Music, sound effects and footage of third parties only with a verified
  license recorded in `media/README.md`; otherwise none.

## Presenting, printing and the personal version

- Keys: → / Space / Page Down next, ← / Page Up back, Home, End, F full
  screen. A swipe moves one slide on a touch screen. The address keeps the
  slide (`#5`), so a link can open a given slide.
- Print / PDF prints one 16:9 page per slide without the controls.
- A personal version is only a link: `?for=<name>&org=<organization>` (in
  Czech also `?pro=…&firma=…`) on the deck's page shows "Prepared for …" /
  "Připraveno pro …" on the title and closing slides. Nothing is stored;
  each value is plain text of at most 80 characters.
- A deck in two languages has a switch to the other language that keeps the
  slide and the personal link.

## Look

Colours, type scale, spacing and radii come from the module's design system
(`design-system/content/brand/colors/tokens.json`, read through
`design-system/app/v1/src/tokens.ts`), at twice its screen size for the
1920 × 1080 slide. Change the look in the design system, then rebuild the
decks; never edit `assets/deck.css`.
