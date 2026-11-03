import { expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getDeckDetail, getDeckSummaries } from "../src/decks.ts";
import { DECKS_ROOT } from "../src/paths.ts";

test("a clean adoption discovers only the synthetic starter presentation", async () => {
	const decks = await getDeckSummaries();
	expect(decks.map((deck) => deck.slug)).toEqual(["2026-10-11-project-proposal"]);
	const detail = await getDeckDetail(decks[0].slug);
	expect(detail?.title).toBe("Návrh projektu · ukázka");
	expect(detail?.slideCount).toBe(4);
	expect(detail?.status).toBe("synthetic-example");
	expect(detail?.sources).toEqual(["Syntetická ukázka; neobsahuje firemní podklady."]);
	expect(detail?.exports).toEqual([]);
	const html = await readFile(join(DECKS_ROOT, decks[0].slug, "index.html"), "utf8");
	const css = await readFile(join(DECKS_ROOT, decks[0].slug, "deck.css"), "utf8");
	expect(css).toContain("@media print");
	expect(css).toContain("size: 16in 9in");
	expect(html).toContain('"ArrowRight"');
	expect(html).toContain('"ArrowLeft"');
	expect(html).not.toMatch(/https?:\/\//);
});
