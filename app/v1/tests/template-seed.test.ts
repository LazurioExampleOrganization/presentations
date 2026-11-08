import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getDeckDetail, getDeckSummaries } from "../src/decks.ts";
import { DECKS_ROOT } from "../src/paths.ts";

// The synthetic starter of the template. An Organization that starts empty
// deletes the starter's directory, its preview and this file
// (docs/adoption.md); nothing else names the starter.
const STARTER = "2026-10-11-project-proposal";

test("a clean adoption discovers only the synthetic starter presentation", async () => {
  const decks = await getDeckSummaries();
  expect(decks.map((deck) => deck.slug)).toEqual([STARTER]);
  const detail = await getDeckDetail(STARTER);
  expect(detail?.title).toBe("Návrh projektu · ukázka");
  expect(detail?.slideCount).toBe(4);
  expect(detail?.status).toBe("synthetic-example");
  expect(detail?.sources).toEqual(["Syntetická ukázka; neobsahuje firemní podklady."]);
  expect(detail?.exports).toEqual([]);
  const html = await readFile(join(DECKS_ROOT, STARTER, "index.html"), "utf8");
  const css = await readFile(join(DECKS_ROOT, STARTER, "deck.css"), "utf8");
  expect(css).toContain("@media print");
  expect(css).toContain("size: 16in 9in");
  expect(html).toContain('"ArrowRight"');
  expect(html).toContain('"ArrowLeft"');
  expect(html).not.toMatch(/https?:\/\//);
});

test("the starter's summary and detail carry its metadata", async () => {
  const deck = (await getDeckSummaries()).find((item) => item.slug === STARTER);
  expect(deck?.slideCount).toBe(4);
  expect(deck?.title).toContain("Návrh projektu");
  expect(deck?.hasMeta).toBe(true);
  expect(deck?.purpose).toBe("project-proposal");
  expect(deck?.deckUrl).toBe(`/decks/${STARTER}/`);
  const detail = await getDeckDetail(STARTER);
  expect(detail?.primaryGoal).toContain("Ověřit");
  expect(detail?.mentalModel).toContain("syntetická");
  expect(detail?.exportCount).toBe(0);
});
