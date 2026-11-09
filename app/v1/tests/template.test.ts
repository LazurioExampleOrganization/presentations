import { describe, expect, test } from "bun:test";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import packageJson from "../package.json";

// The contract of a Marketplace template (LazurioTemplates): license,
// documents, exact versions, Bun in CI, screens per language, the agents'
// skills, the design system as a package, the listing status and paths that
// check out on Windows.
const root = resolve(import.meta.dir, "..", "..", "..");
const read = (path: string) => readFileSync(join(root, path), "utf8");

/** Width of a WebP image from its header (lossy, lossless or extended). */
function webpWidth(bytes: Uint8Array): number {
  const tag = (offset: number) => String.fromCharCode(...bytes.subarray(offset, offset + 4));
  if (tag(0) !== "RIFF" || tag(8) !== "WEBP") throw new Error("not a WebP file");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  switch (tag(12)) {
    case "VP8 ":
      return view.getUint16(26, true) & 0x3fff;
    case "VP8L":
      return (view.getUint32(21, true) & 0x3fff) + 1;
    case "VP8X":
      return (view.getUint32(24, true) & 0xffffff) + 1;
    default:
      throw new Error(`unknown WebP chunk ${tag(12)}`);
  }
}

describe("template contract", () => {
  test("MIT license of Lazurio contributors, and the documents an adopter needs", () => {
    expect(read("LICENSE")).toContain("MIT License");
    expect(read("LICENSE")).toContain("Lazurio contributors");
    for (const path of [
      "README.md",
      "AGENTS.md",
      "CHANGELOG.md",
      "NOTICE",
      "docs/adoption.md",
      "docs/extending.md",
      "docs/slide-types.md",
      "docs/design-system.md",
    ]) {
      expect(existsSync(join(root, path)), path).toBe(true);
    }
    expect(read("docs/extending.md")).toContain("app@2026.11");
    expect(read("CHANGELOG.md")).toMatch(
      new RegExp(`^## ${packageJson.version.replaceAll(".", "\\.")} `, "m"),
    );
  });

  test("exact versions, the profile's Bun, and CI on the same Bun", () => {
    expect(packageJson.packageManager).toBe("bun@1.4.4");
    const versions = { ...packageJson.dependencies, ...packageJson.devDependencies };
    for (const [name, version] of Object.entries(versions)) {
      expect(version, name).toMatch(/^(\d+\.\d+\.\d+|github:[\w.-]+\/[\w.-]+#v\d+\.\d+\.\d+)$/);
    }
    expect(read(".github/workflows/check.yml")).toContain("bun-version: 1.4.4");
  });

  test("the Organization's identity is placeholders", () => {
    const manifest = JSON.parse(read("lazurio.module.json"));
    expect(manifest.company).toBe("REPLACE-WITH-ORG-NAME");
    expect(manifest.port_leases[0].port).toBe(20000);
    expect(packageJson.lazurio.runtime.company).toBe("REPLACE-WITH-ORG-NAME");
    expect(packageJson.lazurio.runtime.id).toBe("replace-with-org-slug-presentations-v1");
  });

  test("the listing's status names what the CHANGELOG released and proposes", () => {
    const released: string[] = [];
    const proposed: string[] = [];
    for (const [, version, rest] of read("CHANGELOG.md").matchAll(
      /^## (\d+\.\d+\.\d+) — (.+)$/gm,
    )) {
      if (!version || !rest) continue;
      if (/^\d{4}-\d{2}-\d{2}$/.test(rest)) released.push(version);
      else if (rest === "proposed, not released") proposed.push(version);
      else throw new Error(`CHANGELOG ${version}: "${rest}" is neither a date nor proposed`);
    }
    const list = (items: string[]) =>
      items.length < 2 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
    const ascending = (items: string[]) =>
      [...items].sort((a, b) => a.localeCompare(b, "en", { numeric: true }));
    const published = ascending(released);
    expect(published.length).toBeGreaterThan(0);
    let status = `${published.length === 1 ? "release" : "releases"} ${list(published)} published`;
    if (proposed.length > 0) status += `; ${list(ascending(proposed))} proposed, not released`;
    expect(read("docs/marketplace.md")).toContain(`**Status:** ${status}.`);
  });

  test("the same Marketplace screens in Czech and English, WebP 1600 px wide", () => {
    const cs = readdirSync(join(root, "docs/screenshots/cs")).sort();
    const en = readdirSync(join(root, "docs/screenshots/en")).sort();
    expect(cs.length).toBeGreaterThan(0);
    expect(cs.length).toBeLessThanOrEqual(6);
    expect(en).toEqual(cs);
    for (const language of ["cs", "en"]) {
      for (const name of cs) {
        expect(name).toMatch(/^[a-z0-9-]+\.webp$/);
        const bytes = new Uint8Array(readFileSync(join(root, "docs/screenshots", language, name)));
        expect(webpWidth(bytes), `${language}/${name}`).toBe(1600);
      }
    }
  });

  test("the agents' skills, the same for Codex and Claude Code", () => {
    const skills = readdirSync(join(root, ".agents/skills")).sort();
    expect(skills).toEqual(["deck-add-slide", "deck-from-sources", "deck-personal-version"]);
    expect(readdirSync(join(root, ".claude/skills")).sort()).toEqual(skills);
    for (const skill of skills) {
      const text = read(`.agents/skills/${skill}/SKILL.md`);
      expect(read(`.claude/skills/${skill}/SKILL.md`), skill).toBe(text);
      expect(text).toStartWith(`---\nname: ${skill}\ndescription: "`);
    }
  });

  test("the design system is the package at a released tag (tests/design-system.test.ts)", () => {
    expect((packageJson.dependencies as Record<string, string>)["design-system"]).toBe(
      "github:LazurioTemplates/design-system#v2.0.0",
    );
    expect(existsSync(join(root, "design-system"))).toBe(false);
  });

  test("every path checks out on Windows", () => {
    const run = Bun.spawnSync(["git", "-c", "core.quotePath=false", "ls-files"], {
      cwd: root,
      stdout: "pipe",
    });
    const paths = run.stdout.toString().split("\n").filter(Boolean);
    expect(paths.length).toBeGreaterThan(0);
    const seen = new Map<string, string>();
    for (const path of paths) {
      for (const segment of path.split("/")) {
        expect(segment, path).not.toMatch(/[<>:"\\|?*]|[. ]$/);
        expect(segment.toUpperCase(), path).not.toMatch(/^(CON|PRN|AUX|NUL|COM\d|LPT\d)(\.|$)/);
      }
      const folded = path.toLowerCase();
      expect(seen.get(folded) ?? path, `case clash: ${path}`).toBe(path);
      seen.set(folded, path);
    }
  });
});
