# Release procedure

This repository is the template's source. Its history starts with one clean
commit; everything after it arrives through reviewed pull requests.

1. Merge the release changes through a reviewed PR. Run the full validation
   from AGENTS.md on the merged commit.
2. Prepare the release commit in its own reviewed PR (`release/v<version>`):
   the CHANGELOG heading gets the date (`## <version> — YYYY-MM-DD`) and the
   **Status** line of [marketplace.md](marketplace.md) names the version as
   published, so the tag never calls its own release unreleased.
   `tests/template.test.ts` fails while the two disagree.
3. Audit the tree to be published: `git ls-tree -r <commit>` and its content,
   as in [the listing checklist](marketplace.md).
4. Enable immutable releases in the repository settings before the first
   release.
5. With the owner's explicit approval: tag `v<version>` (annotated) on the
   commit and create the GitHub Release from CHANGELOG.md. Record the full
   commit the tag points to.
6. Pin the catalog entry to that tag and commit through its own reviewed PR
   in the Marketplace registry. The entry's `artifactDigest` stays `null`
   until the registry records attested artifacts.

Visibility change, release and catalog publication are separate publication
steps; each needs the owner's explicit instruction. A mistaken release is
withdrawn from the catalog and superseded by a fixed version, never rewritten.
