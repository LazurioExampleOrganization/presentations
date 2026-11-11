import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import type { DeckDetail } from "../src/model.ts";
import { DeckDrawer } from "../src/ui-app/components/DeckDrawer.tsx";
import { LanguageContext, type UiLanguage } from "../src/ui-app/i18n.ts";

const detail = (personal: boolean): DeckDetail => ({
  slug: "2026-01-01-deck",
  title: "Deck",
  date: "2026-01-01",
  purpose: null,
  status: null,
  language: "cs",
  audience: [],
  portfolioModel: null,
  slideCount: 3,
  hasMeta: true,
  exportCount: 0,
  deckUrl: "/decks/2026-01-01-deck/",
  previewUrl: "/previews/2026-01-01-deck.jpg",
  languages: ["cs"],
  personal,
  owner: null,
  createdAt: null,
  updatedAt: null,
  primaryGoal: null,
  mentalModel: null,
  sources: [],
  exports: [],
  meta: null,
});

const render = (personal: boolean, language: UiLanguage = "cs") =>
  renderToStaticMarkup(
    <LanguageContext.Provider value={language}>
      <DeckDrawer
        slug="2026-01-01-deck"
        detail={detail(personal)}
        loading={false}
        error={null}
        onClose={() => {}}
      />
    </LanguageContext.Provider>,
  );

test("the detail offers a personal version for a deck that makes one", () => {
  const html = render(true);
  expect(html).toContain("Jméno zájemce");
  expect(html).toContain("Organizace zájemce");
  expect(html).not.toContain("data-personal-unavailable");
});

test("the detail says why a deck has no personal version, and offers no fields", () => {
  for (const language of ["cs", "en"] as const) {
    const html = render(false, language);
    expect(html).toContain("data-personal-unavailable");
    expect(html).not.toContain("<input");
    expect(html).toContain("deck-from-sources");
  }
  expect(render(false, "en")).toContain("This presentation has no personal version.");
});
