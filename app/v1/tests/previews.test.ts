import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { listDeckSlugs } from "../src/decks.ts";

test("every discoverable presentation ships a first-slide image", async () => {
  for (const slug of await listDeckSlugs()) {
    const image = await readFile(resolve(import.meta.dir, `../public/previews/${slug}.jpg`));
    expect(image.subarray(0, 3).toString("hex")).toBe("ffd8ff");
  }
});

test("preparation rejects a new deck without an image or with an invalid image", async () => {
  const { mkdtemp, writeFile, rm } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { missingPreviews } = await import("../src/previews.ts");
  const directory = await mkdtemp(resolve(tmpdir(), "presentation-previews-"));
  try {
    expect(await missingPreviews(["new-deck"], directory)).toEqual(["new-deck"]);
    await writeFile(resolve(directory, "new-deck.jpg"), "");
    expect(await missingPreviews(["new-deck"], directory)).toEqual(["new-deck"]);
  } finally {
    await rm(directory, { recursive: true });
  }
});
