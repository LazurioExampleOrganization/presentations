import { useCallback, useEffect, useRef, useState } from "react";
import type { DeckDetail, DeckSummary, HealthResponse } from "../model.ts";
import { api } from "./api.ts";
import { DeckCard } from "./components/DeckCard.tsx";
import { DeckDrawer } from "./components/DeckDrawer.tsx";

const agentBrief = (context: HealthResponse | null) =>
	`V Modulu ${context ? `${context.company}/${context.module}` : "Presentations"} vytvoř novou prezentaci. Nejprve se mě zeptej na účel, publikum, požadovaný výsledek a schválené zdroje. Navrhni osnovu k odsouhlasení. Použij Knowledgebase a design systém mojí Organizace, jsou-li dostupné; chybějící fakta a identitu nevymýšlej. Vytvoř samostatný HTML deck s metadaty, ovládáním šipkami, print CSS a skutečným JPEG náhledem prvního slidu. Původní ukázku zachovej. Výsledek mi ukaž v prohlížeči a připrav jako PR. Publikuj až na můj výslovný pokyn.`;

type LoadState = "loading" | "ready" | "error";

export default function App() {
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
			const [res, runtimeContext] = await Promise.all([api.listDecks(), api.context()]);
			setContext(runtimeContext);
			setDecks(res.decks);
			setState("ready");
		} catch (err) {
			setErrorMsg(err instanceof Error ? err.message : String(err));
			setState("error");
		}
	}, []);

	useEffect(() => {
		void loadDecks();
	}, [loadDecks]);

	// Guards against overlapping detail fetches: only the most recent request
	// may commit its result, so opening deck B before A resolves never shows A.
	const detailRequestRef = useRef(0);

	const openDetail = useCallback(async (slug: string) => {
		const requestId = ++detailRequestRef.current;
		setSelectedSlug(slug);
		setDetail(null);
		setDetailError(null);
		setDetailLoading(true);
		try {
			const loaded = await api.deckDetail(slug);
			if (detailRequestRef.current === requestId) setDetail(loaded);
		} catch (err) {
			if (detailRequestRef.current === requestId) {
				setDetailError(err instanceof Error ? err.message : String(err));
			}
		} finally {
			if (detailRequestRef.current === requestId) setDetailLoading(false);
		}
	}, []);

	const closeDetail = useCallback(() => {
		detailRequestRef.current += 1;
		setSelectedSlug(null);
		setDetail(null);
		setDetailError(null);
	}, []);

	return (
		<div className="app">
			<header className="app-header">
				<strong className="app-name">Presentations</strong>
				<div className="app-header-meta">
					<span>
						{decks.length}{" "}
						{decks.length === 1
							? "prezentace"
							: decks.length < 5 && decks.length > 0
								? "prezentace"
								: "prezentací"}
					</span>
					<button
						type="button"
						className="lz-button lz-button--secondary lz-button--small"
						onClick={() => void loadDecks()}
					>
						Obnovit
					</button>
				</div>
			</header>

			<main className="app-main">
				<div className="page-head">
					<h1 className="lz-type-display">Vaše prezentace</h1>
					<p className="page-lede">
						Vytvářejte prezentace s Agentem, prohlížejte podklady a promítejte hotové slidy. Každá
						prezentace zůstává ve vaší Organizaci.
					</p>
				</div>

				<div className="authoring">
					<button
						type="button"
						className="lz-button lz-button--primary"
						disabled={!context}
						aria-expanded={showBrief}
						onClick={() => setShowBrief(!showBrief)}
					>
						Vytvořit s Agentem
					</button>
					<p className="hint">
						Začněte účelem, publikem a podklady. Agent připraví osnovu i slidy.
					</p>
				</div>
				{showBrief ? (
					<section className="brief-panel" aria-label="Zadání pro Agenta">
						<h2>Zadání pro Agenta</h2>
						<p>
							Předejte toto zadání Agentovi ve svém Prostředí. Doplní s vámi obsah a ukáže návrh
							před publikací.
						</p>
						<div className="lz-field">
							<textarea aria-label="Text zadání" rows={6} readOnly value={agentBrief(context)} />
						</div>
						<button
							type="button"
							className="lz-button lz-button--secondary"
							onClick={async () => {
								try {
									await navigator.clipboard.writeText(agentBrief(context));
									setCopied(true);
								} catch {
									setCopied(false);
								}
							}}
						>
							{copied ? "Zkopírováno" : "Kopírovat zadání"}
						</button>
						<p className="hint" role="status">
							{copied
								? "Zadání je připravené k vložení do chatu s Agentem."
								: "Text můžete také označit a zkopírovat ručně."}
						</p>
					</section>
				) : null}

				{state === "loading" ? <div className="state">Načítám prezentace…</div> : null}
				{state === "error" ? (
					<div className="state state-error">Nepodařilo se načíst prezentace: {errorMsg}</div>
				) : null}
				{state === "ready" && decks.length === 0 ? (
					<div className="state">Knihovna je prázdná. První prezentaci vytvořte s Agentem.</div>
				) : null}
				{state === "ready" && decks.length > 0 ? (
					<div className="deck-grid">
						{decks.map((deck) => (
							<DeckCard key={deck.slug} deck={deck} onOpenDetail={openDetail} />
						))}
					</div>
				) : null}

				<footer className="app-footer">Tvorba s Agentem · obsah pod vaší kontrolou</footer>
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
