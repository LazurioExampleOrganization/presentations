---
name: deck-add-slide
description: "Use when someone wants to add a slide of a given type (title, section, problem, quote, options, case, timeline, metrics, video, appendix, closing) to an existing deck of this Presentations module, or asks what a slide type can hold. Writes it into deck.source.json in every language of the deck, rebuilds and checks the deck and prepares a pull request."
---

# Add a slide of a given type

## 1. Find the deck and the type

- The deck is `data/v1/decks/<slug>/deck.source.json`. A deck without that
  file is hand-written HTML from release 0.1: offer to convert it into a
  source first (skill `deck-from-sources`, the same slides), and edit the
  HTML directly only if the person prefers.
- Read the type's fields and limits in
  [`docs/slide-types.md`](../../../docs/slide-types.md). When the request
  fits none of the eleven types, say so; a new type is a code change of the
  module ([`docs/extending.md`](../../../docs/extending.md), "Adding a slide
  type"), not a stretched existing one.

## 2. Write the slide

- Agree its place in the deck and its content with the person; facts,
  numbers and quotes only from approved sources.
- Insert it into `slides` at that place, with a text for every language in
  `languages`. Its heading states a conclusion.
- Media into the deck's `media/`, own or licensed, origin in
  `media/README.md`. A video needs a poster; sound only with `"audio": true`
  and never on its own.

## 3. Build and check

In `app/v1`, in a task worktree:

1. `bun run deck:build <slug>`; fix what it names.
2. When slide 1 changed, retake the previews (skill `deck-from-sources`,
   step 5).
3. `bun run check`, then look at the new slide in every language in a
   browser, and at the print preview when the deck is printed.

## 4. Hand over

Push, open a pull request and show the slide to the person. Merging it is
their Publication.
