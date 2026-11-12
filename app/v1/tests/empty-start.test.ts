import { afterAll, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { freshCheckout, IS_NESTED_RUN } from "./support/fresh-checkout.ts";

// docs/adoption.md, "Empty start", and docs/extending.md, "From 0.1.x to
// 0.2.0": what an Organization removes to start with an empty library. The
// test makes a fresh checkout of the tree without these paths and runs the
// whole suite there.
const EMPTY_START_REMOVES = [
  "data/v1/decks/2026-11-02-example-office-coffee",
  "app/v1/public/previews/2026-11-02-example-office-coffee.jpg",
  "app/v1/public/previews/2026-11-02-example-office-coffee.en.jpg",
  "app/v1/tests/sample-deck.test.ts",
];
const root = resolve(import.meta.dir, "..", "..", "..");
const checkout = IS_NESTED_RUN ? null : freshCheckout("presentations-empty", EMPTY_START_REMOVES);
afterAll(() => checkout?.dispose());

test.skipIf(IS_NESTED_RUN)(
  "an empty start as docs/adoption.md describes it passes the checks on a fresh checkout",
  () => {
    if (!checkout) throw new Error("no fresh checkout");
    for (const doc of ["docs/adoption.md", "docs/extending.md"]) {
      const text = readFileSync(join(root, doc), "utf8");
      for (const path of EMPTY_START_REMOVES) expect(text, `${doc}: ${path}`).toContain(path);
    }
    // The library's directory survives the removal only through its .gitkeep.
    expect(existsSync(join(checkout.root, "data", "v1", "decks", ".gitkeep"))).toBe(true);
    const { exitCode, output } = checkout.runSuite();
    expect(exitCode, output).toBe(0);
    expect(output).toMatch(/\b0 fail\b/);
    expect(output).toMatch(/\b[1-9]\d* pass\b/);
    expect(output).not.toContain("sample-deck");
  },
  240_000,
);
