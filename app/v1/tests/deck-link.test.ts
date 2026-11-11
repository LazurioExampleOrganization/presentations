import { expect, test } from "bun:test";
import { personalValue, personalWho, slideFromHash } from "../src/deck/link.ts";

test("a personal version names the person and their Organization from the link", () => {
  expect(personalWho("?for=Jane%20Doe&org=Sample%20Studio")).toBe("Jane Doe, Sample Studio");
  expect(personalWho("?pro=Jana%20Nov%C3%A1kov%C3%A1&firma=Studio")).toBe("Jana Nováková, Studio");
  expect(personalWho("?org=Sample%20Studio")).toBe("Sample Studio");
  expect(personalWho("?lang=en")).toBe("");
  expect(personalWho("")).toBe("");
});

test("link values stay one short line of plain text", () => {
  expect(personalValue("  Jane\n\tDoe  ")).toBe("Jane Doe");
  expect(personalValue("a\u0000b\u007fc")).toBe("a b c");
  expect(personalValue("x".repeat(200))).toHaveLength(80);
  expect(personalValue("<b>Jane</b>")).toBe("<b>Jane</b>");
  expect(personalValue(null)).toBe("");
});

test("the address names the slide, clamped to the deck", () => {
  expect(slideFromHash("#3", 11)).toBe(2);
  expect(slideFromHash("", 11)).toBe(0);
  expect(slideFromHash("#0", 11)).toBe(0);
  expect(slideFromHash("#99", 11)).toBe(10);
  expect(slideFromHash("#x", 11)).toBe(0);
});
