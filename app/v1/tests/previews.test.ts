import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { expectedPreviews } from "../src/decks.ts";

test("every presentation ships a first-slide image for each of its languages", async () => {
  for (const name of await expectedPreviews()) {
    const image = await readFile(resolve(import.meta.dir, `../public/previews/${name}.jpg`));
    expect(image.subarray(0, 3).toString("hex")).toBe("ffd8ff");
  }
});

test("the build rejects a new deck without an image or with an invalid image", async () => {
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
