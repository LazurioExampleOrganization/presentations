import { Button } from "design-system/react";
import { useState } from "react";
import type { DeckSummary } from "../../model.ts";
import { slideLabel } from "../format.ts";
import { useMessages } from "../i18n.ts";
import { OpenLink } from "./OpenLink.tsx";

export function DeckCard({
  deck,
  onOpenDetail,
}: {
  deck: DeckSummary;
  onOpenDetail: (slug: string) => void;
}) {
  const { language, m } = useMessages();
  const [previewFailed, setPreviewFailed] = useState(false);
  return (
    <article className="deck-card ds-card">
      <a
        className="deck-preview-link"
        href={deck.deckUrl}
        target="_blank"
        rel="noreferrer"
        aria-label={m.openNamed(deck.title)}
      >
        <span className="ds-visually-hidden">{m.openNamed(deck.title)}</span>
        <span className="deck-preview" aria-hidden="true">
          {previewFailed ? (
            <span className="deck-preview-error">{m.previewMissing}</span>
          ) : (
            <img
              className="deck-preview-image"
              src={deck.previewUrl}
              alt=""
              width="1280"
              height="720"
              loading="lazy"
              onError={() => setPreviewFailed(true)}
            />
          )}
        </span>
      </a>

      <div className="deck-card-body">
        <div className="deck-card-top">
          <span className="deck-meta-summary">
            {slideLabel(deck.slideCount, language)}
            {deck.exportCount > 0 ? ` · ${deck.exportCount} PDF` : ""}
          </span>
          {deck.date ? <time className="deck-date">{deck.date}</time> : null}
        </div>

        <button type="button" className="deck-title-btn" onClick={() => onOpenDetail(deck.slug)}>
          <span className="deck-title">{deck.title}</span>
        </button>

        <div className="deck-card-actions">
          <OpenLink href={deck.deckUrl}>{m.open}</OpenLink>
          <Button size="sm" variant="quiet" onClick={() => onOpenDetail(deck.slug)}>
            {m.detail}
          </Button>
        </div>
      </div>
    </article>
  );
}
