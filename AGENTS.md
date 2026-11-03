# Presentations — reusable module

Read the receiving Organization's rules before using its Knowledgebase or
design system. This module never reads another Organization at runtime.

- Keep `app/v1` TypeScript strict and conformant with Lazurio Module Standard.
  `dev` starts one Bun server. Listener settings come from module-kit `web`.
  Build and preview checks belong to explicit preparation.
- Sources are `data/v1/decks/<date-slug>/index.html`, optional local assets,
  `.slide` sections, arrow navigation and print CSS. Optional metadata is
  `deck.meta.json`; approved sources determine facts.
- Ask for purpose, audience, outcome and sources. Show an outline first. Use
  the receiving design system; mark uncertainties rather than inventing claims.
- Preserve the synthetic starter. New work gets its own directory and a real
  first-slide JPEG in `app/v1/public/previews/`. Verify the thumbnail and deck
  with the Environment's approved browser workflow before Ready.
- Derived PDFs go to `generated/v1/decks/<slug>/exports/`. The browser prints
  PDFs; the app does not automatically generate/store them. Empty libraries
  and absent metadata must remain usable.
- Work in a task worktree and PR. Preview, copying the brief or PR submission
  do not authorize publication of presentations or the marketplace listing.
- Adoption keeps the receiving scaffold's identity and allocated lease.
  `ExampleOrganization` and the template lease are reference values only.
- The initial library/starter use Lazurio canonical components and local fonts.
  Never edit the frozen snapshots; follow `docs/design-system.md` to refresh.
- The template is MIT-licensed (LICENSE, NOTICE). The license covers no
  trademark. Keep NOTICE current when adding fonts, assets or vendored files.
- Releases follow `docs/release.md`: annotated tags and GitHub Releases of
  this repository; publication needs explicit human approval.

Validation: frozen install, `bun run check`, `bun run prepare:app`, `bun test`,
then gallery/detail/authoring brief/playback browser smoke and `module setup`
on the registered consumer. No cross-repository runtime imports or `.env*`.
