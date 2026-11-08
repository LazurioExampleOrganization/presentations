import { DECK_MESSAGES } from "./messages.ts";
import { escapeHtml, renderSlide, slideTitle } from "./slides.ts";
import { type DeckSource, type Language, textIn } from "./source.ts";

export const PRESENTATION_META_SCHEMA = "lazurio.presentation.deck.v1";

/** The page of one language: `index.html` for the primary language, `index.<language>.html` otherwise. */
export function pageFile(source: DeckSource, language: Language): string {
  return language === source.languages[0] ? "index.html" : `index.${language}.html`;
}

/** The built page of a deck in one language: the slides, the controls and the runtime. */
export function renderDeckPage(source: DeckSource, slug: string, language: Language): string {
  const messages = DECK_MESSAGES[language];
  const ctx = { language, messages, personal: source.personal !== false };
  const title = textIn(source.title, language);
  const others = source.languages.filter((other) => other !== language);
  const switches = others
    .map(
      (other) =>
        `<a class="deck-control deck-language" data-language-switch hreflang="${other}" lang="${other}" href="./${pageFile(source, other)}">${escapeHtml(DECK_MESSAGES[other].languageName)}</a>`,
    )
    .join("");
  const slides = source.slides.map((slide, index) => renderSlide(slide, index, ctx)).join("\n");
  return `<!doctype html>
<html lang="${language}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="generator" content="Presentations deck:build">
<title>${escapeHtml(title)}</title>
<link rel="stylesheet" href="./assets/deck.css">
</head>
<body data-slug="${escapeHtml(slug)}" data-language="${language}" data-title="${escapeHtml(title)}">
<main class="deck-stage" id="stage">
<div class="deck-viewport" id="viewport">
<div class="deck" id="deck">
${slides}
</div>
</div>
</main>
<nav class="deck-controls" aria-label="${escapeHtml(messages.controls)}">
<button type="button" class="deck-control" id="previous" aria-label="${escapeHtml(messages.previous)}">←</button>
<span class="deck-counter" id="counter" aria-live="polite">1 / ${source.slides.length}</span>
<button type="button" class="deck-control" id="next" aria-label="${escapeHtml(messages.next)}">→</button>
<button type="button" class="deck-control" id="present">${escapeHtml(messages.present)}</button>
<button type="button" class="deck-control" id="print">${escapeHtml(messages.print)}</button>
${switches}<a class="deck-control deck-library" id="library" href="/">${escapeHtml(messages.library)}</a>
</nav>
<div class="deck-progress" aria-hidden="true"><div id="progress"></div></div>
<script type="application/json" id="deck-messages">${JSON.stringify(messages).replaceAll("<", "\\u003c")}</script>
<script src="./assets/deck.js" defer></script>
</body>
</html>
`;
}

export type DeckVariantMeta = {
  language: Language;
  file: string;
  title: string;
  owner?: string;
  audience?: string[];
  sources?: string[];
  primary_goal?: string;
};

/**
 * `deck.meta.json` of a built deck. The top level is the primary language,
 * as a deck of release 0.1 has it; `variants` lists every language's page and
 * its own words, so the library never mixes languages on one screen.
 */
export function deckMeta(source: DeckSource) {
  const variant = (language: Language): DeckVariantMeta => ({
    language,
    file: pageFile(source, language),
    title: textIn(source.title, language),
    owner: source.owner && textIn(source.owner, language),
    audience: source.audience?.map((entry) => textIn(entry, language)),
    sources: source.sources?.map((entry) => textIn(entry, language)),
    primary_goal: source.primary_goal && textIn(source.primary_goal, language),
  });
  const variants = source.languages.map(variant);
  const [primary] = variants;
  if (!primary) throw new Error("a deck has at least one language");
  return {
    schema_version: PRESENTATION_META_SCHEMA,
    generated_from: "deck.source.json",
    title: primary.title,
    purpose: source.purpose,
    status: source.status,
    language: primary.language,
    created_at: source.created_at,
    updated_at: source.updated_at,
    owner: primary.owner,
    audience: primary.audience,
    sources: primary.sources,
    primary_goal: primary.primary_goal,
    /** The pages show "Prepared for …" from the link (`?for=`, `?org=`). */
    personal: source.personal !== false,
    variants,
    slides: source.slides.map((slide) => ({
      type: slide.type,
      title: slideTitle(slide, primary.language),
    })),
  };
}
