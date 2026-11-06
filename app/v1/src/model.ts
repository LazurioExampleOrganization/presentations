// Shared types between the Bun API (src/server.ts) and the React UI
// (src/ui-app). Deck metadata follows the lazurio.presentation.deck.v1
// shape, but every field is treated as optional because real decks vary
// (a deck may have no deck.meta.json at all).

export type DeckExportsMeta = {
  pdf?: string;
  vector_pdf?: string;
  status?: string;
  generated_at?: string;
  pages?: number;
  delivery_pdf_kind?: string;
  vector_backup_kind?: string;
};

/** One language of a deck built from its source (`deck:build`). */
export type DeckVariantMeta = {
  language?: string;
  file?: string;
  title?: string;
  owner?: string;
  audience?: string[];
  sources?: string[];
  primary_goal?: string;
};

export type DeckMeta = {
  schema_version?: string;
  title?: string;
  purpose?: string;
  status?: string;
  language?: string;
  created_at?: string;
  updated_at?: string;
  owner?: string;
  audience?: string[];
  sources?: string[];
  exports?: DeckExportsMeta;
  primary_goal?: string;
  mental_model?: string;
  contrast_policy?: string;
  portfolio_model?: string;
  client_facing?: boolean;
  /** Every language of the deck, the primary first (decks built from a source). */
  variants?: DeckVariantMeta[];
  slides?: { type?: string; title?: string }[];
};

/** An actual exported file found on disk under decks/<slug>/exports. */
export type DeckExportFile = {
  name: string;
  /** Servable URL, e.g. /decks/<slug>/exports/<name>. */
  url: string;
  bytes: number;
};

/** Card-level summary shown in the gallery. */
export type DeckSummary = {
  slug: string;
  title: string;
  date: string | null;
  purpose: string | null;
  status: string | null;
  language: string | null;
  audience: string[];
  portfolioModel: string | null;
  slideCount: number;
  hasMeta: boolean;
  exportCount: number;
  /** URL that opens/presents the deck in `language` (index.html or index.<language>.html). */
  deckUrl: string;
  /** The first-slide preview in `language`. */
  previewUrl: string;
  /** Every language the deck has; `language` is the one this summary shows. */
  languages: string[];
};

/** Full detail shown in the deck drawer. */
export type DeckDetail = DeckSummary & {
  owner: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  primaryGoal: string | null;
  mentalModel: string | null;
  sources: string[];
  exports: DeckExportFile[];
  meta: DeckMeta | null;
};

export type DeckListResponse = { decks: DeckSummary[]; generatedAt: string };
export type HealthResponse = {
  ok: boolean;
  app: string;
  generation: string;
  company: string;
  module: string;
};
