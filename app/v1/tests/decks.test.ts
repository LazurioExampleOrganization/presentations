import { describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path, { sep } from "node:path";
import { getDeckDetail, getDeckSummaries } from "../src/decks.ts";
import {
	DECKS_ROOT,
	EXPORTS_ROOT,
	isValidDeckSlug,
	realpathWithinRoot,
	resolveDeckPath,
	resolveExportPath,
} from "../src/paths.ts";

const KNOWN_DECK = "2026-10-11-project-proposal";

describe("deck discovery", () => {
	test("lists decks from the decks store", async () => {
		const decks = await getDeckSummaries();
		expect(decks.length).toBeGreaterThan(0);
		expect(decks.map((deck) => deck.slug)).toContain(KNOWN_DECK);
	});

	test("summarizes the synthetic starter metadata", async () => {
		const decks = await getDeckSummaries();
		const deck = decks.find((item) => item.slug === KNOWN_DECK);
		expect(deck).toBeDefined();
		expect(deck?.slideCount).toBe(4);
		expect(deck?.title).toContain("Návrh projektu");
		expect(deck?.hasMeta).toBe(true);
		expect(deck?.purpose).toBe("project-proposal");
		expect(deck?.status).toBe("synthetic-example");
		expect(deck?.deckUrl).toBe(`/decks/${KNOWN_DECK}/`);
	});

	test("handles a deck without deck.meta.json", async () => {
		const noMetaSlug = "zz-smoke-no-meta-deck";
		const deckDir = path.join(DECKS_ROOT, noMetaSlug);
		try {
			await mkdir(deckDir);
			await writeFile(
				path.join(deckDir, "index.html"),
				'<title>No meta fixture</title><section class="slide"></section>',
			);

			const decks = await getDeckSummaries();
			const noMeta = decks.find((item) => item.slug === noMetaSlug);
			expect(noMeta).toBeDefined();
			expect(noMeta?.hasMeta).toBe(false);
			expect(noMeta?.title).toBe("No meta fixture");
		} finally {
			await rm(deckDir, { recursive: true, force: true });
		}
	});

	test("detail returns starter context without export urls when no exports exist", async () => {
		const detail = await getDeckDetail(KNOWN_DECK);
		expect(detail).not.toBeNull();
		expect(detail?.hasMeta).toBe(true);
		expect(detail?.primaryGoal).toContain("Ověřit");
		expect(detail?.mentalModel).toContain("syntetická");
		expect(detail?.exports).toEqual([]);
		expect(detail?.exportCount).toBe(0);
	});

	test("detail for an unknown slug is null", async () => {
		expect(await getDeckDetail("does-not-exist")).toBeNull();
	});
});

describe("deck path containment (security)", () => {
	test("accepts a real deck slug", () => {
		expect(isValidDeckSlug(KNOWN_DECK)).toBe(true);
	});

	test("rejects slugs with traversal, slashes or absolute markers", () => {
		expect(isValidDeckSlug("..")).toBe(false);
		expect(isValidDeckSlug("../etc")).toBe(false);
		expect(isValidDeckSlug("a/b")).toBe(false);
		expect(isValidDeckSlug("/abs")).toBe(false);
	});

	test("resolveDeckPath keeps resolved files inside decks root", () => {
		const resolved = resolveDeckPath(`${KNOWN_DECK}/index.html`);
		expect(resolved).not.toBeNull();
		expect(resolved?.startsWith(`${DECKS_ROOT}${sep}`)).toBe(true);
	});

	test("resolveDeckPath rejects raw traversal and absolute paths", () => {
		expect(resolveDeckPath("../../etc/passwd")).toBeNull();
		expect(resolveDeckPath(`${KNOWN_DECK}/../../../etc/passwd`)).toBeNull();
		expect(resolveDeckPath("/etc/passwd")).toBeNull();
		expect(resolveDeckPath("..")).toBeNull();
	});

	test("resolveDeckPath rejects percent-encoded traversal after decoding", () => {
		// Mirrors the server: decodeURIComponent runs before the containment guard.
		const decoded = decodeURIComponent("%2e%2e%2f%2e%2e%2fetc%2fpasswd");
		expect(decoded).toBe("../../etc/passwd");
		expect(resolveDeckPath(decoded)).toBeNull();
	});

	test("resolveExportPath keeps resolved files inside the exports root", () => {
		const resolved = resolveExportPath(`${KNOWN_DECK}/exports/sample.pdf`);
		expect(resolved).not.toBeNull();
		expect(resolved?.startsWith(`${EXPORTS_ROOT}${sep}`)).toBe(true);
	});

	test("resolveExportPath rejects traversal and absolute paths", () => {
		expect(resolveExportPath("../../etc/passwd")).toBeNull();
		expect(resolveExportPath(`${KNOWN_DECK}/exports/../../../../etc/passwd`)).toBeNull();
		expect(resolveExportPath("/etc/passwd")).toBeNull();
	});

	test("getDeckDetail rejects a traversal slug", async () => {
		expect(await getDeckDetail("../../etc")).toBeNull();
	});

	test("realpathWithinRoot rejects symlinks that escape the root", async () => {
		const base = await mkdtemp(path.join(tmpdir(), "presentation-smoke-"));
		try {
			const root = path.join(base, "root");
			await mkdir(root);
			const inside = path.join(root, "ok.txt");
			await writeFile(inside, "ok");
			const outside = path.join(base, "secret.txt");
			await writeFile(outside, "secret");
			const escapeLink = path.join(root, "escape.txt");
			await symlink(outside, escapeLink);

			expect(await realpathWithinRoot(root, inside)).toBe(true);
			// Symlink whose real target is outside root must be rejected.
			expect(await realpathWithinRoot(root, escapeLink)).toBe(false);
			// Missing files are rejected too.
			expect(await realpathWithinRoot(root, path.join(root, "missing.txt"))).toBe(false);
		} finally {
			await rm(base, { recursive: true, force: true });
		}
	});

	test("discovery rejects a symlinked deck directory that escapes the store", async () => {
		const outside = await mkdtemp(path.join(tmpdir(), "presentation-escape-"));
		const linkSlug = "zz-smoke-symlink-deck";
		const linkPath = path.join(DECKS_ROOT, linkSlug);
		try {
			await writeFile(path.join(outside, "index.html"), '<section class="slide"></section>');
			await symlink(outside, linkPath);
			const slugs = await getDeckSummaries();
			expect(slugs.some((deck) => deck.slug === linkSlug)).toBe(false);
			expect(await getDeckDetail(linkSlug)).toBeNull();
		} finally {
			await rm(linkPath, { force: true });
			await rm(outside, { recursive: true, force: true });
		}
	});

	test("discovery rejects a deck whose index.html symlink escapes the store", async () => {
		const outside = await mkdtemp(path.join(tmpdir(), "presentation-escape-file-"));
		const deckSlug = "zz-smoke-symlink-file";
		const deckDir = path.join(DECKS_ROOT, deckSlug);
		try {
			await writeFile(path.join(outside, "secret.html"), '<section class="slide"></section>');
			await mkdir(deckDir);
			// Real deck dir, but index.html is a symlink pointing outside the store.
			await symlink(path.join(outside, "secret.html"), path.join(deckDir, "index.html"));
			const slugs = await getDeckSummaries();
			expect(slugs.some((deck) => deck.slug === deckSlug)).toBe(false);
			expect(await getDeckDetail(deckSlug)).toBeNull();
		} finally {
			await rm(deckDir, { recursive: true, force: true });
			await rm(outside, { recursive: true, force: true });
		}
	});
});
