# Extending Presentations

How to develop an adopted Presentations module (or this template) without
unplanned migrations. Only two kinds of stack change exist: a **profile
release** (tool versions inside one generation) and a **generation change**
(the data layer). Everything else stays within the pinned stack.

This release follows the stack profile `app@2026.11`
([Lazurio stack profiles](https://github.com/Lazurio/LazurioPlatform/blob/main/docs/stack-profiles.md#app)):
Bun 1.4.4, TypeScript 7.0.2, Biome 2.6.4, Vite 8.3.5 and React 19.3.1.

## Within generation v1

`app/v1` has no data layer of its own: decks are Git files in
`data/v1/decks/`. Typical changes that stay in v1:

- **New decks and slides.** Use the skills `deck-from-sources`,
  `deck-add-slide` and `deck-personal-version`; the format is in
  [slide-types.md](slide-types.md). Each deck needs its first-slide previews
  in `app/v1/public/previews/`.
- **The look of decks.** Change the design system (`design-system/`, by
  merging a newer release, see below) and run `bun run deck:build`. The
  layout of the slide types is `app/v1/src/deck/deck.css`.
- **Words of the App.** `app/v1/src/ui-app/i18n.ts` (the library) and
  `app/v1/src/deck/messages.ts` (deck controls), always in both languages;
  a test fails when one language misses a text.
- **The Organization's default language**: `app/v1/src/instance.ts`.
- UI and API changes in `app/v1/src`, with tests in `app/v1/tests`.
- Security patch versions of a dependency, exact pin, with `bun.lock`.

Every change: task worktree, `bun run check` green, a look in the browser
at the affected screens in both languages, pull request.

## Adding a slide type

A new type is a code change of the module, reviewed like any other. Add one
only when no existing type fits; never stretch a type to mean something
else.

1. `app/v1/src/deck/source.ts`: the type (`…Slide`), its place in `Slide`
   and `SLIDE_TYPES`, and its reader in `readers`: every field validated,
   lists with their limits, text through `text()`, media through `media()`.
2. `app/v1/src/deck/slides.ts`: its renderer, every text through `t()` (it
   escapes), and its default tone in `DEFAULT_TONE`. Fixed words of the
   slide go into `DeckMessages` in both languages.
3. `app/v1/src/deck/deck.css`: its layout, with roles and scales only
   (`var(--accent)`, `var(--space-8)`, `var(--type-h2-size)`), never a
   literal colour. Check the print rules.
4. `docs/slide-types.md`: a row in the table with its fields and limits.
5. Tests: add the type to the first test of `tests/deck-source.test.ts`,
   errors for its limits, and use it in a deck with a source (the sample
   deck uses every type, and `tests/deck-build.test.ts` checks that).
6. `bun run deck:build`, then `bun run check`, then look at the slide in the
   browser in both languages and in the print preview.
7. A line in `CHANGELOG.md`.

## Profile releases

Tool versions (Bun, TypeScript, Biome, Vite, React) change only when a new
release of the stack profile appears. The template then ships a new release
with the new pins; an adopted module takes it by merging that release's tag
(see below). Do not raise major or minor versions on your own between
profile releases; your module would drift away from the template and later
merges would conflict.

## Changing generation

A generation is the data layer, not quality:

| Generation | Data |
| --- | --- |
| v1 / v2 | no data layer of their own (this template: decks as files) |
| v3 | records in repository-db, shapes defined once with Zod |
| v4 | Dolt database in the services Environment of the server (or hosted elsewhere as a v4 connection variant) |

Presentations needs v3 only when it gets structured records of its own, for
example review states, comments or a publishing workflow stored as data.
The change then goes like this:

1. Create `app/v3/` next to `app/v1/` from the profile "app with data"
   (repository-db, Zod 4). Keep `app/v1` working.
2. Define the records as Zod schemas, put data access behind a store
   interface and write a migration script that reads the v1 files,
   validates them and writes the v3 records. Verify counts and a round
   trip.
3. Add `app/v3/package.json` to `apps` in `lazurio.module.json`. Switch
   `default_app` to it only on the person's (or the Organization Steward's)
   instruction. `app/v1` stays as the way back until it is retired in its
   own reviewed change.

Pure UI, deck or slide-type changes never need a new generation.

## Taking template updates

The template stays an ancestor of your module, so updates are ordinary Git
merges of a release tag, in a task worktree:

```sh
git fetch https://github.com/LazurioTemplates/presentations.git "refs/tags/v<version>"
test "$(git rev-parse 'FETCH_HEAD^{commit}')" = "<commit from the Marketplace registry>"
git merge --no-ff -m "Presentations: take template release v<version>" 'FETCH_HEAD^{commit}'
```

Keep your decks, identity, lease and `app/v1/src/instance.ts`; resolve
conflicts in your own code consciously; run `bun run deck:build` and
`bun run check`. Read the release's CHANGELOG entry first. Open a pull
request; declining it keeps your current version.

### From 0.1.x to 0.2.0

Release 0.2.0 adds decks built from source, the eleven slide types, video,
personal versions, Czech and English and the design system subtree. What
the merge does and what to decide:

1. **Take 0.1.1 first** if you have not: it brings the built version from
   `main` (`start_script`, `build_output`), which 0.2.0 keeps.
2. **Merge `v0.2.0`.** It adds `design-system/`, `.agents/skills/`,
   `.claude/skills/`, `app/v1/src/deck/`, the sample deck
   `data/v1/decks/2026-11-02-example-office-coffee/` and its previews, and
   deletes the 0.1 starter `2026-10-11-project-proposal` with its preview.
   If you changed the starter and want to keep it, restore it in the merge
   (`git checkout HEAD -- <paths>`); it keeps working as a hand-written
   deck.
3. **Conflicts.** `app/v1/package.json`: keep your `lazurio.runtime` `id`,
   `company` and `module`; take the rest. `app/v1/tests/template-seed.test.ts`
   (the 0.1 starter's checks) is deleted in 0.2.0 together with the starter:
   when Git reports it as modified on your side, delete it. Files of your own
   decks never conflict.
4. **The language.** Set `app/v1/src/instance.ts` `language` to the
   language of your Lazurio (the `locale` of the Folder profile, Settings →
   General) and confirm it with the person.
5. **Your decks.** Hand-written decks from 0.1 keep working unchanged. To
   give one the new slide types, video and both languages, convert it into
   a `deck.source.json` with the skill `deck-from-sources` (same slides,
   same sources) in its own pull request.
6. **The sample deck.** The merge adds it even when your module started
   empty. Keep it, or delete
   `data/v1/decks/2026-11-02-example-office-coffee/`,
   `app/v1/public/previews/2026-11-02-example-office-coffee.jpg`,
   `app/v1/public/previews/2026-11-02-example-office-coffee.en.jpg` and
   `app/v1/tests/sample-deck.test.ts`, exactly as an empty start does
   ([adoption.md](adoption.md)). No other test names the sample, so your own
   decks need no test changes either way; `data/v1/decks/.gitkeep` keeps the
   library's directory.
7. `bun run deck:build`, `bun run check`, a look at the library and a deck
   in both languages, pull request.

## Taking a newer design system

`design-system/` is a subtree merge of `LazurioTemplates/design-system`.
When this template ships a newer design system, it reaches you with the
template's release. To take a design system release yourself (for example
v2.0.0 before this template does):

```sh
git fetch https://github.com/LazurioTemplates/design-system.git "refs/tags/v<version>"
git merge -X subtree=design-system/ --no-ff -m "Design system: take release v<version>" 'FETCH_HEAD^{commit}'
cd app/v1 && bun run deck:build && bun run check
```

`deck:build` refuses a design system whose tokens no longer parse or whose
`width.slide` is not 1920; then adapt `app/v1/src/deck/theme.ts` in the same
pull request. Look at every deck in the browser before the pull request.

## Releasing the template

See [release.md](release.md). The registry checks that this file names the
stack profile `app@2026.11`.
