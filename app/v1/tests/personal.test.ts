import { afterAll, beforeAll, expect, test } from "bun:test";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildDeck, writeDeck } from "../src/deck/build.ts";
import { getDeckDetail, getDeckSummaries } from "../src/decks.ts";
import { DECKS_ROOT } from "../src/paths.ts";

// Which decks offer a personal version: only a deck built from a source that
// does not turn it off. A hand-written deck and `personal: false` ignore the
// link's ?for= and ?org=, so the library must not promise one for them.
const FIXTURE = join(import.meta.dir, "fixtures", "2026-01-01-fixture-deck");
const ON = "zz-personal-on";
const OFF = "zz-personal-off";
const HAND = "zz-personal-hand-written";

async function sourceDeck(slug: string, personal: boolean | undefined) {
  const dir = join(DECKS_ROOT, slug);
  cpSync(FIXTURE, dir, { recursive: true });
  const source = JSON.parse(readFileSync(join(dir, "deck.source.json"), "utf8"));
  if (personal !== undefined) source.personal = personal;
  writeFileSync(join(dir, "deck.source.json"), JSON.stringify(source));
  await writeDeck(dir, await buildDeck(dir));
}

beforeAll(async () => {
  mkdirSync(DECKS_ROOT, { recursive: true });
  await sourceDeck(ON, undefined);
  await sourceDeck(OFF, false);
  const hand = join(DECKS_ROOT, HAND);
  mkdirSync(hand, { recursive: true });
  writeFileSync(join(hand, "index.html"), '<title>Hand</title><section class="slide"></section>');
  writeFileSync(join(hand, "deck.meta.json"), JSON.stringify({ title: "Hand-written" }));
});

afterAll(() => {
  for (const slug of [ON, OFF, HAND])
    rmSync(join(DECKS_ROOT, slug), { recursive: true, force: true });
});

test("a deck built from source offers a personal version unless it turns it off", async () => {
  expect((await getDeckDetail(ON))?.personal).toBe(true);
  expect((await getDeckDetail(ON, "en"))?.personal).toBe(true);
  expect((await getDeckDetail(OFF))?.personal).toBe(false);
  const off = readFileSync(join(DECKS_ROOT, OFF, "index.html"), "utf8");
  expect(off).not.toContain("data-personal");
});

test("a hand-written deck offers none", async () => {
  expect((await getDeckDetail(HAND))?.personal).toBe(false);
  const summaries = await getDeckSummaries();
  expect(summaries.find((deck) => deck.slug === HAND)?.personal).toBe(false);
  expect(summaries.find((deck) => deck.slug === ON)?.personal).toBe(true);
});
