import { MESSAGES, plural, type UiLanguage } from "./i18n.ts";

/** "1 slide", "3 slidy", "5 slidů"; in English "1 slide", "5 slides". */
export function slideLabel(count: number, language: UiLanguage = "cs"): string {
  return `${count} ${plural(count, MESSAGES[language].slides, language)}`;
}

/**
 * A deck's day ("2026-11-02") in the interface's language: "2. 11. 2026",
 * "2 Nov 2026". Anything that is not a calendar day stays as written.
 */
export function formatDay(value: string, language: UiLanguage = "cs"): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  const [, year, month, day] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  // Date.UTC reads the years 0–99 as 1900–1999 and rolls an impossible day
  // over; either way the date shown would differ from the one written.
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  )
    return value;
  return new Intl.DateTimeFormat(language === "cs" ? "cs-CZ" : "en-GB", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(date);
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
