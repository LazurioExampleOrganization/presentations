import { describe, expect, test } from "bun:test";
import { designSystemPinProblems, parseDesignSystemPin } from "./support/design-system-pin.ts";

// docs/design-system.md: the template pins the public design system, an
// adopted module may pin its Organization's own over SSH. Both forms are a
// released tag with a lock in the format Bun 1.4.4 writes for it.
const COMMIT = "05bc729581bd1aa1060b73fe8e03b3c38a56dcd3";
const peers = '{ "peerDependencies": { "astro": "7.4.5", "react": "19.3.1" } }';

const githubLock = (spec: string, owner: string, repo: string) =>
  `"dependencies": {\n  "design-system": "${spec}",\n},\n` +
  `"design-system": ["design-system@github:${owner}/${repo}#23af5a3", ${peers}, "${owner}-${repo}-23af5a3", "sha512-gxn6K7t2+8fiX25t2Lpjn02+GK0z0dUPlBRcj8hsTaR5pCdzHj96RyKbcyW9lC2nh5Ei4J34/37mHcd4hnXXRw=="],\n`;
const sshLock = (spec: string, owner: string, repo: string, commit = COMMIT, again = COMMIT) =>
  `"dependencies": {\n  "design-system": "${spec}",\n},\n` +
  `"design-system": ["design-system@git+ssh://git@github.com/${owner}/${repo}.git#${commit}", ${peers}, "${again}"],\n`;

describe("the design system pin", () => {
  test("the template's public release with its lock", () => {
    const spec = "github:LazurioTemplates/design-system#v2.0.0";
    expect(parseDesignSystemPin(spec)?.form).toBe("github");
    expect(
      designSystemPinProblems(spec, githubLock(spec, "LazurioTemplates", "design-system")),
    ).toEqual([]);
  });

  test("an adopted module on its Organization's own release over SSH, with its lock", () => {
    const spec = "git+ssh://git@github.com/Example-Org/design-system.git#v2.1.0";
    expect(parseDesignSystemPin(spec)).toEqual({
      form: "git+ssh",
      owner: "Example-Org",
      repo: "design-system",
      tag: "v2.1.0",
    });
    expect(designSystemPinProblems(spec, sshLock(spec, "Example-Org", "design-system"))).toEqual(
      [],
    );
  });

  test.each([
    "github:LazurioTemplates/design-system#main",
    `github:LazurioTemplates/design-system#${COMMIT}`,
    "git+ssh://git@github.com/Example-Org/design-system.git#main",
    "git+ssh://git@github.com/Example-Org/design-system.git",
    "git+https://github.com/Example-Org/design-system.git#v2.1.0",
    "file:../design-system",
    "../design-system",
    "2.0.0",
    undefined,
  ])("refuses a pin that is no released tag of a supported form: %p", (spec) => {
    expect(parseDesignSystemPin(spec)).toBeNull();
    expect(designSystemPinProblems(spec, "")).toHaveLength(1);
  });

  test("refuses a lock that does not belong to the pin", () => {
    const spec = "git+ssh://git@github.com/Example-Org/design-system.git#v2.1.0";
    // Still the template's lock: bun install was not run after the change.
    const stale = githubLock(
      "github:LazurioTemplates/design-system#v2.0.0",
      "LazurioTemplates",
      "design-system",
    );
    expect(designSystemPinProblems(spec, stale)).toHaveLength(2);
    // Another Organization's repository, a short commit, two different commits.
    expect(designSystemPinProblems(spec, sshLock(spec, "Other-Org", "design-system"))).toHaveLength(
      1,
    );
    expect(
      designSystemPinProblems(
        spec,
        sshLock(spec, "Example-Org", "design-system", "05bc729", "05bc729"),
      ),
    ).toHaveLength(1);
    expect(
      designSystemPinProblems(
        spec,
        sshLock(spec, "Example-Org", "design-system", COMMIT, "0".repeat(40)),
      ),
    ).toHaveLength(1);
    // A github: lock without the tarball's checksum.
    const github = "github:LazurioTemplates/design-system#v2.0.0";
    const noChecksum = githubLock(github, "LazurioTemplates", "design-system").replace(
      /, "sha512-[^"]+"/,
      "",
    );
    expect(designSystemPinProblems(github, noChecksum)).toHaveLength(1);
  });
});
