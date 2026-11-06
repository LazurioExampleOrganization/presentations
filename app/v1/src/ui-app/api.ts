import type { DeckDetail, DeckSummary, HealthResponse } from "../model.ts";

export type DeckListResponse = { decks: DeckSummary[]; generatedAt: string };

async function jsonFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "content-type": "application/json" } });
  const data = await res.json();
  if (!res.ok) {
    const detail = data as { message?: string; error?: string };
    throw new Error(detail.message || detail.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  context: () => jsonFetch<HealthResponse>("/api/health"),
  listDecks: () => jsonFetch<DeckListResponse>("/api/decks"),
  deckDetail: (slug: string) => jsonFetch<DeckDetail>(`/api/decks/${encodeURIComponent(slug)}`),
};
