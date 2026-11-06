import { readFile } from "node:fs/promises";
import { join } from "node:path";

/** Preparation requires an actual JPEG for every deck discovered by the app. */
export async function missingPreviews(slugs: string[], directory: string): Promise<string[]> {
  const missing: string[] = [];
  for (const slug of slugs) {
    try {
      const image = await readFile(join(directory, `${slug}.jpg`));
      if (image.subarray(0, 3).toString("hex") !== "ffd8ff") missing.push(slug);
    } catch {
      missing.push(slug);
    }
  }
  return missing;
}
