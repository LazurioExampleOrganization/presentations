import { MESSAGES, plural, type UiLanguage } from "./i18n.ts";

/** "1 slide", "3 slidy", "5 slidů"; in English "1 slide", "5 slides". */
export function slideLabel(count: number, language: UiLanguage = "cs"): string {
  return `${count} ${plural(count, MESSAGES[language].slides, language)}`;
}

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Human-readable labels for known metadata codes; custom values stay intact. */
export function metadataLabel(value: string | null, language: UiLanguage = "cs"): string | null {
  return value ? (MESSAGES[language].labels[value] ?? value) : null;
}

/** The link of a personal version: the deck's address with the prospect in its query, nothing stored. */
export function personalLink(
  origin: string,
  deckUrl: string,
  name: string,
  organization: string,
): string {
  const url = new URL(deckUrl, origin);
  if (name.trim()) url.searchParams.set("for", name.trim());
  if (organization.trim()) url.searchParams.set("org", organization.trim());
  return url.toString();
}
