import { join } from "node:path";
import { listDeckSlugs } from "./decks.ts";
import { APP_ROOT } from "./paths.ts";
import { missingPreviews } from "./previews.ts";

const missing = await missingPreviews(await listDeckSlugs(), join(APP_ROOT, "public/previews"));
if (missing.length) {
  console.error(`Missing first-slide JPEG previews: ${missing.join(", ")}. See AGENTS.md.`);
  process.exit(1);
}
