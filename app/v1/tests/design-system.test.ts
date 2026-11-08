import { expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const sha256 = (file: string) => createHash("sha256").update(readFileSync(file)).digest("hex");
const appAssets = resolve(import.meta.dir, "../public/lazurio");
const decksRoot = resolve(import.meta.dir, "../../../data/v1/decks");
const decks = () => (existsSync(decksRoot) ? readdirSync(decksRoot) : []);

test("the library ships the frozen Lazurio design snapshot and local fonts", () => {
  const lock = JSON.parse(readFileSync(resolve(appAssets, "vendor.lock.json"), "utf8")) as {
    files: Record<string, string>;
  };
  for (const [name, hash] of Object.entries(lock.files)) {
    expect(sha256(resolve(appAssets, name)), name).toBe(hash);
  }
});

test("every built deck carries the same font files and licenses as the library", () => {
  for (const slug of decks()) {
    const fonts = resolve(decksRoot, slug, "assets");
    let names: string[];
    try {
      names = readdirSync(resolve(fonts, "fonts")).map((name) => `fonts/${name}`);
    } catch {
      continue;
    }
    for (const name of [...names, "LICENSE-inter-tight.txt", "LICENSE-geist-mono.txt"]) {
      expect(sha256(resolve(fonts, name)), `${slug}/assets/${name}`).toBe(
        sha256(resolve(appAssets, name)),
      );
    }
  }
});

test("decks take their colours from the design system subtree, not from a copy", () => {
  const tokens = JSON.parse(
    readFileSync(
      resolve(import.meta.dir, "../../../design-system/content/brand/colors/tokens.json"),
      "utf8",
    ),
  ) as { colors: Record<string, string>; themes: { light: Record<string, string> } };
  const accent = tokens.colors[tokens.themes.light.accent ?? ""];
  for (const slug of decks()) {
    let css: string;
    try {
      css = readFileSync(resolve(decksRoot, slug, "assets", "deck.css"), "utf8");
    } catch {
      continue;
    }
    expect(css, slug).toContain(`--accent: ${accent};`);
  }
});
