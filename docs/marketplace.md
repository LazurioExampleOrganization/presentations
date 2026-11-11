# Presentations — marketplace listing

**Status:** releases 0.1.0, 0.1.1 and 0.2.0 published.
**Author:** Lazurio. **License:** MIT, see [LICENSE](../LICENSE)
and [NOTICE](../NOTICE). **Price:** free. **Source:** this repository,
`LazurioTemplates/presentations`. **Support:** Issues in this repository.

Create presentations with your Agent from your own sources and keep them in
your Organization. Eleven slide types, local video, printing to 16:9 PDF
pages and a personal version for each prospect, in Czech and English. A
sample offer of the invented company Example shows every slide type.

Requires a Lazurio Organization, rights to create its private module
repository and slot (or someone who has them), a Lazurio release that runs
the built version from `main` (LazurioPlatform v0.1.11 or newer), the Bun
version pinned in `app/v1/package.json` and an existing Agent for authoring.
The library requires no App account, API key or external paid integration.
Agent usage and optional hosting have the user's own provider costs.

A visual slide editor, automatic PDF storage, PPTX and automatic updates are
outside v1. No SLA is offered.

## Screenshots

`docs/screenshots/cs/` and `docs/screenshots/en/` hold the same six screens
for the Marketplace card, one set per language: `library.webp`,
`detail.webp` (with a personal version), `agent-brief.webp`,
`slide-title.webp` (a personal title slide), `slide-metrics.webp` and
`slide-video.webp`. They are browser screenshots of this template on
loopback with only its sample deck and invented names, taken at twice the
pixel density and 1600 px wide (WebP, metadata stripped). Retake them
whenever a release changes what the App or the decks look like.

The catalog entry pins the release by its tag and the full commit the tag
points to; its `artifactDigest` stays `null` until the registry records
attested artifacts. A tag or a branch alone is not the release identity.

Before each release:

1. Open a clean consumer of the exact commit. Review gallery, sources,
   first-slide preview, Agent brief, slide playback and printing.
2. Inspect `git ls-tree -r <commit>`: app source/config/tests, synthetic seed,
   matching JPEG, docs, LICENSE/NOTICE and reference manifests. No customer
   content, photos, unlicensed fonts, logos, PDFs or credentials belong here.
   The design system is a dependency (`design-system` in
   `app/v1/package.json`), never files of the tree; built decks carry its
   stylesheet and fonts with their licenses (docs/design-system.md).
3. Update NOTICE when new third-party files enter the tree.
4. Confirm compatibility. Before the first public pilot counts as complete,
   adoption into a second Organization and an update preserving its own changes
   must be verified there; a local preview does not fulfill that gate.
5. Get explicit human approval for the exact content and listing. Review,
   source merge, public release and catalog publication are separate actions.

Changed content requires renewed checks. Preview/copying the brief uploads
nothing. Withdrawing a listing does not remove the customer's own variant.
