// What a deck reads from its address: the slide (#3) and, for a personal
// version, who it is prepared for (?for=…&org=…, in Czech also ?pro=…&firma=…).
// Pure functions, shared by the runtime and its tests.

const PERSONAL_MAX = 80;

/** A value from the link, as plain text: no control characters, one line, at most 80 characters. */
export function personalValue(raw: string | null): string {
  if (!raw) return "";
  let clean = "";
  for (const char of raw) {
    const code = char.codePointAt(0) ?? 0;
    clean += code < 32 || code === 127 ? " " : char;
  }
  return Array.from(clean.replace(/\s+/g, " ").trim()).slice(0, PERSONAL_MAX).join("").trim();
}

/** Who the deck is prepared for, from the link's parameters; empty when the link names nobody. */
export function personalWho(search: string): string {
  const params = new URLSearchParams(search);
  const name = personalValue(params.get("for") ?? params.get("pro"));
  const organization = personalValue(params.get("org") ?? params.get("firma"));
  return [name, organization].filter(Boolean).join(", ");
}

/** The slide the address names (#1 is the first), clamped to the deck. */
export function slideFromHash(hash: string, count: number): number {
  const number = Number.parseInt(hash.replace(/^#/, ""), 10);
  if (!Number.isFinite(number)) return 0;
  return Math.min(Math.max(number - 1, 0), count - 1);
}
