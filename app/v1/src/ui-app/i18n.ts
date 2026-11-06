import { createContext, useContext } from "react";
import { instance } from "../instance.ts";

export const UI_LANGUAGES = ["cs", "en"] as const;
export type UiLanguage = (typeof UI_LANGUAGES)[number];

const SHELL_SCHEMA = "lazurio.shell.v1";

export function parseLanguage(value: unknown): UiLanguage | null {
  return (UI_LANGUAGES as readonly unknown[]).includes(value) ? (value as UiLanguage) : null;
}

/**
 * The language of the library, never mixed on one screen: `?lang=cs|en` in
 * the address (links, screenshots), else the `locale` of Lazurio's shell
 * document where the App's origin answers `/.lazurio/shell.json`, else the
 * Organization's default in `src/instance.ts`.
 */
export async function resolveLanguage(
  search: string,
  load: (path: string) => Promise<Response>,
  fallback: UiLanguage = instance.language,
): Promise<UiLanguage> {
  const fromAddress = parseLanguage(new URLSearchParams(search).get("lang"));
  if (fromAddress) return fromAddress;
  try {
    const response = await load("/.lazurio/shell.json");
    if (response.ok && (response.headers.get("content-type") ?? "").includes("json")) {
      const shell = (await response.json()) as { schema?: unknown; locale?: unknown } | null;
      if (shell?.schema === SHELL_SCHEMA) return parseLanguage(shell.locale) ?? fallback;
    }
  } catch {
    // No shell document: the App runs outside Lazurio.
  }
  return fallback;
}

type Plural = { one: string; few: string; many: string };

export type UiMessages = {
  appName: string;
  refresh: string;
  heading: string;
  lede: string;
  create: string;
  createHint: string;
  briefHeading: string;
  briefIntro: string;
  briefLabel: string;
  copyBrief: string;
  copied: string;
  copiedHint: string;
  copyHint: string;
  brief: (module: string) => string;
  loading: string;
  loadFailed: string;
  empty: string;
  footer: string;
  presentations: Plural;
  slides: Plural;
  open: string;
  openNamed: (title: string) => string;
  previewMissing: string;
  detail: string;
  closeDetail: string;
  close: string;
  detailLabel: string;
  present: string;
  loadingDetail: string;
  overview: string;
  status: string;
  purpose: string;
  language: string;
  slideCount: string;
  owner: string;
  created: string;
  updated: string;
  portfolio: string;
  audience: string;
  goal: string;
  context: string;
  sources: string;
  exports: string;
  noExports: string;
  languages: string;
  personalHeading: string;
  personalIntro: string;
  personalName: string;
  personalOrganization: string;
  personalLink: string;
  personalCopy: string;
  personalOpen: string;
  personalHint: string;
  labels: Record<string, string>;
};

const cs: UiMessages = {
  appName: "Prezentace",
  refresh: "Obnovit",
  heading: "Vaše prezentace",
  lede: "Vytvářejte prezentace s Agentem, prohlížejte podklady a promítejte hotové slidy. Každá prezentace zůstává ve vaší Organizaci.",
  create: "Vytvořit s Agentem",
  createHint: "Začněte účelem, publikem a podklady. Agent připraví osnovu i slidy.",
  briefHeading: "Zadání pro Agenta",
  briefIntro:
    "Předejte toto zadání Agentovi ve svém Prostředí. Doplní s vámi obsah a ukáže návrh před publikací.",
  briefLabel: "Text zadání",
  copyBrief: "Kopírovat zadání",
  copied: "Zkopírováno",
  copiedHint: "Zadání je připravené k vložení do chatu s Agentem.",
  copyHint: "Text můžete také označit a zkopírovat ručně.",
  brief: (module) =>
    `V modulu ${module} připrav novou prezentaci podle skillu deck-from-sources. Nejdřív se mě zeptej na účel, publikum, požadovaný výsledek, jazyk a schválené podklady a navrhni osnovu z typů slidů modulu k odsouhlasení. Použij Knowledgebase a design systém mojí Organizace, jsou-li dostupné; chybějící fakta, čísla ani identitu nevymýšlej. Zdroj napiš do deck.source.json, sestav ho příkazem bun run deck:build a připrav skutečný náhled prvního slidu. Výsledek mi ukaž v prohlížeči a připrav jako PR. Publikuj až na můj výslovný pokyn.`,
  loading: "Načítám prezentace…",
  loadFailed: "Nepodařilo se načíst prezentace:",
  empty: "Knihovna je prázdná. První prezentaci vytvořte s Agentem.",
  footer: "Tvorba s Agentem · obsah pod vaší kontrolou",
  presentations: { one: "prezentace", few: "prezentace", many: "prezentací" },
  slides: { one: "slide", few: "slidy", many: "slidů" },
  open: "Otevřít",
  openNamed: (title) => `Otevřít ${title}`,
  previewMissing: "Náhled prvního slidu není dostupný.",
  detail: "Detail",
  closeDetail: "Zavřít detail",
  close: "Zavřít",
  detailLabel: "Detail prezentace",
  present: "Otevřít / odprezentovat",
  loadingDetail: "Načítám detail…",
  overview: "Přehled",
  status: "Stav",
  purpose: "Účel",
  language: "Jazyk",
  slideCount: "Slidů",
  owner: "Autor",
  created: "Vytvořeno",
  updated: "Aktualizováno",
  portfolio: "Portfolio",
  audience: "Adresáti",
  goal: "Hlavní cíl",
  context: "Kontext",
  sources: "Zdroje",
  exports: "PDF exporty",
  noExports:
    "Zatím není uložené žádné PDF. Otevřete prezentaci a zvolte Tisk / PDF; slidy jsou připravené pro stránky v poměru 16:9.",
  languages: "Jazyky",
  personalHeading: "Osobní verze",
  personalIntro:
    "Připravte odkaz pro konkrétního zájemce: na titulním a závěrečném slidu uvidí, pro koho je prezentace připravená.",
  personalName: "Jméno zájemce",
  personalOrganization: "Organizace zájemce",
  personalLink: "Odkaz",
  personalCopy: "Kopírovat odkaz",
  personalOpen: "Otevřít osobní verzi",
  personalHint:
    "Nic se neukládá: jméno a Organizace jsou jen v odkazu. Odkaz otevře jen ten, kdo má přístup k tomuto modulu.",
  labels: {
    "project-proposal": "Návrh projektu",
    offer: "Nabídka",
    "synthetic-example": "Ukázka",
    draft: "Rozpracováno",
    "working-draft": "Pracovní verze",
    final: "Hotovo",
    cs: "Česky",
    en: "Anglicky",
  },
};

const en: UiMessages = {
  appName: "Presentations",
  refresh: "Refresh",
  heading: "Your presentations",
  lede: "Create presentations with your Agent, review their sources and present finished slides. Every presentation stays in your Organization.",
  create: "Create with Agent",
  createHint:
    "Start with the purpose, the audience and your sources. The Agent drafts the outline and the slides.",
  briefHeading: "Brief for the Agent",
  briefIntro:
    "Give this brief to the Agent in your Environment. It completes the content with you and shows you the draft before anything is published.",
  briefLabel: "Brief text",
  copyBrief: "Copy brief",
  copied: "Copied",
  copiedHint: "The brief is ready to paste into the chat with your Agent.",
  copyHint: "You can also select the text and copy it yourself.",
  brief: (module) =>
    `In the module ${module}, prepare a new presentation following the skill deck-from-sources. First ask me about the purpose, the audience, the outcome I want, the language and the approved sources, and propose an outline from the module's slide types for me to approve. Use my Organization's Knowledgebase and design system where they exist; do not invent missing facts, figures or identity. Write the source into deck.source.json, build it with bun run deck:build and prepare a real preview of the first slide. Show me the result in the browser and prepare it as a PR. Publish only on my explicit instruction.`,
  loading: "Loading presentations…",
  loadFailed: "Could not load the presentations:",
  empty: "The library is empty. Create the first presentation with your Agent.",
  footer: "Created with your Agent · content under your control",
  presentations: { one: "presentation", few: "presentations", many: "presentations" },
  slides: { one: "slide", few: "slides", many: "slides" },
  open: "Open",
  openNamed: (title) => `Open ${title}`,
  previewMissing: "The first-slide preview is not available.",
  detail: "Details",
  closeDetail: "Close details",
  close: "Close",
  detailLabel: "Presentation details",
  present: "Open / present",
  loadingDetail: "Loading details…",
  overview: "Overview",
  status: "Status",
  purpose: "Purpose",
  language: "Language",
  slideCount: "Slides",
  owner: "Author",
  created: "Created",
  updated: "Updated",
  portfolio: "Portfolio",
  audience: "Audience",
  goal: "Main goal",
  context: "Context",
  sources: "Sources",
  exports: "PDF exports",
  noExports:
    "No PDF is stored yet. Open the presentation and choose Print / PDF; the slides are laid out for 16:9 pages.",
  languages: "Languages",
  personalHeading: "Personal version",
  personalIntro:
    "Prepare a link for one prospect: the title and closing slides show who the presentation was prepared for.",
  personalName: "Prospect's name",
  personalOrganization: "Prospect's Organization",
  personalLink: "Link",
  personalCopy: "Copy link",
  personalOpen: "Open personal version",
  personalHint:
    "Nothing is stored: the name and Organization live only in the link. Only people with access to this module can open it.",
  labels: {
    "project-proposal": "Project proposal",
    offer: "Offer",
    "synthetic-example": "Sample",
    draft: "Draft",
    "working-draft": "Working draft",
    final: "Final",
    cs: "Czech",
    en: "English",
  },
};

export const MESSAGES: { [language in UiLanguage]: UiMessages } = { cs, en };

/** Czech counts one, two to four and five or more differently; English one and more. */
export function plural(count: number, forms: Plural, language: UiLanguage): string {
  if (count === 1) return forms.one;
  if (language === "cs" && count >= 2 && count <= 4) return forms.few;
  return forms.many;
}

export const LanguageContext = createContext<UiLanguage>("cs");

export function useMessages(): { language: UiLanguage; m: UiMessages } {
  const language = useContext(LanguageContext);
  return { language, m: MESSAGES[language] };
}
