// Read-only readiness of the preparation (Lazurio Module Standard, `check_script`):
// the client build the server serves must exist. Exit 0 when prepared, 1 otherwise.
import { resolve } from "node:path";

import { listDeckSlugs } from "./decks.ts";
import { APP_ROOT, DIST_DIR } from "./paths.ts";
import { missingPreviews } from "./previews.ts";

const index = resolve(import.meta.dir, "../dist/index.html");
if (!(await Bun.file(index).exists())) {
  console.error(`not prepared: ${index} is missing; run \`bun run prepare:app\``);
  process.exit(1);
}

for (const directory of [resolve(APP_ROOT, "public/previews"), resolve(DIST_DIR, "previews")]) {
  const missing = await missingPreviews(await listDeckSlugs(), directory);
  if (missing.length) {
    console.error(
      `not prepared: first-slide previews missing in ${directory}: ${missing.join(", ")}`,
    );
    process.exit(1);
  }
}
