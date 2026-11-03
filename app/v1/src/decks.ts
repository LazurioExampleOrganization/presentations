import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import type { DeckDetail, DeckExportFile, DeckMeta, DeckSummary } from "./model.ts";
import {
  DECKS_ROOT,
  EXPORTS_ROOT,
  isRealpathWithinDecks,
  isRealpathWithinExports,
  isValidDeckSlug,
} from "./paths.ts";

const SECTION_SLIDE_RE = /<section\b[^>]*class\s*=\s*"[^"]*\bslide\b[^"]*"/gi;
const BODY_DATA_TITLE_RE = /<body\b[^>]*\bdata-title\s*=\s*"([^"]*)"/i;
const TITLE_TAG_RE = /<title>([^<]*)<\/title>/i;
const DATE_PREFIX_RE = /^(\d{4}-\d{2}-\d{2})/;

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function dateFromSlug(slug: string): string | null {
  const match = slug.match(DATE_PREFIX_RE);
  return match ? match[1] : null;
}

function countSlides(html: string): number {
  const matches = html.match(SECTION_SLIDE_RE);
  return matches ? matches.length : 0;
}

function titleFromHtml(html: string): string | null {
  const dataTitle = html.match(BODY_DATA_TITLE_RE);
  if (dataTitle?.[1]?.trim()) return decodeEntities(dataTitle[1].trim());
  const titleTag = html.match(TITLE_TAG_RE);
  if (titleTag?.[1]?.trim()) return decodeEntities(titleTag[1].trim());
  return null;
}

async function readDeckHtml(slug: string): Promise<string | null> {
  const file = path.join(DECKS_ROOT, slug, "index.html");
  try {
    // readFile follows symlinks, so confirm the real target stays in the store.
    if (!(await isRealpathWithinDecks(file))) return null;
    return await readFile(file, "utf8");
  } catch {
    return null;
  }
}

async function readDeckMeta(slug: string): Promise<DeckMeta | null> {
  const file = path.join(DECKS_ROOT, slug, "deck.meta.json");
  try {
    if (!(await isRealpathWithinDecks(file))) return null;
    const raw = await readFile(file, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as DeckMeta) : null;
  } catch {
    return null;
  }
}

async function listExportFiles(slug: string): Promise<DeckExportFile[]> {
  // Derived PDF exports live in the generated/v1 store, not next to the deck source.
  const exportsDir = path.join(EXPORTS_ROOT, slug, "exports");
  if (!(await isRealpathWithinExports(exportsDir))) return [];
  let entries: string[];
  try {
    entries = await readdir(exportsDir);
  } catch {
    return [];
  }
  const pdfs = entries.filter((name) => name.toLowerCase().endsWith(".pdf")).sort();
  const files = await Promise.all(
    pdfs.map(async (name) => {
      const filePath = path.join(exportsDir, name);
      // stat follows symlinks; only report PDFs whose real path stays in the store.
      if (!(await isRealpathWithinExports(filePath))) return null;
      let bytes = 0;
      try {
        bytes = (await stat(filePath)).size;
      } catch {
        bytes = 0;
      }
      return { name, url: `/exports/${slug}/${name}`, bytes } satisfies DeckExportFile;
    }),
  );
  return files.filter((file): file is DeckExportFile => file !== null);
}

/** Directories under decks/ that hold a presentable index.html. */
export async function listDeckSlugs(): Promise<string[]> {
  let names: string[];
  try {
    names = await readdir(DECKS_ROOT);
  } catch {
    return [];
  }
  const slugs: string[] = [];
  for (const name of names) {
    if (!isValidDeckSlug(name)) continue;
    try {
      const deckDir = path.join(DECKS_ROOT, name);
      const dirStat = await stat(deckDir);
      if (!dirStat.isDirectory()) continue;
      // Symlink-aware: don't list a deck dir whose real path escapes the store.
      if (!(await isRealpathWithinDecks(deckDir))) continue;
      const indexStat = await stat(path.join(deckDir, "index.html"));
      if (indexStat.isFile()) slugs.push(name);
    } catch {
      // not a presentable deck (no dir or no index.html)
    }
  }
  return slugs.sort((a, b) => b.localeCompare(a));
}

function buildSummary(
  slug: string,
  html: string | null,
  meta: DeckMeta | null,
  exportCount: number,
): DeckSummary {
  const title = meta?.title?.trim() || (html ? titleFromHtml(html) : null) || slug;
  return {
    slug,
    title,
    date: meta?.created_at?.trim() || dateFromSlug(slug),
    purpose: meta?.purpose?.trim() || null,
    status: meta?.status?.trim() || null,
    language: meta?.language?.trim() || null,
    audience: Array.isArray(meta?.audience) ? meta.audience : [],
    portfolioModel: meta?.portfolio_model?.trim() || null,
    slideCount: html ? countSlides(html) : 0,
    hasMeta: meta !== null,
    exportCount,
    deckUrl: `/decks/${slug}/`,
  };
}

export async function getDeckSummary(slug: string): Promise<DeckSummary | null> {
  if (!isValidDeckSlug(slug)) return null;
  // Discovery reads index.html/deck.meta.json directly, so apply the same
  // symlink-aware containment the serving routes use before reading.
  if (!(await isRealpathWithinDecks(path.join(DECKS_ROOT, slug)))) return null;
  const html = await readDeckHtml(slug);
  if (html === null) return null;
  const [meta, exports] = await Promise.all([readDeckMeta(slug), listExportFiles(slug)]);
  return buildSummary(slug, html, meta, exports.length);
}

export async function getDeckSummaries(): Promise<DeckSummary[]> {
  const slugs = await listDeckSlugs();
  const summaries = await Promise.all(slugs.map((slug) => getDeckSummary(slug)));
  return summaries.filter((summary): summary is DeckSummary => summary !== null);
}

export async function getDeckDetail(slug: string): Promise<DeckDetail | null> {
  if (!isValidDeckSlug(slug)) return null;
  if (!(await isRealpathWithinDecks(path.join(DECKS_ROOT, slug)))) return null;
  const html = await readDeckHtml(slug);
  if (html === null) return null;
  const [meta, exports] = await Promise.all([readDeckMeta(slug), listExportFiles(slug)]);
  const summary = buildSummary(slug, html, meta, exports.length);
  return {
    ...summary,
    owner: meta?.owner?.trim() || null,
    createdAt: meta?.created_at?.trim() || null,
    updatedAt: meta?.updated_at?.trim() || null,
    primaryGoal: meta?.primary_goal?.trim() || null,
    mentalModel: meta?.mental_model?.trim() || null,
    sources: Array.isArray(meta?.sources) ? meta.sources : [],
    exports,
    meta,
  };
}
