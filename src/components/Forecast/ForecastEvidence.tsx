// The details behind Grant's read (v5 boxes 10 to 12), under the same divider as
// Opportunities. The records Grant read, for a member who wants to check a claim or
// needs the specifics to price. The Timeline sits first under the divider. Each card
// adds something the boxes above do not say:
//   · The last bid request — the details left out above, and its documents.
//   · What the record says (local records) — the buyer's own words, quoted.
//   · Documents in the record — each file held for the forecast, by name and size,
//     read from `documents`. Its download link expires, so it is listed, not linked.
//   · Sources — the one list of what Grant read, with the day the record was last
//     read (none is printed when that day is not stored), and a
//     direct link to the bid request and the award notice where they exist. The
//     forecast's own link is in Forecast source, above Get ready. The page never links
//     to HigherGov.

import { ExternalLink, FileText, Link2 } from "lucide-react";
import { SourceCard } from "./ForecastDetailParts";
import { ForecastTimeline } from "./ForecastTimeline";
import { FORECASTS_TODAY, longDate, type ScoredForecast } from "../../lib/forecasts/engine";
import type { EvidenceRead, ForecastRead } from "../../lib/forecasts/grant";
import { EVIDENCE } from "../../lib/forecasts/grantCopy";

/** "1.7 MB" or "141 KB". */
function fileSize(bytes: number): string {
  const mb = bytes / 1_048_576;
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function LastBid({ b }: { b: NonNullable<EvidenceRead["lastBid"]> }) {
  return (
    <section className="ui-card fc-ev" aria-labelledby="fc-ev-lastbid">
      <h3 id="fc-ev-lastbid" className="fc-ev__title">
        <FileText size={15} aria-hidden /> {EVIDENCE.lastBid}
      </h3>
      {b.work && <p className="fc-ev__line">{b.work}</p>}
      <ul className="fc-ev__docs">
        {b.documents.map((d) => (
          <li key={d.label}>
            <a className="fc-textlink" href={d.href} target="_blank" rel="noreferrer">
              {d.label} <ExternalLink size={13} aria-hidden />
            </a>
          </li>
        ))}
      </ul>
      <span className="fc-ev__term">{b.number}</span>
    </section>
  );
}

export function ForecastEvidence({ f, read }: { f: ScoredForecast; read: ForecastRead }) {
  const e = read.evidence;
  // The record's own words earn a card only when there are words to show: its text, a
  // quote, or a public meeting that is still ahead.
  const doc = f.document;
  const r = f.record;
  const recordText = !!r.hgText && r.hgText !== r.hgTitle;
  const showSource =
    recordText ||
    (!!doc && (doc.quotes.length > 0 || (!!doc.upcoming && doc.upcoming.on >= FORECASTS_TODAY)));
  const cards = [
    e.lastBid && <LastBid key="lastbid" b={e.lastBid} />,
    showSource && <SourceCard key="source" f={f} />,
  ].filter(Boolean);
  const sources = e.sources.join(" · ");
  // The files the live record holds. None are listed until the record has been read.
  const files = r.files ?? [];
  // Direct links only: the bid request and the award notice.
  const links = [
    ...(e.lastBid?.documents ?? []).map((d) => ({ label: EVIDENCE.link.bid, href: d.href })),
    f.priorAward?.noticeUrl
      ? { label: EVIDENCE.link.contract, href: f.priorAward.noticeUrl }
      : null,
  ].filter(
    (l, i, all): l is { label: string; href: string } =>
      !!l && all.findIndex((x) => x?.href === l.href) === i,
  );
  return (
    <section className="fc-evidence" aria-label={EVIDENCE.divider}>
      <div className="evidence-divider">
        <span className="evidence-divider__line" />
        <span className="evidence-divider__label">{EVIDENCE.divider}</span>
        <span className="evidence-divider__line" />
      </div>

      <ForecastTimeline marks={read.timeline} />

      {cards.length > 0 && (
        <div className={`fc-ev__grid${cards.length === 1 ? " is-single" : ""}`}>{cards}</div>
      )}

      {files.length > 0 && (
        <section className="fc-docs" aria-labelledby="fc-docs-title">
          <h3 id="fc-docs-title" className="fc-ev__title">
            <FileText size={15} aria-hidden /> {EVIDENCE.documents}
          </h3>
          {f.record.sourceLink?.opens === "meetings" && (
            <p className="fc-ev__note">{EVIDENCE.documentsNote}</p>
          )}
          <ul className="ref-doc-list" role="list">
            {files.map((file) => (
              <li key={file.fileName} className="ref-doc">
                <FileText size={14} aria-hidden />
                <span className="ref-doc__name" title={file.fileName}>
                  {file.fileName}
                </span>
                {file.sizeBytes != null && (
                  <span className="ref-doc__size">{fileSize(file.sizeBytes)}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="fc-sources">
        <Link2 size={15} aria-hidden />
        <b>{EVIDENCE.sources}</b>
        <span className="fc-sources__meta">
          {sources.charAt(0).toUpperCase() + sources.slice(1)}
          {r.checkedOn && (
            <span className="fc-sources__checked">
              {EVIDENCE.lastChecked(longDate(r.checkedOn))}
            </span>
          )}
        </span>
        {links.length > 0 && (
          <span className="fc-sources__links">
            {links.map((l) => (
              <a
                key={l.href}
                className="fc-textlink"
                href={l.href}
                target="_blank"
                rel="noreferrer"
              >
                {l.label} <ExternalLink size={13} aria-hidden />
              </a>
            ))}
          </span>
        )}
      </div>
    </section>
  );
}
