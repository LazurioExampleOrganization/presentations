# Architecture and extraction

One Bun process serves the built React gallery, a same-origin read-only API,
local HTML sources and derived PDFs. Decks are Git-native files. The authoring
button supplies a prompt for an existing Agent; it creates no chat and sends no
data to an API. There is no browser-side mutation or separate content backend.

The gallery/runtime and general containment tests were selected from an
earlier internal presentation library. Its deck store, generated files,
previews, logos, fonts, ledgers, operational instructions and Git history were
excluded. The sample is synthetic. Pinned dependencies come from the
standard module scaffold, including module-kit v0.2.0.

Reuse was chosen because the existing library covers the requested workflow.
A browser editor adds mutable state and editing interfaces without a consumer
requirement; it is deferred. A PPTX-first application adds conversion
dependencies and is outside this initial HTML library.

Important failures: paths/symlinks cannot escape deck/export stores; foreign
Host headers are refused; missing listener settings stop startup; missing
JPEG previews block preparation. Missing metadata and an empty library remain
usable. The seed contract failed against the empty store, then passed against
the actual gallery API with the synthetic sample.

Adoption uses the standard scaffold for repo/slot/lease creation. A controlled
Git merge retains the template base while keeping consumer identity and lease.
Later updates use three-way Git integration and consumer PRs. No grants or
credentials are copied. The consumer can add its own data and adapt the theme.

Local author preview is not proof of a released installation/update in another
Organization. DEV-6593 retains that separate marketplace pilot gate.

The design uses the canonical Lazurio component/token
snapshot and licensed local fonts; see [design provenance](docs/design-system.md).
Runtime/adoption boundaries remain unchanged.
