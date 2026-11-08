# Presentations — marketplace listing

**Status:** releases 0.1.0 and 0.1.1 published. **Author:** Lazurio.
**License:** MIT, see [LICENSE](../LICENSE) and [NOTICE](../NOTICE).
**Price:** free. **Source:** this repository,
`LazurioTemplates/presentations`. **Support:** Issues in this
repository.

Create presentations with your Agent and keep them in your Organization.
Browse first-slide previews, inspect sources, present HTML slides and print
to PDF. A synthetic four-slide project proposal provides a starting example.

Requires a Lazurio Organization, rights to create its private module repository
and slot (or someone who has them), the Bun version pinned in
`app/v1/package.json` and an existing Agent for authoring. The library requires
no app account, API key or external paid integration. Agent usage and optional
hosting have the user's own provider costs.

Visual editing, automatic PDF generation/storage, PPTX and automatic updates
are outside v1. No SLA is offered.

## Screenshots

`docs/screenshots/` holds the card and detail images for the Marketplace:
`library.webp`, `detail.webp`, `agent-brief.webp` and `slide.webp`. They are
browser screenshots of this template running on loopback with only its
synthetic starter, taken at twice the pixel density and scaled to 1600 px
wide (WebP, metadata stripped). Retake them whenever a release changes what
the app looks like.

The catalog entry pins the release by its tag and the full commit the tag
points to; its `artifactDigest` stays `null` until the registry records
attested artifacts. A tag or a branch alone is not the release identity.

Before each release:

1. Open a clean consumer of the exact commit. Review gallery, sources,
   first-slide preview, Agent brief, slide playback and printing.
2. Inspect `git ls-tree -r <commit>`: app source/config/tests, synthetic seed,
   matching JPEG, docs, LICENSE/NOTICE and reference manifests. No customer
   content, photos, unlicensed fonts, logos, PDFs or credentials belong here.
   The Lazurio design snapshot and separately licensed Fontsource fonts are
   recorded in docs/design-system.md and vendor.lock.json.
3. Update NOTICE when new third-party files enter the tree.
4. Confirm compatibility. Before the first public pilot counts as complete,
   adoption into a second Organization and an update preserving its own changes
   must be verified there; a local preview does not fulfill that gate.
5. Get explicit human approval for the exact content and listing. Review,
   source merge, public release and catalog publication are separate actions.

Changed content requires renewed checks. Preview/copying the brief uploads
nothing. Withdrawing a listing does not remove the customer's own variant.
