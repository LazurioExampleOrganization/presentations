# Adopting Presentations into an Organization

This is the procedure an Agent follows when a person chooses "Přidat do
Organizace" in the Lazurio Marketplace or asks for this template directly.
It is a guided adoption through Git and pull requests, not an installer. The
Agent prepares; the person approves every merge and activation.

## 0. Inputs

- The exact release: tag `v<version>` and the full commit it points to (from
  the Marketplace entry). A branch name is not a release.
- The target Organization, confirmed by the person, and the module name
  (default `presentations`).
- How the library starts: with the synthetic starter or empty.

## 1. Check before changing anything

1. Read the target Organization's `AGENTS.md` and module rules.
2. Check live rights of the person and Agent on GitHub: creating a private
   repository in the Organization, pushing to it, and opening a pull request in
   the Organization root (module slot). Where a right is missing, prepare a
   precise request for the person who has it and stop that step; never switch
   identity or widen access.
3. Check the name: the Organization manifest must not already declare the
   module and `gh api repos/<Organization>/<name>` must return 404. On a
   collision, keep the existing module untouched and agree another name.
4. Verify the release: the tag resolves to the recorded commit and the
   archive digest matches the Marketplace entry. A mismatch stops adoption.
5. Show the person the plan: release, target Organization, private
   repository, module slot, Teams to be chosen, and that the template's code
   will run in their Environment. Continue only after their approval.

## 2. Create the module

In a task worktree of the Organization root, run
`lazurio module create --stack vite-react` with the exact Organization and
module selector, review the dry-run with the person, then create it. The
scaffold owns the repository, identity and port lease.

## 3. Merge the template so it stays an ancestor

In a task worktree of the new module repository:

```sh
git remote add template https://github.com/LazurioTemplates/presentations.git
git fetch template tag v<version>
git merge --allow-unrelated-histories v<version>
```

Do not squash or copy files over; the merge keeps the release commit as an
ancestor so later releases merge normally. Resolve overlaps:

- `lazurio.module.json`: keep the scaffold's `id`, `company` and
  `port_leases`; take the template's `apps` and `default_app`.
- `app/v1/package.json`: keep the scaffold's `lazurio.runtime.id`, `company`
  and `module`; take the template's dependencies, scripts, `listeners`,
  `preparation` and the rest of `lazurio`.
- Take the template's app source, tests, design snapshot, starter deck and
  preview. Remove the scaffold greeting and its test; the template serves
  through one Bun server and uses Vite only for the build.
- Empty start: remove `data/v1/decks/2026-10-11-project-proposal/` and its
  preview, and adjust `tests/template-seed.test.ts` to expect an empty library.
- Record the adopted release (tag and commit) in the module README.

Then in `app/v1`: `bun install --frozen-lockfile` and `bun run check`. Push
and open a pull request for the person to review. Merge nothing yourself.

## 4. Activate after approval

After the person merges the module PR and the slot PR in the Organization
root, run `lazurio module setup <module-root> --root <Lazurio-root> --json`
and `lazurio module start <Organization>/<module> --json`, open the returned
URL and check the library, detail, Agent brief and playback in the browser.
Adoption is done only when this works; a clone or a health check is not
enough.

The last step is access: grant Teams access to the module the same way as for
every other module of the Organization. The Marketplace has no access model
of its own.

## 5. If something fails

Keep a precise resume point (what exists: repository, branch, PR, slot).
Never delete someone else's repository or data, never force-push a
protected branch and never take over a repository of the same name that the
adoption did not create. Before activation the person may discard the
unmerged draft; after activation, rollback is a reviewed revert that keeps
the Organization's presentations.

## Updates

A later release is adopted the same way as step 3: fetch the new tag into a
task worktree of the module and merge it. The Organization's presentations,
identity and own code changes stay; review any conflict with the person and
show the result in the browser before the PR. Declining the PR keeps the
current version. See [extending.md](extending.md#taking-template-updates).
