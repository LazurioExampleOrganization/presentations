# Release procedure

This repository is the template's source. Its history starts with one clean
commit; everything after it arrives through reviewed pull requests.

1. Merge the release changes through a reviewed PR. Run the full validation
   from AGENTS.md on the merged commit.
2. Audit the tree to be published: `git ls-tree -r <commit>` and its content,
   as in [the listing checklist](marketplace.md).
3. Enable immutable releases in the repository settings before the first
   release.
4. With the owner's explicit approval: tag `v<version>` (annotated) on the
   commit and create the GitHub Release from CHANGELOG.md. Record the full
   commit and the SHA-256 of the release's source archive.
5. Pin the catalog entry to that tag, commit and digest through its own
   reviewed PR in the Marketplace registry.

Visibility change, release and catalog publication are separate publication
steps; each needs the owner's explicit instruction. A mistaken release is
withdrawn from the catalog and superseded by a fixed version, never rewritten.
