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
- How the library starts: with the sample deck of the release or empty.
- The language of the Organization's Lazurio (`cs` or `en`): the `locale`
  of the Folder profile (Settings → General). Confirm it with the person.

## 1. Check before changing anything

1. Read the target Organization's `AGENTS.md` and module rules.
2. Check live rights of the person and Agent on GitHub: creating a private
   repository in the Organization, pushing to it, and opening a pull request in
   the Organization root (module slot). Where a right is missing, prepare a
   precise request for the person who has it and stop that step; never switch
   identity or widen access.
3. Check the name: the Organization manifest must not already declare the
   module, and no repository `<Organization>/<name>` may exist. Read the
   owner GitHub answers with, not only the status:

   ```sh
   gh api repos/<Organization>/<name> --jq .full_name
   ```

   A 404 means the name is free. A `full_name` other than
   `<Organization>/<name>` (compared case-insensitively) is free too: GitHub
   keeps a redirect for a repository that moved to another owner, and this
   template itself moved from an Organization to `LazurioTemplates`. Creating
   the new repository ends that redirect for old links; say so in the plan.
   Only an answer with `<Organization>/<name>` itself is a collision: keep the
   existing module untouched and agree another name.
4. Verify the release: the tag must resolve to the full commit the
   Marketplace entry records. For an annotated tag compare its peeled
   `^{}` line:

   ```sh
   git ls-remote https://github.com/LazurioTemplates/presentations.git "refs/tags/v<version>*"
   ```

   A mismatch stops adoption. The registry carries an `artifactDigest` field,
   but it records none yet (`null`) and Lazurio does not verify it; once an
   entry records a digest, also compare it with the SHA-256 of the release's
   source archive.
5. Check compatibility: the Organization's Environments run a Lazurio release
   that knows `start_script` and `build_output` (LazurioPlatform v0.1.11 or
   newer). Lazurio fetches the pinned Bun when it is missing.
6. Show the person the plan: release, target Organization, private
   repository, module slot, the Teams that get access (chosen with the person
   from the Organization's real list, `gh api orgs/<Organization>/teams --jq
   '.[].slug'`, never guessed), and that the template's code will run in
   their Environment. Continue only after their approval.

## 2. Create the module

In a task worktree of the Organization root, run the dry run with the
Organization form, which needs `--teams`:

```sh
lazurio module create <Organization>/<name> --stack vite-react --teams <team,team> --dry-run --json
```

Review its plan with the person, then run the same command with
`--confirm <plan>` instead of `--dry-run` (its `next_steps` name the exact
command). The scaffold owns the repository, identity, port lease and the
slot in the Organization root; the Teams it names get Write on the new
repository, as for every module.

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
- Take the template's app source, tests, design snapshot, design system
  subtree (`design-system/`), skills (`.agents/skills/`, `.claude/skills/`),
  sample deck and previews. Remove the scaffold greeting and its test; the
  template serves through one Bun server and uses Vite only for the build.
- Language: set `language` in `app/v1/src/instance.ts` to the confirmed
  language. Where the App's origin answers `/.lazurio/shell.json`, its
  `locale` wins.
- Empty start: remove `data/v1/decks/2026-11-02-example-office-coffee/`,
  its two previews `app/v1/public/previews/2026-11-02-example-office-coffee.jpg`
  and `app/v1/public/previews/2026-11-02-example-office-coffee.en.jpg`, and
  `app/v1/tests/sample-deck.test.ts`. Nothing else names the sample, and
  `data/v1/decks/.gitkeep` keeps the empty library in Git;
  `tests/empty-start.test.ts` checks exactly this path.
- The design system: decks wear the brand of `design-system/`, the invented
  Example until the Organization makes it its own. For its own brand,
  follow `design-system/docs/adoption.md` step 7 inside `design-system/` in
  a later pull request, then `bun run deck:build`.
- Record the adopted release (tag and commit) in the module README.

Then in `app/v1`: `bun install --frozen-lockfile` and `bun run check` (it
also builds the client and starts the built version once). Push and open a
pull request for the person to review. Merge nothing yourself.

## 4. Activate after approval

After the person merges the module PR and the slot PR in the Organization
root, run `lazurio module setup <module-root> --root <Lazurio-root> --json`
and `lazurio module start <Organization>/<module> --json`. From `main`
Lazurio builds the client (`build` → `dist`) and starts the production
server (`start`), which serves that build. Open the returned URL and check
the library, the detail with its personal version, the Agent brief and
presenting a deck, in the Organization's language.
Adoption is done only when this works; a clone or a health check is not
enough.

The last step is access: confirm or change which Teams reach the module the
same way as for every other module of the Organization, in the Organization
overview (Přehled Organizace) of Lazurio, and only on the person's
instruction. The Marketplace has no access model of its own.

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
