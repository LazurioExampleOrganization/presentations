import { describe, expect, test } from "bun:test";
import { isContentPath, logicalPath } from "../src/content-path.ts";

describe("the Organization's content", () => {
  test("is decided on the path as the file handlers read it", () => {
    expect(logicalPath("/%70reviews/a.jpg")).toBe("/previews/a.jpg");
    expect(logicalPath("/x/..%2Fpreviews/a.jpg")).toBe("/previews/a.jpg");
    expect(logicalPath("//previews\\a.jpg")).toBe("/previews/a.jpg");
    expect(logicalPath("/%E0%A4%A")).toBeNull();
  });

  test("covers the API, decks, exports and previews in every spelling", () => {
    for (const path of [
      "/api/decks",
      "/decks/a/",
      "/exports/a.pdf",
      "/previews/a.jpg",
      "/%70reviews/a.jpg",
      "/previews%2Fa.jpg",
      "/x/..%2Fdecks/a/",
      "/%E0%A4%A",
    ])
      expect(isContentPath(path), path).toBe(true);
  });

  test("leaves health and the client itself open", () => {
    for (const path of ["/api/health", "/", "/assets/index.js", "/some/app/route"])
      expect(isContentPath(path), path).toBe(false);
  });
});
