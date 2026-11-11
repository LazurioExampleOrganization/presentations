import { Alert, Button, TextField } from "design-system/react";
import { type ReactNode, useEffect, useId, useState } from "react";
import type { DeckDetail } from "../../model.ts";
import { formatBytes, metadataLabel, personalLink, slideLabel } from "../format.ts";
import { useMessages } from "../i18n.ts";
import { OpenLink } from "./OpenLink.tsx";

function Row({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </>
  );
}

/** The explanation behind a "?" next to a heading; it opens on click and on touch. */
function Help({ children }: { children: ReactNode }) {
  const { m } = useMessages();
  return (
    <details className="help">
      <summary aria-label={m.help} title={m.help}>
        ?
      </summary>
      <div className="help-body">{children}</div>
    </details>
  );
}

/** Personal version: offered only for a deck that renders it from its link. */
function PersonalSection({ deckUrl, supported }: { deckUrl: string; supported: boolean }) {
  const { m } = useMessages();
  return (
    <section className="drawer-section personal-version">
      <div className="section-head">
        <h3>{m.personalHeading}</h3>
        <Help>
          <p>{supported ? m.personalIntro : m.personalUnavailableHelp}</p>
          {supported ? <p>{m.personalHint}</p> : null}
        </Help>
      </div>
      {supported ? (
        <PersonalVersion deckUrl={deckUrl} />
      ) : (
        <p className="hint" data-personal-unavailable>
          {m.personalUnavailable}
        </p>
      )}
    </section>
  );
}

/** A link for one prospect: the name and Organization live in the link only. */
function PersonalVersion({ deckUrl }: { deckUrl: string }) {
  const { language, m } = useMessages();
  const [name, setName] = useState("");
  const [organization, setOrganization] = useState("");
  const [copied, setCopied] = useState(false);
  const nameId = useId();
  const organizationId = useId();
  const linkId = useId();
  const ready = name.trim() !== "" || organization.trim() !== "";
  const link = ready ? personalLink(window.location.origin, deckUrl, name, organization) : "";
  return (
    <>
      <div className="personal-fields">
        <TextField
          id={nameId}
          label={m.personalName}
          locale={language}
          maxLength={80}
          autoComplete="off"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setCopied(false);
          }}
        />
        <TextField
          id={organizationId}
          label={m.personalOrganization}
          locale={language}
          maxLength={80}
          autoComplete="off"
          value={organization}
          onChange={(event) => {
            setOrganization(event.target.value);
            setCopied(false);
          }}
        />
      </div>
      {ready ? (
        <>
          <TextField id={linkId} label={m.personalLink} locale={language} readOnly value={link} />
          <div className="personal-actions">
            <Button
              size="sm"
              icon="copy"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(link);
                  setCopied(true);
                } catch {
                  setCopied(false);
                }
              }}
            >
              {copied ? m.copied : m.personalCopy}
            </Button>
            <OpenLink href={link} variant="quiet">
              {m.personalOpen}
            </OpenLink>
          </div>
        </>
      ) : null}
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
  const { language, m } = useMessages();
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const presentUrl = detail?.deckUrl ?? `/decks/${slug}/`;
  const label = (value: string | null) => metadataLabel(value, language);

  return (
    <div className="drawer-backdrop">
      <button
        type="button"
        className="drawer-dismiss"
        aria-label={m.closeDetail}
        onClick={onClose}
      />
      <aside className="drawer-panel" aria-label={m.detailLabel}>
        <div className="drawer-head">
          <div>
            <h2 className="drawer-title ds-type-title">{detail?.title ?? slug}</h2>
            <p className="hint">{slug}</p>
          </div>
          <Button
            variant="quiet"
            size="sm"
            iconOnly
            icon="xmark"
            label={m.close}
            className="drawer-close"
            onClick={onClose}
          />
        </div>

        <div className="drawer-actions">
          <OpenLink href={presentUrl} variant="primary" size="md">
            {m.present}
          </OpenLink>
        </div>

        {loading ? <p className="hint">{m.loadingDetail}</p> : null}
        {error ? (
          <Alert tone="danger" locale={language} live="assertive">
            {error}
          </Alert>
        ) : null}

        {detail ? (
          <>
            <section className="drawer-section">
              <h3>{m.overview}</h3>
              <dl className="detail-grid">
                <Row label={m.status} value={label(detail.status)} />
                <Row label={m.purpose} value={label(detail.purpose)} />
                <Row label={m.language} value={label(detail.language)} />
                <Row
                  label={m.languages}
                  value={
                    detail.languages.length > 1
                      ? detail.languages.map((code) => label(code)).join(", ")
                      : null
                  }
                />
                <Row label={m.slideCount} value={slideLabel(detail.slideCount, language)} />
                <Row label={m.owner} value={detail.owner} />
                <Row label={m.created} value={detail.createdAt} />
                <Row label={m.updated} value={detail.updatedAt} />
                <Row label={m.portfolio} value={detail.portfolioModel} />
                <Row
                  label={m.audience}
                  value={detail.audience.length ? detail.audience.join(", ") : null}
                />
              </dl>
            </section>

            {detail.primaryGoal ? (
              <section className="drawer-section">
                <h3>{m.goal}</h3>
                <p>{detail.primaryGoal}</p>
              </section>
            ) : null}

            {detail.mentalModel ? (
              <section className="drawer-section">
                <h3>{m.context}</h3>
                <p className="hint">{detail.mentalModel}</p>
              </section>
            ) : null}

            <PersonalSection deckUrl={detail.deckUrl} supported={detail.personal} />

            {detail.sources.length > 0 ? (
              <section className="drawer-section">
                <h3>{m.sources}</h3>
                <ul className="source-list">
                  {detail.sources.map((source) => (
                    <li key={source}>{source}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className="drawer-section">
              <h3>{m.exports}</h3>
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
                <p className="hint">{m.noExports}</p>
              )}
            </section>
          </>
        ) : null}
      </aside>
    </div>
  );
}
