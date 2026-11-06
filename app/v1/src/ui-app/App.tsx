import { useCallback, useEffect, useRef, useState } from "react";
import type { DeckDetail, DeckSummary, HealthResponse } from "../model.ts";
import { api } from "./api.ts";
import { DeckCard } from "./components/DeckCard.tsx";
import { DeckDrawer } from "./components/DeckDrawer.tsx";
import { plural, useMessages } from "./i18n.ts";

const moduleName = (context: HealthResponse | null) =>
  context ? `${context.company}/${context.module}` : "Presentations";

type LoadState = "loading" | "ready" | "error";

export default function App() {
  const { language, m } = useMessages();
  const [context, setContext] = useState<HealthResponse | null>(null);
  const [showBrief, setShowBrief] = useState(false);
  const [copied, setCopied] = useState(false);
  const [decks, setDecks] = useState<DeckSummary[]>([]);
  const [state, setState] = useState<LoadState>("loading");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [detail, setDetail] = useState<DeckDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const loadDecks = useCallback(async () => {
    setState("loading");
    setErrorMsg(null);
    try {
      const [res, runtimeContext] = await Promise.all([api.listDecks(language), api.context()]);
      setContext(runtimeContext);
      setDecks(res.decks);
      setState("ready");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setState("error");
    }
  }, [language]);

  useEffect(() => {
    void loadDecks();
  }, [loadDecks]);

  // Guards against overlapping detail fetches: only the most recent request
  // may commit its result, so opening deck B before A resolves never shows A.
  const detailRequestRef = useRef(0);

  const openDetail = useCallback(
    async (slug: string) => {
      const requestId = ++detailRequestRef.current;
      setSelectedSlug(slug);
      setDetail(null);
      setDetailError(null);
      setDetailLoading(true);
      try {
        const loaded = await api.deckDetail(slug, language);
        if (detailRequestRef.current === requestId) setDetail(loaded);
      } catch (err) {
        if (detailRequestRef.current === requestId) {
          setDetailError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (detailRequestRef.current === requestId) setDetailLoading(false);
      }
    },
    [language],
  );

  const closeDetail = useCallback(() => {
    detailRequestRef.current += 1;
    setSelectedSlug(null);
    setDetail(null);
    setDetailError(null);
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <strong className="app-name">{m.appName}</strong>
        <div className="app-header-meta">
          <span>
            {decks.length} {plural(decks.length, m.presentations, language)}
          </span>
          <button
            type="button"
            className="lz-button lz-button--secondary lz-button--small"
            onClick={() => void loadDecks()}
          >
            {m.refresh}
          </button>
        </div>
      </header>

      <main className="app-main">
        <div className="page-head">
          <h1 className="lz-type-display">{m.heading}</h1>
          <p className="page-lede">{m.lede}</p>
        </div>

        <div className="authoring">
          <button
            type="button"
            className="lz-button lz-button--primary"
            disabled={!context}
            aria-expanded={showBrief}
            onClick={() => setShowBrief(!showBrief)}
          >
            {m.create}
          </button>
          <p className="hint">{m.createHint}</p>
        </div>
        {showBrief ? (
          <section className="brief-panel" aria-label={m.briefHeading}>
            <h2>{m.briefHeading}</h2>
            <p>{m.briefIntro}</p>
            <div className="lz-field">
              <textarea
                aria-label={m.briefLabel}
                rows={6}
                readOnly
                value={m.brief(moduleName(context))}
              />
            </div>
            <button
              type="button"
              className="lz-button lz-button--secondary"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(m.brief(moduleName(context)));
                  setCopied(true);
                } catch {
                  setCopied(false);
                }
              }}
            >
              {copied ? m.copied : m.copyBrief}
            </button>
            <p className="hint" role="status">
              {copied ? m.copiedHint : m.copyHint}
            </p>
          </section>
        ) : null}

        {state === "loading" ? <div className="state">{m.loading}</div> : null}
        {state === "error" ? (
          <div className="state state-error">
            {m.loadFailed} {errorMsg}
          </div>
        ) : null}
        {state === "ready" && decks.length === 0 ? <div className="state">{m.empty}</div> : null}
        {state === "ready" && decks.length > 0 ? (
          <div className="deck-grid">
            {decks.map((deck) => (
              <DeckCard key={deck.slug} deck={deck} onOpenDetail={openDetail} />
            ))}
          </div>
        ) : null}

        <footer className="app-footer">{m.footer}</footer>
      </main>

      {selectedSlug ? (
        <DeckDrawer
          slug={selectedSlug}
          detail={detail}
          loading={detailLoading}
          error={detailError}
          onClose={closeDetail}
        />
      ) : null}
    </div>
  );
}
