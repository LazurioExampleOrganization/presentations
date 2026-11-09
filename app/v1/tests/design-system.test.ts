import { expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { colorSource, type } from "design-system/tokens";
import packageJson from "../package.json";
import {
  designSystemCss,
  SLIDE_SCALE,
  SLIDE_TYPE_ROLES,
  slideScaleCss,
} from "../src/deck/theme.ts";

// The design system is the package `design-system` at a released tag (Module
// Standard: a design system's assets come as a dependency on its package,
// never by a relative path). The library imports its styles and components;
// the deck build puts its stylesheet and fonts into each built deck.
const app = resolve(import.meta.dir, "..");
const root = resolve(app, "..", "..");
const decksRoot = join(root, "data", "v1", "decks");
const sha256 = (file: string) => createHash("sha256").update(readFileSync(file)).digest("hex");

test("the design system is a dependency on a released tag, never a path or a branch", () => {
  const spec = (packageJson.dependencies as Record<string, string>)["design-system"];
  expect(spec).toMatch(
    /^(github:[\w.-]+\/[\w.-]+|git\+ssh:\/\/git@github\.com\/[\w.-]+\/[\w.-]+\.git)#v\d+\.\d+\.\d+$/,
  );
  expect(readFileSync(join(app, "bun.lock"), "utf8")).toContain('"design-system@');
  expect(existsSync(join(root, "design-system"))).toBe(false);
  expect(existsSync(join(app, "public", "lazurio"))).toBe(false);
});

test("no source imports the design system by a relative path", () => {
  const files = Bun.spawnSync(["git", "-c", "core.quotePath=false", "ls-files", "app/v1/src"], {
    cwd: root,
    stdout: "pipe",
  })
    .stdout.toString()
    .split("\n")
    .filter((file) => /\.(ts|tsx|css)$/.test(file));
  expect(files.length).toBeGreaterThan(0);
  for (const file of files) {
    const text = readFileSync(join(root, file), "utf8");
    expect(text, file).not.toMatch(/["'](\.\.?\/)+[^"']*design-system/);
    expect(text, file).not.toContain("public/lazurio");
  }
  expect(readFileSync(join(app, "src/ui-app/main.tsx"), "utf8")).toContain(
    'import "design-system/styles.css";',
  );
});

test("a slide is the design system's type scale, spacing and radii at slide size", () => {
  const css = slideScaleCss();
  for (const role of SLIDE_TYPE_ROLES) {
    const px = Number.parseFloat(type[role].size) * SLIDE_SCALE;
    expect(css).toContain(`--slide-type-${role}-size: ${px}px;`);
  }
  expect(css).toContain("--slide-space-64: 128px;");
});

test("decks carry the design system's stylesheet: its colour roles in both themes", () => {
  const css = designSystemCss();
  expect(css).not.toMatch(/@import/);
  const role = (theme: "light" | "dark") =>
    `--ds-color-accent: var(--ds-palette-${colorSource[theme].accent.replace(".", "-")});`;
  expect(css).toContain(role("light"));
  expect(css).toContain(role("dark"));
  expect(css).toContain('url("./fonts/');
});

test("every built deck carries the package's fonts and their licenses, unchanged", () => {
  const fonts = join(dirname(Bun.resolveSync("design-system/fonts.css", app)), "fonts");
  const decks = existsSync(decksRoot) ? readdirSync(decksRoot) : [];
  for (const slug of decks) {
    const deckFonts = join(decksRoot, slug, "assets", "fonts");
    if (!existsSync(deckFonts)) continue;
    const names = readdirSync(deckFonts).sort();
    expect(names, slug).toEqual(readdirSync(fonts).sort());
    for (const name of names) {
      expect(sha256(join(deckFonts, name)), `${slug}/assets/fonts/${name}`).toBe(
        sha256(join(fonts, name)),
      );
    }
  }
});
