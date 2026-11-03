# Extending Presentations

How to develop an adopted Presentations module (or this template) without
unplanned migrations. Only two kinds of stack change exist: a **profile
release** (tool versions inside one generation) and a **generation change**
(the data layer). Everything else stays within the pinned stack.

This release follows the stack profile `app@2026.11`
([Lazurio stack profiles](https://github.com/Lazurio/LazurioPlatform/blob/main/docs/stack-profiles.md#app)):
Bun 1.4.4, TypeScript 7.0.2, Biome 2.6.4, Vite 8.3.5 and React 19.3.1.

## Within generation v1

`app/v1` has no own data layer: decks are Git files in `data/v1/decks/`.
Typical changes that stay in v1:

- New presentations: a new `data/v1/decks/<date-slug>/` with a real
  first-slide JPEG in `app/v1/public/previews/`. See [AGENTS.md](../AGENTS.md).
- Your own visual identity: add your design system's files next to the deck
  or replace the snapshot in a reviewed change; update `NOTICE` and the
  resource contract test.
- UI and API changes in `app/v1/src`, with tests in `app/v1/tests`.
- Security patch versions of a dependency, exact pin, with `bun.lock`.

Every change: task worktree, `bun run check` green, browser check of the
affected screens, pull request.

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
| v1 / v2 | no own data (this template: decks as files) |
| v3 | records in repository-db, shapes defined once with Zod |
| v4 | Dolt database in the services Environment of the server (or hosted elsewhere as a v4 connection variant) |

Presentations needs v3 only when it gets structured records of its own, for
example review states, comments or a publishing workflow stored as data. The
change then goes like this:

1. Create `app/v3/` next to `app/v1/` from the profile "app with data"
   (repository-db, Zod 4). Keep `app/v1` working.
2. Define the records as Zod schemas, put data access behind a store
   interface and write a migration script that reads the v1 files, validates
   them and writes the v3 records. Verify counts and a round trip.
3. Add `app/v3/package.json` to `apps` in `lazurio.module.json`. Switch
   `default_app` to it only on the person's (or the Organization Steward's)
   instruction. `app/v1` stays as the way back until it is retired in its own
   reviewed change.

Pure UI or deck changes never need a new generation.

## Taking template updates

The template stays an ancestor of your module, so updates are ordinary Git
merges of a release tag:

```sh
git fetch template tag v<new-version>
git merge v<new-version>
```

Do this in a task worktree. Keep your presentations, identity and lease;
resolve conflicts in your own code consciously and run `bun run check`. Read
the release's CHANGELOG entry first: a profile release changes tool versions,
a generation change brings a new `app/v<N>` and its migration. Open a pull
request; declining it keeps your current version.
