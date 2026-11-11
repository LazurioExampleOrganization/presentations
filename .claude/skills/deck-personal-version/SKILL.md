---
name: deck-personal-version
description: "Use when someone wants a presentation prepared for one prospect or client, with the prospect's name and Organization on the title and closing slides. Always asks the person first, builds a link with ?for= and ?org= on the deck's page in the prospect's language, checks it in a browser and stores or sends nothing."
---

# Prepare a personal version for a prospect

A personal version is a link, not a copy: the deck's page with the
prospect's name and Organization in its address. The title and closing
slides then say "Připraveno pro …" or "Prepared for …". Nothing is written
into the deck, Git or any store.

## 1. Ask first, every time

Never make a personal version on your own initiative. Ask the person:

- which deck;
- the prospect's name and Organization exactly as they should appear
  (at most 80 characters each);
- the language of the prospect (the deck must have it).

Wait for the answer. A name is personal data: do not put it in
`deck.source.json`, a commit, an issue or a file. If the person wants a
lasting deck made for one client, that is a new deck (skill
`deck-from-sources`) and their decision.

## 2. Build the link

- The deck's page: `/decks/<slug>/` for its primary language,
  `/decks/<slug>/index.<language>.html` for another one (`deck.meta.json`,
  `variants`).
- Add `for=<name>` and `org=<organization>`, URL-encoded
  (`encodeURIComponent`), for example
  `/decks/2026-11-02-example-office-coffee/index.en.html?for=Jane%20Doe&org=Sample%20Studio`.
  The Czech names `pro` and `firma` work too.
- Prefix the module's own address (its `runtime.url`). The library's detail
  panel ("Osobní verze" / "Personal version") builds the same link.

## 3. Check it

Open the link in a browser: the title and closing slides show the line, in
the deck's language, and no other slide changes. A link with a slide number
(`#7`) opens that slide.

## 4. Hand over

The module is internal: the link opens only for people with access to it.
For a prospect outside, present it live, or open the personal link, choose
Print / PDF and give the PDF to the person. Write the message for the
prospect if asked, but sending anything (link, PDF, e-mail) is the person's
Publication: only on their explicit instruction.
