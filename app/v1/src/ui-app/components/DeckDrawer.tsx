import { useEffect } from "react";
import type { DeckDetail } from "../../model.ts";
import { formatBytes, metadataLabel, slideLabel } from "../format.ts";

function Row({ label, value }: { label: string; value: string | null }) {
	if (!value) return null;
	return (
		<>
			<dt>{label}</dt>
			<dd>{value}</dd>
		</>
	);
}

export function DeckDrawer({
	slug,
	detail,
	loading,
	error,
	onClose,
}: {
	slug: string;
	detail: DeckDetail | null;
	loading: boolean;
	error: string | null;
	onClose: () => void;
}) {
	useEffect(() => {
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onClose]);

	const presentUrl = detail?.deckUrl ?? `/decks/${slug}/`;

	return (
		<div className="drawer-backdrop">
			<button
				type="button"
				className="drawer-dismiss"
				aria-label="Zavřít detail"
				onClick={onClose}
			/>
			<aside className="drawer-panel" aria-label="Detail prezentace">
				<div className="drawer-head">
					<div>
						<h2 className="drawer-title">{detail?.title ?? slug}</h2>
						<p className="hint">{slug}</p>
					</div>
					<button
						type="button"
						className="lz-button lz-button--quiet lz-button--small drawer-close"
						onClick={onClose}
						aria-label="Zavřít"
					>
						×
					</button>
				</div>

				<div className="drawer-actions">
					<a
						className="lz-button lz-button--primary"
						href={presentUrl}
						target="_blank"
						rel="noreferrer"
					>
						Otevřít / odprezentovat
					</a>
				</div>

				{loading ? <p className="hint">Načítám detail…</p> : null}
				{error ? <p className="hint state-error">{error}</p> : null}

				{detail ? (
					<>
						<section className="drawer-section">
							<h3>Přehled</h3>
							<dl className="detail-grid">
								<Row label="Status" value={metadataLabel(detail.status)} />
								<Row label="Účel" value={metadataLabel(detail.purpose)} />
								<Row label="Jazyk" value={metadataLabel(detail.language)} />
								<Row label="Slidů" value={slideLabel(detail.slideCount)} />
								<Row label="Autor" value={detail.owner} />
								<Row label="Vytvořeno" value={detail.createdAt} />
								<Row label="Aktualizováno" value={detail.updatedAt} />
								<Row label="Portfolio" value={detail.portfolioModel} />
								<Row
									label="Adresáti"
									value={detail.audience.length ? detail.audience.join(", ") : null}
								/>
							</dl>
						</section>

						{detail.primaryGoal ? (
							<section className="drawer-section">
								<h3>Hlavní cíl</h3>
								<p>{detail.primaryGoal}</p>
							</section>
						) : null}

						{detail.mentalModel ? (
							<section className="drawer-section">
								<h3>Kontext</h3>
								<p className="hint">{detail.mentalModel}</p>
							</section>
						) : null}

						{detail.sources.length > 0 ? (
							<section className="drawer-section">
								<h3>Zdroje</h3>
								<ul className="source-list">
									{detail.sources.map((source) => (
										<li key={source}>{source}</li>
									))}
								</ul>
							</section>
						) : null}

						<section className="drawer-section">
							<h3>PDF exporty</h3>
							{detail.exports.length > 0 ? (
								<ul className="export-list">
									{detail.exports.map((file) => (
										<li key={file.name}>
											<a className="export-link" href={file.url} target="_blank" rel="noreferrer">
												<span>{file.name}</span>
												<span className="export-bytes">{formatBytes(file.bytes)}</span>
											</a>
										</li>
									))}
								</ul>
							) : (
								<p className="hint">
									Zatím není uložené žádné PDF. Otevři prezentaci a zvol tisk do PDF (Cmd/Ctrl+P).
									Slidy jsou připravené pro stránky v poměru 16:9.
								</p>
							)}
						</section>
					</>
				) : null}
			</aside>
		</div>
	);
}
