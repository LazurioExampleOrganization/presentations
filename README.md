# Presentations

A presentation library with HTML playback and creation through an Agent.
It is free and released under the [MIT License](LICENSE); see [NOTICE](NOTICE)
for fonts and trademarks. Version 0.1.0 is the first template offered in the
Lazurio Marketplace.

Browse first-slide previews, inspect metadata and sources, open HTML slides and
print them to 16:9 PDF pages. “Vytvořit s Agentem” provides a brief to copy into
your existing Agent chat. The Agent agrees an outline, drafts from your
Organization's sources and prepares a PR for you to review.

There is no visual slide editor, AI API integration or automatic publication.
The app needs no credentials or external paid service. Your Environment,
Agent and optional hosting remain subject to your own provider costs.
No SLA is offered.

The seed is a four-slide synthetic project proposal. No customer materials,
photos, logos, prices, PDFs or working repository history are included. The
library and starter use the canonical Lazurio design system with locally hosted
Inter Tight Variable and Geist Mono. See [design provenance](docs/design-system.md);
receiving Organizations can adopt their own approved identity.

In `app/v1`: frozen install, `bun run check`, `bun run prepare:app`, then
`bun test`. Start an adopted module through Lazurio lifecycle. Reference
manifests use an example identity/lease and are not a registered runtime.

See [adoption and updates](docs/adoption.md), [architecture and provenance](ARCHITECTURE.md)
the [marketplace listing](docs/marketplace.md), the [release procedure](docs/release.md)
and the [changelog](CHANGELOG.md). Consumers own their code, configuration and
presentations. Updates are controlled Git/PR merges.

## Support

Report problems and questions as Issues in this repository
(`LazurioExampleOrganization/presentations`). Never attach credentials or your
Organization's presentations to a public issue.
