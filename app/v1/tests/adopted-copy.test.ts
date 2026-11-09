import { afterAll, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { adopt } from "./support/adoption.ts";
import { designSystemPinProblems } from "./support/design-system-pin.ts";
import { freshCheckout, IS_NESTED_RUN } from "./support/fresh-checkout.ts";
import { IS_TEMPLATE } from "./support/template.ts";

// docs/adoption.md and docs/design-system.md: an Organization adopts the
// template with its own identity and pins its design system over SSH. The
// module's suite must pass there: the tests of the template alone skip
// (support/template.ts), every other test runs with the Organization's
// identity and pin. The copies link this checkout's installed packages, so
// they check the module's code and its pin, not another design system's.
const ORGANIZATION = { organization: "Example-Org", slug: "example-org" };
// The full commit Bun 1.4.4 records for the tag of a git+ssh dependency.
const ORG_RELEASE = {
  spec: "git+ssh://git@github.com/Example-Org/design-system.git#v2.1.0",
  commit: "0123456789abcdef0123456789abcdef01234567",
};
// The public release over SSH, what `bun install` writes for it.
const PUBLIC_OVER_SSH = {
  spec: "git+ssh://git@github.com/LazurioTemplates/design-system.git#v2.0.0",
  commit: "05bc729581bd1aa1060b73fe8e03b3c38a56dcd3",
};

const copies: { dispose(): void }[] = [];
afterAll(() => {
  for (const copy of copies) copy.dispose();
});

function adoptedCopy(prefix: string, release: { spec: string; commit: string }) {
  const copy = freshCheckout(prefix);
  copies.push(copy);
  adopt(copy.root, { ...ORGANIZATION, ...release });
  const lock = readFileSync(join(copy.app, "bun.lock"), "utf8");
  expect(designSystemPinProblems(release.spec, lock)).toEqual([]);
  return copy;
}

// From whatever this module pins now (the template's github: lock, or an
// adopted module's git+ssh lock) to the Organization's own release.
test.skipIf(IS_NESTED_RUN)(
  "this module, adopted with its Organization's identity and design system over SSH, passes its checks",
  () => {
    const { exitCode, output } = adoptedCopy("presentations-adopted", ORG_RELEASE).runSuite();
    expect(exitCode, output).toBe(0);
    expect(output).toMatch(/\b0 fail\b/);
    expect(output).toMatch(/\(pass\) the design system is a dependency on a released tag/);
    expect(output).toMatch(
      /\(skip\) template contract > the template pins the public design system release/,
    );
    expect(output).toMatch(
      /\(skip\) template contract > the Organization's identity is placeholders/,
    );
  },
  240_000,
);

// The adopted starting state of the review (presentations#5): a module that
// already pins over SSH runs its whole check, this test and the empty start
// included, which then start from its git+ssh lock.
test.skipIf(IS_NESTED_RUN || !IS_TEMPLATE)(
  "a module adopted with an SSH pin passes its whole check, the adoption and empty-start tests included",
  () => {
    const { exitCode, output } = adoptedCopy("presentations-ssh", PUBLIC_OVER_SSH).runSuite(false);
    expect(exitCode, output).toBe(0);
    expect(output).toMatch(/\b0 fail\b/);
    expect(output).toMatch(
      /\(pass\) this module, adopted with its Organization's identity and design system over SSH, passes its checks/,
    );
    expect(output).toMatch(/\(pass\) an empty start as docs\/adoption\.md describes it passes/);
  },
  420_000,
);
