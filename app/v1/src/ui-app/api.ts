import type { DeckDetail, DeckSummary, HealthResponse } from "../model.ts";

export type DeckListResponse = { decks: DeckSummary[]; generatedAt: string };

async function jsonFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  const data = await res.json();
  if (!res.ok) {
    const detail = data as { message?: string; error?: string };
    throw new Error(detail.message || detail.error || `Request failed (${res.status})`);
  }
  return data as T;
}

/** The library's API; deck words come in `language` where a deck has it. */
export const api = {
  context: () => jsonFetch<HealthResponse>("/api/health"),
  listDecks: (language: string) =>
    jsonFetch<DeckListResponse>(`/api/decks?lang=${encodeURIComponent(language)}`),
  deckDetail: (slug: string, language: string) =>
    jsonFetch<DeckDetail>(
      `/api/decks/${encodeURIComponent(slug)}?lang=${encodeURIComponent(language)}`,
    ),
};
