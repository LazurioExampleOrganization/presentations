import { afterAll, expect, test } from "bun:test";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { designSystemPinProblems } from "./support/design-system-pin.ts";
import { freshCheckout, IS_NESTED_RUN } from "./support/fresh-checkout.ts";

// docs/adoption.md and docs/design-system.md: an Organization adopts the
// template with its own identity and, once it has released its own design
// system, pins that over SSH. The module's suite must pass there: the tests
// of the template alone skip (support/template.ts), every other test runs
// with the Organization's identity and pin.
const ORG = "Example-Org";
const SPEC = `git+ssh://git@github.com/${ORG}/design-system.git#v2.1.0`;
// The full commit Bun 1.4.4 records for the tag of a git+ssh dependency.
const COMMIT = "0123456789abcdef0123456789abcdef01234567";

const checkout = IS_NESTED_RUN ? null : freshCheckout("presentations-adopted");
afterAll(() => checkout?.dispose());

const json = (path: string, change: (value: Record<string, unknown>) => void) => {
  const value = JSON.parse(readFileSync(path, "utf8"));
  change(value);
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
};

test.skipIf(IS_NESTED_RUN)(
  "an adopted module with its own identity and its Organization's design system over SSH passes its checks",
  () => {
    if (!checkout) throw new Error("no fresh checkout");
    const { root, app } = checkout;
    json(join(root, "lazurio.module.json"), (manifest) => {
      manifest.company = ORG;
    });
    let previous = "";
    json(join(app, "package.json"), (pkg) => {
      const runtime = (pkg.lazurio as { runtime: Record<string, string> }).runtime;
      runtime.company = ORG;
      runtime.id = "example-org-presentations-v1";
      const dependencies = pkg.dependencies as Record<string, string>;
      previous = dependencies["design-system"] ?? "";
      dependencies["design-system"] = SPEC;
    });
    // What `bun install` writes for the new pin: the dependency and one entry.
    const lockPath = join(app, "bun.lock");
    const lock = readFileSync(lockPath, "utf8")
      .replace(`"design-system": "${previous}"`, `"design-system": "${SPEC}"`)
      .replace(
        /"design-system": \["design-system@github:[^\n]*\],/,
        `"design-system": ["design-system@git+ssh://git@github.com/${ORG}/design-system.git#${COMMIT}", { "peerDependencies": { "astro": "7.4.5", "react": "19.3.1" }, "optionalPeers": ["astro", "react"] }, "${COMMIT}"],`,
      );
    writeFileSync(lockPath, lock);
    expect(designSystemPinProblems(SPEC, lock)).toEqual([]);

    const { exitCode, output } = checkout.runSuite();
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
