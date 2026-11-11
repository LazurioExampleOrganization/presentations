import { expect, test } from "bun:test";
import { DECK_MESSAGES } from "../src/deck/messages.ts";
import { personalLink, slideLabel } from "../src/ui-app/format.ts";
import { MESSAGES, plural, resolveLanguage } from "../src/ui-app/i18n.ts";

const json = (body: unknown) =>
  (() =>
    Promise.resolve(
      new Response(JSON.stringify(body), { headers: { "content-type": "application/json" } }),
    )) as unknown as typeof fetch;
const failing = (() => Promise.reject(new Error("offline"))) as unknown as typeof fetch;
const html = (() => Promise.resolve(new Response("<!doctype html>"))) as unknown as typeof fetch;

test("the library speaks the address's language, else Lazurio's, else the Organization's", async () => {
  const shell = json({ schema: "lazurio.shell.v1", locale: "en" });
  expect(await resolveLanguage("?lang=cs", shell)).toBe("cs");
  expect(await resolveLanguage("", shell)).toBe("en");
  expect(await resolveLanguage("", json({ locale: "de" }), "cs")).toBe("cs");
  expect(await resolveLanguage("", html, "en")).toBe("en");
  expect(await resolveLanguage("", failing, "cs")).toBe("cs");
  expect(await resolveLanguage("", failing, "en")).toBe("en");
  expect(await resolveLanguage("?lang=de", json({}), "cs")).toBe("cs");
});

test("both languages have every text, none empty", () => {
  for (const catalog of [MESSAGES, DECK_MESSAGES]) {
    const [cs, en] = [catalog.cs, catalog.en] as Record<string, unknown>[];
    expect(Object.keys(en ?? {}).sort()).toEqual(Object.keys(cs ?? {}).sort());
    for (const value of [...Object.values(cs ?? {}), ...Object.values(en ?? {})]) {
      if (typeof value === "string") expect(value.trim()).not.toBe("");
    }
  }
  expect(Object.keys(MESSAGES.en.labels).sort()).toEqual(Object.keys(MESSAGES.cs.labels).sort());
  expect(MESSAGES.en.brief("example/presentations")).toContain("deck-from-sources");
  expect(MESSAGES.cs.brief("example/presentations")).toContain("deck-from-sources");
});

test("counts read naturally in both languages", () => {
  expect(slideLabel(1, "cs")).toBe("1 slide");
  expect(slideLabel(3, "cs")).toBe("3 slidy");
  expect(slideLabel(11, "cs")).toBe("11 slidů");
  expect(slideLabel(11, "en")).toBe("11 slides");
  expect(plural(2, MESSAGES.en.presentations, "en")).toBe("presentations");
});

test("a personal link keeps the deck's page and adds only the prospect", () => {
  const link = personalLink(
    "https://app.example.test",
    "/decks/2026-11-02-example-office-coffee/index.en.html",
    " Jane Doe ",
    "Sample & Co",
  );
  expect(link).toBe(
    "https://app.example.test/decks/2026-11-02-example-office-coffee/index.en.html?for=Jane+Doe&org=Sample+%26+Co",
  );
});
