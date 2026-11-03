/** Czech plural for "slide": 1 slide, 2-4 slidy, 0/5+ slidů. */
export function slideLabel(count: number): string {
  if (count === 1) return "1 slide";
  if (count >= 2 && count <= 4) return `${count} slidy`;
  return `${count} slidů`;
}

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} kB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Human-readable labels for shipped examples; custom values stay intact. */
export function metadataLabel(value: string | null): string | null {
  const labels: Record<string, string> = {
    "project-proposal": "Návrh projektu",
    "synthetic-example": "Ukázka",
    cs: "Česky",
    en: "Anglicky",
  };
  return value ? (labels[value] ?? value) : null;
}
