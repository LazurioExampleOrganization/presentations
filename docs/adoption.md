# Controlled adoption and updates

This is an Agent-led private pilot, not an installer. Resolve the license gate
before someone outside the authorized private pilot receives or executes it.

The human chooses destination Organization/name. Read its rules; check live
rights, collisions and compatibility. In its Organization task worktree, run
`lazurio module create --stack vite-react` with the exact Organization/module
selector (review the dry-run first). The scaffold owns repo identity and lease;
repo/slot activation follow the normal Admin and PR flow.

In the new module task worktree, fetch the reviewed template commit into a
`template` remote and merge with `--allow-unrelated-histories`. Keep it as an
ancestor; do not squash or re-copy the module. Reconcile overlapping files:

- Keep scaffold identity/company/lease in `lazurio.module.json`; adopt template
  app paths. Retain runtime ID/company/module in `app/v1/package.json`, while
  adopting template dependencies, scripts, preparation and the `web` listener.
- Adopt app source, seed and preview. Remove the scaffold greeting/test and
  Vite serving contract; the gallery uses one Bun server and Vite build only.
- Honor receiving agent rules. Adapt local tokens through its design system;
  never import another Organization at runtime.

Frozen install, check, prepare and test. Record the exact template commit in
the consumer README and prove ancestry. After slot activation, `lazurio module
setup <consumer-root> --root <Lazurio-root> --json` must pass. Start with `lazurio
module start <Organization>/<module> --json` and open its returned URL. A
pre-activation contract preview is not lifecycle/installation acceptance.

If activation is partial, preserve a precise resume point. Never delete others'
repos/data or force protected branches. The human publishes reviewed PRs.

Updates fetch another immutable commit into a consumer worktree and merge
upstream normally. Preserve identity, configuration and existing decks. Review
conflicts and show the preview. Prove that a local deck and code customization
survive a non-conflicting update and a genuine conflict before claiming pilot
completion. Declining the PR keeps current code. Rollback is a reviewed revert
preserving data, never a hard reset or wholesale copy.
