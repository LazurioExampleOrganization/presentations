// Builds decks from their source: data/v1/decks/<slug>/deck.source.json →
// index.html (index.<language>.html for every further language),
// deck.meta.json and assets/. Media stay in the deck's media/ folder.
//
//   bun run deck:build              every deck that has a source
//   bun run deck:build <slug> …     the named decks
//   bun run deck:build --check      change nothing; exit 1 when a built deck
//                                   differs from its source
import { join } from "node:path";
import { parseArgs } from "node:util";
import { buildDeck, deckDrift, sourceDecks, writeDeck } from "../deck/build.ts";
import { DeckSourceError } from "../deck/source.ts";
import { DECKS_ROOT } from "../paths.ts";

const { values, positionals } = parseArgs({
  args: Bun.argv.slice(2),
  allowPositionals: true,
  options: { check: { type: "boolean" }, root: { type: "string" } },
});
const root = values.root ?? DECKS_ROOT;
const slugs = positionals.length > 0 ? positionals : await sourceDecks(root);
if (slugs.length === 0) {
  console.log("No deck has a deck.source.json.");
  process.exit(0);
}

let failed = false;
for (const slug of slugs) {
  const deckDir = join(root, slug);
  try {
    const files = await buildDeck(deckDir);
    if (values.check) {
      const drift = await deckDrift(deckDir, files);
      if (drift.length > 0) {
        failed = true;
        console.error(
          `${slug}: built files differ from the source (run bun run deck:build ${slug})`,
        );
        for (const line of drift) console.error(`  ${line}`);
      } else {
        console.log(`${slug}: up to date`);
      }
    } else {
      await writeDeck(deckDir, files);
      console.log(`${slug}: built ${files.size} files`);
    }
  } catch (error) {
    failed = true;
    const message = error instanceof DeckSourceError ? error.message : String(error);
    console.error(`${slug}: ${message}`);
  }
}
process.exit(failed ? 1 : 0);
