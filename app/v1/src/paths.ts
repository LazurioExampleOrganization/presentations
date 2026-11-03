import { realpath } from "node:fs/promises";
import path from "node:path";

// paths.ts lives in modules/presentation/app/v1/src.
// GEN2 standard: deck source data lives under data/v1/decks, derived PDF
// exports under generated/v1/decks. The app reads both; it never regenerates
// deck HTML.
// APP_ROOT      -> modules/presentation/app/v1
// MODULE_ROOT   -> modules/presentation                     (the nested repo root)
// DECKS_ROOT    -> modules/presentation/data/v1/decks       (deck source data)
// EXPORTS_ROOT  -> modules/presentation/generated/v1/decks  (derived PDF exports)
export const APP_ROOT = path.resolve(import.meta.dir, "..");
export const MODULE_ROOT = path.resolve(APP_ROOT, "..", "..");
export const DECKS_ROOT = path.join(MODULE_ROOT, "data", "v1", "decks");
export const EXPORTS_ROOT = path.join(MODULE_ROOT, "generated", "v1", "decks");
export const DIST_DIR = path.join(APP_ROOT, "dist");

/**
 * Resolve a caller-supplied relative path against a trusted root and refuse to
 * escape it. Returns the absolute path on success, or null when the input is
 * absolute, empty, or would traverse outside the root (`..`, encoded `..`,
 * absolute paths). This is the single containment guard used for serving deck
 * files from URL-controlled segments.
 */
export function resolveWithinRoot(root: string, relativePath: string): string | null {
	if (!relativePath || path.isAbsolute(relativePath)) return null;
	const normalized = path.normalize(relativePath);
	if (normalized === ".." || normalized.startsWith(`..${path.sep}`)) return null;
	const resolved = path.resolve(root, normalized);
	const boundary = `${root}${path.sep}`;
	if (resolved !== root && !resolved.startsWith(boundary)) return null;
	return resolved;
}

/** Resolve a path inside the decks (data) store, or null if it would escape it. */
export function resolveDeckPath(relativePath: string): string | null {
	return resolveWithinRoot(DECKS_ROOT, relativePath);
}

/** Resolve a path inside the generated exports store, or null if it escapes it. */
export function resolveExportPath(relativePath: string): string | null {
	return resolveWithinRoot(EXPORTS_ROOT, relativePath);
}

/**
 * Defense-in-depth beyond the lexical guard: once a path is known to exist,
 * confirm its real (symlink-resolved) location is still inside the real root.
 * `resolveWithinRoot` is purely lexical, but stat/readFile follow symlinks, so a
 * symlink placed inside decks/ pointing outside would otherwise be served.
 * Returns false on any error (missing file, broken link, escape).
 */
export async function realpathWithinRoot(root: string, existingPath: string): Promise<boolean> {
	try {
		const [realTarget, realRoot] = await Promise.all([realpath(existingPath), realpath(root)]);
		return realTarget === realRoot || realTarget.startsWith(`${realRoot}${path.sep}`);
	} catch {
		return false;
	}
}

/** Confirm an existing file's real path stays inside the decks (data) store. */
export function isRealpathWithinDecks(existingPath: string): Promise<boolean> {
	return realpathWithinRoot(DECKS_ROOT, existingPath);
}

/** Confirm an existing file's real path stays inside the generated exports store. */
export function isRealpathWithinExports(existingPath: string): Promise<boolean> {
	return realpathWithinRoot(EXPORTS_ROOT, existingPath);
}

/** Deck slugs are date-prefixed kebab folders; reject anything else. */
const DECK_SLUG_RE = /^[a-z0-9][a-z0-9._-]*$/;

export function isValidDeckSlug(slug: string): boolean {
	return DECK_SLUG_RE.test(slug) && !slug.includes("..") && !slug.includes("/");
}
