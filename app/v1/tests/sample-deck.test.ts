import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SLIDE_TYPES } from "../src/deck/source.ts";
import { expectedPreviews, getDeckDetail, getDeckSummaries } from "../src/decks.ts";
import { DECKS_ROOT } from "../src/paths.ts";

// The sample deck of the template: the invented company Example, every slide
// type, Czech and English. An Organization that starts empty deletes the
// deck's directory, its two previews and this file (docs/adoption.md); one
// that keeps it may add its own decks beside it.
const SAMPLE = "2026-11-02-example-office-coffee";

describe("the sample deck", () => {
  test("is in the library", async () => {
    expect((await getDeckSummaries()).map((deck) => deck.slug)).toContain(SAMPLE);
  });

  test("uses every slide type, in Czech and English, with invented content", () => {
    const source = JSON.parse(readFileSync(join(DECKS_ROOT, SAMPLE, "deck.source.json"), "utf8"));
    expect(source.languages).toEqual(["cs", "en"]);
    expect(new Set(source.slides.map((slide: { type: string }) => slide.type))).toEqual(
      new Set(SLIDE_TYPES),
    );
    expect(source.status).toBe("synthetic-example");
    const media = readFileSync(join(DECKS_ROOT, SAMPLE, "media", "README.md"), "utf8");
    expect(media).toContain("No stock footage, music or third-party image");
  });

  test("shows in the library in the primary language", async () => {
    const deck = (await getDeckSummaries()).find((item) => item.slug === SAMPLE);
    expect(deck?.slideCount).toBe(11);
    expect(deck?.title).toBe("Example · Káva pro vaši kancelář");
    expect(deck?.purpose).toBe("offer");
    expect(deck?.status).toBe("synthetic-example");
    expect(deck?.language).toBe("cs");
    expect(deck?.languages).toEqual(["cs", "en"]);
    expect(deck?.deckUrl).toBe(`/decks/${SAMPLE}/`);
    expect(deck?.previewUrl).toBe(`/previews/${SAMPLE}.jpg`);
    const detail = await getDeckDetail(SAMPLE);
    expect(detail?.owner).toBe("Obchodní tým Example");
    expect(detail?.primaryGoal).toStartWith("Ukázat všechny typy slidů");
    expect(detail?.exports).toEqual([]);
  });

  test("shows in English entirely in English", async () => {
    const deck = (await getDeckSummaries("en")).find((item) => item.slug === SAMPLE);
    expect(deck?.title).toBe("Example · Coffee for your office");
    expect(deck?.language).toBe("en");
    expect(deck?.audience).toEqual(["Office managers", "Leaders of small companies"]);
    expect(deck?.deckUrl).toBe(`/decks/${SAMPLE}/index.en.html`);
    expect(deck?.previewUrl).toBe(`/previews/${SAMPLE}.en.jpg`);
    const detail = await getDeckDetail(SAMPLE, "en");
    expect(detail?.owner).toBe("Example sales team");
    expect(detail?.sources[0]).toStartWith("An invented sample");
  });

  test("falls back to its primary language for a language it does not have", async () => {
    const deck = (await getDeckSummaries("de")).find((item) => item.slug === SAMPLE);
    expect(deck?.language).toBe("cs");
    expect(deck?.deckUrl).toBe(`/decks/${SAMPLE}/`);
  });

  test("has a first-slide preview per language", async () => {
    const previews = await expectedPreviews();
    expect(previews).toContain(SAMPLE);
    expect(previews).toContain(`${SAMPLE}.en`);
  });
});
