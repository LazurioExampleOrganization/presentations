import { readFile } from "node:fs/promises";
import { join } from "node:path";

/** The client build requires an actual JPEG for every preview the library shows (`<name>.jpg`). */
export async function missingPreviews(names: string[], directory: string): Promise<string[]> {
  const missing: string[] = [];
  for (const name of names) {
    try {
      const image = await readFile(join(directory, `${name}.jpg`));
      if (image.subarray(0, 3).toString("hex") !== "ffd8ff") missing.push(name);
    } catch {
      missing.push(name);
    }
  }
  return missing;
}
