import { existsSync, readFileSync, statSync } from "node:fs";
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { APP_ROOT, DECKS_ROOT, isValidDeckSlug } from "../paths.ts";
import { deckMeta, pageFile, renderDeckPage } from "./render.ts";
import { type DeckSource, parseDeckSource } from "./source.ts";
import { deckThemeCss, designSystemTokens } from "./theme.ts";

export const SOURCE_FILE = "deck.source.json";

/** The local fonts a deck carries (OFL, from the App's vendored files), with their licenses. */
const FONT_FILES = [
  "fonts/inter-tight-latin-wght-normal.woff2",
  "fonts/inter-tight-latin-ext-wght-normal.woff2",
  "fonts/geist-mono-latin-400-normal.woff2",
  "LICENSE-inter-tight.txt",
  "LICENSE-geist-mono.txt",
] as const;
const FONT_SOURCE = join(APP_ROOT, "public", "lazurio");
const STYLESHEET = join(APP_ROOT, "src", "deck", "deck.css");
const RUNTIME = join(APP_ROOT, "src", "deck", "runtime.ts");

/** Files the build owns in a deck directory; everything else there is the author's. */
const OWNED_PAGE = /^index(\.[a-z]{2})?\.html$/;
export const OWNED = ["deck.meta.json", "assets"] as const;

let runtimeBundle: Promise<string> | null = null;

/** assets/deck.js: the runtime, bundled once per process. */
function bundleRuntime(): Promise<string> {
  runtimeBundle ??= (async () => {
    const result = await Bun.build({
      entrypoints: [RUNTIME],
      root: APP_ROOT,
      target: "browser",
      format: "iife",
      minify: { whitespace: false, syntax: true, identifiers: false },
    });
    const [output] = result.outputs;
    if (!result.success || !output) {
      throw new Error(`deck runtime did not bundle: ${result.logs.join("\n")}`);
    }
    return `// Presentations deck runtime, built by bun run deck:build. Do not edit.\n${await output.text()}`;
  })();
  return runtimeBundle;
}

/** Reads and validates the source of one deck directory. */
export function readDeckSource(deckDir: string): DeckSource {
  const file = join(deckDir, SOURCE_FILE);
  let raw: unknown;
  try {
    raw = JSON.parse(readFileSync(file, "utf8"));
  } catch (error) {
    throw new Error(`${file}: ${error instanceof Error ? error.message : String(error)}`);
  }
  return parseDeckSource(raw, (path) => {
    const target = join(deckDir, path);
    return existsSync(target) && statSync(target).isFile();
  });
}

/** Every file of a built deck, by its path inside the deck directory. */
export async function buildDeck(deckDir: string): Promise<Map<string, string | Uint8Array>> {
  const slug = basename(resolve(deckDir));
  if (!isValidDeckSlug(slug)) throw new Error(`${slug}: not a valid deck directory name`);
  const source = readDeckSource(deckDir);
  const files = new Map<string, string | Uint8Array>();
  for (const language of source.languages) {
    files.set(pageFile(source, language), renderDeckPage(source, slug, language));
  }
  files.set("deck.meta.json", `${JSON.stringify(deckMeta(source), null, 2)}\n`);
  files.set(
    "assets/deck.css",
    `${deckThemeCss(designSystemTokens)}\n${await readFile(STYLESHEET, "utf8")}`,
  );
  files.set("assets/deck.js", await bundleRuntime());
  for (const font of FONT_FILES) {
    files.set(`assets/${font}`, new Uint8Array(await readFile(join(FONT_SOURCE, font))));
  }
  return files;
}

async function listFiles(root: string, prefix = ""): Promise<string[]> {
  const entries = await readdir(join(root, prefix), { withFileTypes: true }).catch(() => []);
  const files: string[] = [];
  for (const entry of entries) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...(await listFiles(root, path)));
    else files.push(path);
  }
  return files;
}

/** The files of a deck directory the build owns: its pages, `deck.meta.json` and `assets/`. */
async function ownedFiles(deckDir: string): Promise<string[]> {
  const top = (await readdir(deckDir).catch(() => [])).filter(
    (name) => OWNED_PAGE.test(name) || name === "deck.meta.json",
  );
  return [...top, ...(await listFiles(deckDir, "assets"))];
}

function same(a: string | Uint8Array, b: Uint8Array): boolean {
  const left = typeof a === "string" ? new TextEncoder().encode(a) : a;
  return left.length === b.length && left.every((byte, index) => byte === b[index]);
}

/** What differs between a deck directory and a fresh build of its source. */
export async function deckDrift(
  deckDir: string,
  files: Map<string, string | Uint8Array>,
): Promise<string[]> {
  const drift: string[] = [];
  for (const [path, content] of files) {
    const target = join(deckDir, path);
    if (!existsSync(target)) drift.push(`missing ${path}`);
    else if (!same(content, new Uint8Array(await readFile(target)))) drift.push(`outdated ${path}`);
  }
  for (const path of await ownedFiles(deckDir)) {
    if (!files.has(path)) drift.push(`stale ${path}`);
  }
  return drift;
}

/** Writes a built deck: replaces the files the build owns and leaves the source and media alone. */
export async function writeDeck(
  deckDir: string,
  files: Map<string, string | Uint8Array>,
): Promise<void> {
  for (const path of await ownedFiles(deckDir)) {
    if (!files.has(path)) await rm(join(deckDir, path), { force: true });
  }
  for (const [path, content] of files) {
    const target = join(deckDir, path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, content);
  }
}

/** Slugs of the decks that have a source, in `data/v1/decks`. */
export async function sourceDecks(root: string = DECKS_ROOT): Promise<string[]> {
  const names = await readdir(root).catch(() => []);
  return names
    .filter((name) => isValidDeckSlug(name) && existsSync(join(root, name, SOURCE_FILE)))
    .sort();
}
