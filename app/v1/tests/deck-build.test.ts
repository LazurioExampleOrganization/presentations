import { afterAll, describe, expect, test } from "bun:test";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildDeck, deckDrift, sourceDecks, writeDeck } from "../src/deck/build.ts";
import { SLIDE_TYPES } from "../src/deck/source.ts";
import { DECKS_ROOT } from "../src/paths.ts";

const SAMPLE = "2026-11-02-example-office-coffee";
const work = mkdtempSync(join(realpathSync.native(tmpdir()), "presentations-decks-"));
afterAll(() => rmSync(work, { recursive: true, force: true }));

const text = (files: Map<string, string | Uint8Array>, path: string) => {
  const content = files.get(path);
  if (typeof content !== "string") throw new Error(`${path} is not a built text file`);
  return content;
};

describe("deck:build", () => {
  test("every deck with a source is up to date with it (run bun run deck:build)", async () => {
    const slugs = await sourceDecks();
    expect(slugs).toContain(SAMPLE);
    for (const slug of slugs) {
      const deckDir = join(DECKS_ROOT, slug);
      expect(await deckDrift(deckDir, await buildDeck(deckDir)), slug).toEqual([]);
    }
  });

  test("builds one page per language, the slides in order, without network or storage", async () => {
    const files = await buildDeck(join(DECKS_ROOT, SAMPLE));
    expect([...files.keys()].filter((path) => path.endsWith(".html")).sort()).toEqual([
      "index.en.html",
      "index.html",
    ]);
    const cs = text(files, "index.html");
    const en = text(files, "index.en.html");
    expect(cs).toContain('<html lang="cs">');
    expect(en).toContain('<html lang="en">');
    expect(cs).toContain("Káva, která se o sebe postará");
    expect(en).toContain("Office coffee that takes care of itself");
    expect(en).not.toContain("Káva");
    const types = [...cs.matchAll(/data-type="([a-z]+)"/g)].map((match) => match[1]);
    expect(new Set(types)).toEqual(new Set(SLIDE_TYPES));
    for (const page of [cs, en, text(files, "assets/deck.js"), text(files, "assets/deck.css")]) {
      expect(page).not.toMatch(/https?:\/\/(?!www\.w3\.org)/);
      expect(page).not.toMatch(/localStorage|sessionStorage|document\.cookie|innerHTML/);
    }
    expect(cs).toContain('href="./index.en.html"');
    expect(en).toContain('href="./index.html"');
  });

  test("a video slide starts muted, offers no sound it does not have and prints its poster", async () => {
    const page = text(await buildDeck(join(DECKS_ROOT, SAMPLE)), "index.html");
    const video = page.match(/<video [^>]*>/)?.[0] ?? "";
    expect(video).toContain("muted");
    expect(video).toContain('src="./media/coffee-setup.mp4"');
    expect(video).not.toContain("autoplay");
    expect(page).not.toContain("data-video-sound");
    expect(page).toContain('class="video-print" src="./media/coffee-setup-poster.jpg"');
  });

  test("records every language's own words in deck.meta.json", async () => {
    const meta = JSON.parse(text(await buildDeck(join(DECKS_ROOT, SAMPLE)), "deck.meta.json"));
    expect(meta.schema_version).toBe("lazurio.presentation.deck.v1");
    expect(meta.language).toBe("cs");
    expect(meta.variants.map((variant: { file: string }) => variant.file)).toEqual([
      "index.html",
      "index.en.html",
    ]);
    expect(meta.variants[1].title).toBe("Example · Coffee for your office");
    expect(meta.slides).toHaveLength(11);
  });

  test("escapes the source's text and writes only the files it owns", async () => {
    const deckDir = join(work, "2026-11-03-escape-check");
    cpSync(join(DECKS_ROOT, SAMPLE), deckDir, { recursive: true });
    const source = {
      schema_version: "lazurio.presentation.source.v1",
      languages: ["en"],
      title: '<script>alert("x")</script>',
      created_at: "2026-11-03",
      slides: [{ type: "section", title: "Q&A <now>" }],
    };
    writeFileSync(join(deckDir, "deck.source.json"), JSON.stringify(source));
    writeFileSync(join(deckDir, "notes.md"), "the author's own file");
    const files = await buildDeck(deckDir);
    const page = text(files, "index.html");
    expect(page).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;");
    expect(page).toContain("Q&amp;A &lt;now&gt;");
    expect(page).not.toContain("<script>alert");
    expect(await deckDrift(deckDir, files)).toContain("stale index.en.html");
    await writeDeck(deckDir, files);
    expect(existsSync(join(deckDir, "index.en.html"))).toBe(false);
    expect(existsSync(join(deckDir, "notes.md"))).toBe(true);
    expect(existsSync(join(deckDir, "media", "coffee-setup.mp4"))).toBe(true);
    expect(await deckDrift(deckDir, files)).toEqual([]);
  });

  test("the command refuses an invalid source and names the field", () => {
    const deckDir = join(work, "2026-11-04-invalid");
    cpSync(join(DECKS_ROOT, SAMPLE), deckDir, { recursive: true });
    const source = JSON.parse(readFileSync(join(deckDir, "deck.source.json"), "utf8"));
    source.slides[0].title = { cs: "jen česky" };
    writeFileSync(join(deckDir, "deck.source.json"), JSON.stringify(source));
    const run = Bun.spawnSync(
      [process.execPath, "run", "src/cli/deck-build.ts", "--root", work, "2026-11-04-invalid"],
      { cwd: join(import.meta.dir, ".."), stdout: "pipe", stderr: "pipe" },
    );
    expect(run.exitCode).toBe(1);
    expect(run.stderr.toString()).toContain("deck.slides[0].title.en");
  });
});
