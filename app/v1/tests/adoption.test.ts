import { describe, expect, test } from "bun:test";
import { repinDesignSystem } from "./support/adoption.ts";
import { designSystemPinProblems } from "./support/design-system-pin.ts";

// The lock rewrite of tests/adopted-copy.test.ts starts from either form an
// adopted module may have: the template's github: lock, or a git+ssh lock.
// Both locks are in the format Bun 1.4.4 writes.
const META =
  '{ "peerDependencies": { "astro": "7.4.5", "react": "19.3.1" }, "optionalPeers": ["astro", "react"] }';
const lockWith = (dependency: string, entry: string) => `{
  "lockfileVersion": 2,
  "workspaces": {
    "": {
      "name": "presentations-app-v1",
      "dependencies": {
        "@lazurio/module-kit": "github:Lazurio/module-kit#v0.2.0",
        "design-system": "${dependency}",
        "react": "19.3.1",
      },
    },
  },
  "packages": {
    "design-system": ${entry},
    "react": ["react@19.3.1", "", {}, "sha512-abc="],
  }
}
`;
const GITHUB_LOCK = lockWith(
  "github:LazurioTemplates/design-system#v2.0.0",
  `["design-system@github:LazurioTemplates/design-system#23af5a3", ${META}, "LazurioTemplates-design-system-23af5a3", "sha512-gxn6K7t2+8fiX25t2Lpjn02+GK0z0dUPlBRcj8hsTaR5pCdzHj96RyKbcyW9lC2nh5Ei4J34/37mHcd4hnXXRw=="]`,
);
const SSH_LOCK = lockWith(
  "git+ssh://git@github.com/LazurioTemplates/design-system.git#v2.0.0",
  `["design-system@git+ssh://git@github.com/LazurioTemplates/design-system.git#05bc729581bd1aa1060b73fe8e03b3c38a56dcd3", ${META}, "05bc729581bd1aa1060b73fe8e03b3c38a56dcd3"]`,
);
const SPEC = "git+ssh://git@github.com/Example-Org/design-system.git#v2.1.0";
const COMMIT = "0123456789abcdef0123456789abcdef01234567";

describe("repinning the design system in bun.lock", () => {
  test.each([
    ["the template's github: lock", GITHUB_LOCK],
    ["an adopted module's git+ssh lock", SSH_LOCK],
  ])("from %s to the Organization's release over SSH", (_name, lock) => {
    expect(designSystemPinProblems(SPEC, lock)).not.toEqual([]);
    const repinned = repinDesignSystem(lock, SPEC, COMMIT);
    expect(designSystemPinProblems(SPEC, repinned)).toEqual([]);
    expect(repinned).toContain(
      `"design-system": ["design-system@git+ssh://git@github.com/Example-Org/design-system.git#${COMMIT}", ${META}, "${COMMIT}"],`,
    );
    // Nothing else of the lock changes.
    const others = (text: string) =>
      text.split("\n").filter((line) => !line.includes('"design-system"'));
    expect(others(repinned)).toEqual(others(lock));
  });

  test("from the public release over SSH, as bun install writes it, the lock is unchanged", () => {
    const spec = "git+ssh://git@github.com/LazurioTemplates/design-system.git#v2.0.0";
    expect(repinDesignSystem(GITHUB_LOCK, spec, "05bc729581bd1aa1060b73fe8e03b3c38a56dcd3")).toBe(
      SSH_LOCK,
    );
  });

  test("refuses a lock without exactly one design system, a github: target and a short commit", () => {
    expect(() => repinDesignSystem("{}", SPEC, COMMIT)).toThrow("expected one each");
    expect(() =>
      repinDesignSystem(GITHUB_LOCK, "github:Example-Org/design-system#v2.1.0", COMMIT),
    ).toThrow("only a git+ssh pin");
    expect(() => repinDesignSystem(GITHUB_LOCK, SPEC, "0123456")).toThrow("not a full commit");
  });
});
