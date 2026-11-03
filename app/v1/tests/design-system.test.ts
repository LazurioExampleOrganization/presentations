import { expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

test("gallery and standalone starter ship the same frozen Lazurio design and local fonts", () => {
  const appAssets = resolve(import.meta.dir, "../public/lazurio");
  const deckAssets = resolve(
    import.meta.dir,
    "../../../data/v1/decks/2026-10-11-project-proposal/lazurio",
  );
  const lock = JSON.parse(readFileSync(resolve(appAssets, "vendor.lock.json"), "utf8")) as {
    files: Record<string, string>;
  };
  for (const [name, hash] of Object.entries(lock.files)) {
    for (const root of [appAssets, deckAssets]) {
      expect(
        createHash("sha256")
          .update(readFileSync(resolve(root, name)))
          .digest("hex"),
        name,
      ).toBe(hash);
    }
  }
});
