import { describe, expect, test } from "bun:test";
import { DeckSourceError, parseDeckSource, SLIDE_TYPES, textIn } from "../src/deck/source.ts";

const files = new Set(["media/clip.mp4", "media/poster.jpg", "media/photo.png"]);
const exists = (path: string) => files.has(path);

function deck(slides: unknown[], extra: Record<string, unknown> = {}) {
  return {
    schema_version: "lazurio.presentation.source.v1",
    languages: ["cs", "en"],
    title: { cs: "Titul", en: "Title" },
    created_at: "2026-11-02",
    slides,
    ...extra,
  };
}

function errorOf(value: unknown): DeckSourceError {
  try {
    parseDeckSource(value, exists);
  } catch (error) {
    if (error instanceof DeckSourceError) return error;
    throw error;
  }
  throw new Error("expected a DeckSourceError");
}

const both = (cs: string, en: string) => ({ cs, en });

describe("deck source", () => {
  test("accepts every slide type with the fields it documents", () => {
    const source = parseDeckSource(
      deck([
        { type: "title", title: both("A", "A"), image: { src: "media/photo.png", alt: "x" } },
        { type: "section", title: "02" },
        {
          type: "problem",
          title: "P",
          points: [
            { title: "a", text: "b" },
            { title: "c", text: "d" },
          ],
        },
        { type: "quote", quote: "Q", author: "A", role: "R" },
        {
          type: "options",
          title: "O",
          options: [
            { name: "a", points: ["x"], highlight: true, badge: "b" },
            { name: "b", points: ["y"] },
          ],
        },
        {
          type: "case",
          title: "C",
          client: "c",
          challenge: "x",
          solution: "y",
          results: [{ value: "1", label: "l" }],
        },
        { type: "timeline", title: "T", steps: [{ title: "a" }, { title: "b", when: "w" }] },
        {
          type: "metrics",
          title: "M",
          metrics: [{ value: "1", label: "l", note: "n" }],
          chart: {
            label: "c",
            bars: [
              { label: "a", value: 1 },
              { label: "b", value: 0 },
            ],
          },
        },
        {
          type: "video",
          title: "V",
          video: { src: "media/clip.mp4", poster: "media/poster.jpg", audio: true },
        },
        { type: "appendix", title: "A", table: { columns: ["a", "b"], rows: [["1", "2"]] } },
        {
          type: "closing",
          title: "Z",
          contact: { name: "n", email: "a@example.com" },
          actions: [{ label: "Go", href: "mailto:a@example.com" }],
        },
      ]),
      exists,
    );
    expect(source.slides.map((slide) => slide.type)).toEqual([...SLIDE_TYPES]);
  });

  test.each([
    [{ type: "chart", title: "x" }, "deck.slides[0].type"],
    [{ type: "section", title: { cs: "jen česky" } }, "deck.slides[0].title.en"],
    [{ type: "section", title: "x", subtitle: "y" }, "deck.slides[0].subtitle"],
    [{ type: "problem", title: "x", points: [{ title: "a", text: "b" }] }, "deck.slides[0].points"],
    [
      {
        type: "options",
        title: "x",
        options: [
          { name: "a", points: ["x"], highlight: true },
          { name: "b", points: ["y"], highlight: true },
        ],
      },
      "deck.slides[0].options",
    ],
    [
      { type: "video", title: "x", video: { src: "../clip.mp4", poster: "media/poster.jpg" } },
      "deck.slides[0].video.src",
    ],
    [
      {
        type: "video",
        title: "x",
        video: { src: "media/missing.mp4", poster: "media/poster.jpg" },
      },
      "deck.slides[0].video.src",
    ],
    [
      { type: "video", title: "x", video: { src: "media/poster.jpg", poster: "media/poster.jpg" } },
      "deck.slides[0].video.src",
    ],
    [
      { type: "closing", title: "x", actions: [{ label: "a", href: "javascript:alert(1)" }] },
      "deck.slides[0].actions[0].href",
    ],
    [{ type: "appendix", title: "x" }, "deck.slides[0]"],
    [
      {
        type: "metrics",
        title: "x",
        metrics: [{ value: "1", label: "l" }],
        chart: {
          label: "c",
          bars: [
            { label: "a", value: -1 },
            { label: "b", value: 1 },
          ],
        },
      },
      "deck.slides[0].chart.bars[0].value",
    ],
  ])("names the field of an error: %j", (slide, path) => {
    expect(errorOf(deck([slide])).path).toBe(path);
  });

  test("checks the deck itself: schema, languages, dates and slides", () => {
    expect(errorOf({ ...deck([]), schema_version: "v0" }).path).toBe("deck.schema_version");
    expect(errorOf(deck([], { languages: ["cs", "cs"] })).path).toBe("deck.languages");
    expect(errorOf(deck([], { languages: ["de"] })).path).toBe("deck.languages[0]");
    expect(errorOf(deck([], { created_at: "2.11.2026" })).path).toBe("deck.created_at");
    expect(errorOf(deck([])).path).toBe("deck.slides");
    expect(errorOf(deck([{ type: "section", title: "x" }], { colour: "red" })).path).toBe(
      "deck.colour",
    );
  });

  test("text is the same in every language as a string, or per language", () => {
    expect(textIn("86", "en")).toBe("86");
    expect(textIn({ cs: "Káva", en: "Coffee" }, "en")).toBe("Coffee");
  });
});
