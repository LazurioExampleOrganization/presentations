---
name: deck-from-sources
description: "Use when someone asks for a new presentation (a deck, slides, a pitch, an offer, a project update) from their material in this Presentations module. Agrees the purpose, audience, language and approved sources first, proposes an outline from the module's slide types, writes deck.source.json, builds it with bun run deck:build, makes the first-slide previews, checks the deck in a browser and prepares a pull request. Never invents facts, figures, quotes or identity; publishes nothing without the person's instruction."
---

# Prepare a deck from sources

The deck format, every slide type and its limits are in
[`docs/slide-types.md`](../../../docs/slide-types.md). Read it first.

## 1. Agree the brief

Ask in one message and wait for the answers:

- the purpose and the outcome the person wants (a decision, a meeting, an
  order);
- the audience;
- the language: Czech, English or both (both means every text twice);
- the approved sources: files, Knowledgebase pages, earlier decks, links;
- who presents and who is the contact on the closing slide.

Without approved sources, do not start writing slides.

## 2. Read the sources and keep to them

Read every source. Each claim, number, quote, client name and logo on a
slide must come from them. When something is missing, ask; never invent it
and never fill a gap with a plausible number. Use the Organization's
Knowledgebase for facts and its design system for the look where they
exist. Quotes of real people only with their consent.

## 3. Propose the outline

Write the outline as a numbered list, one line per slide:
`type — the slide's conclusion in one sentence`. Headings state a
conclusion ("Setup takes one morning"), not a topic ("Setup"). A common arc:
`title → problem → metrics → section → options → timeline → case → quote →
closing → appendix`. Use only the eleven types; when something fits none,
say so instead of bending a type. Show the outline and wait for approval.

## 4. Write the source

In a task worktree of the module, on a branch:

1. Create `data/v1/decks/<YYYY-MM-DD>-<slug>/deck.source.json` (lowercase
   slug, today's date from `date -u`). `status` is `draft` until the person
   approves the deck; `sources` names what you used.
2. Put images, videos, posters and captions into `media/` of the deck: own
   or licensed only, with their origin in `media/README.md`. No music or
   sound effects without a verified license.
3. In `app/v1`: `bun run deck:build <slug>`. Fix what it reports; each error
   names its field.

## 5. Previews and checks

1. For each language a JPEG of slide 1, 1280 × 720, without the controls:
   `app/v1/public/previews/<slug>.jpg` for the primary language and
   `<slug>.<language>.jpg` for each further one. Open the built page in a
   browser at a 1280 × 720 viewport, hide `.deck-controls` and
   `.deck-progress`, take a screenshot and save it as JPEG.
2. `bun run check` in `app/v1`.
3. Open the deck through the App (`bun run dev` on a free port with the
   `LAZURIO_RUNTIME_LISTENER_WEB_*` variables, or the module's URL) and look
   at every slide in every language: text that overflows, a video that does
   not play, the print preview.

## 6. Hand over

Push, open a Draft pull request, describe the deck (outline, sources,
what is still a placeholder) and show it to the person. Switch it to Ready
when it is done. Merging the deck, sending it or its link to anyone outside,
or publishing it is the person's Publication: only on their explicit
instruction.
