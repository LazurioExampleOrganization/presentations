import { expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const appAssets = resolve(import.meta.dir, "../public/lazurio");
const decksRoot = resolve(import.meta.dir, "../../../data/v1/decks");
const lock = JSON.parse(readFileSync(resolve(appAssets, "vendor.lock.json"), "utf8")) as {
  files: Record<string, string>;
};
const sha256 = (file: string) => createHash("sha256").update(readFileSync(file)).digest("hex");

test("the gallery ships the frozen Lazurio design and local fonts", () => {
  for (const [name, hash] of Object.entries(lock.files)) {
    expect(sha256(resolve(appAssets, name)), name).toBe(hash);
  }
});

test("every deck that carries its own lazurio/ copy has the same frozen files", () => {
  const decks = existsSync(decksRoot) ? readdirSync(decksRoot) : [];
  for (const slug of decks) {
    const copy = resolve(decksRoot, slug, "lazurio");
    if (!existsSync(copy)) continue;
    for (const [name, hash] of Object.entries(lock.files)) {
      expect(sha256(resolve(copy, name)), `${slug}/lazurio/${name}`).toBe(hash);
    }
  }
});
