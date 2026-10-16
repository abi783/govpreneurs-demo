// Artifact ⑥b — the Compliance Matrix. One atomic row per eligibility/submission
// requirement, blocking rows first, each backed by its source clause (tap the pin
// for the verbatim text). Rendered from the SAME resolved matrix that drives the
// Gate Strip, so the two can never disagree.
//
// Status reuses the gate lights' tone+glyph pairing (have→ok, missing→blocked,
// confirm/unknown→confirm) so the visual language stays learnable across the card.
import { ChevronRight } from "lucide-react";
import type { ComplianceRow, Tone } from "../../lib/grant/types";
import { EvidencePin, RichText, ToneGlyph } from "./primitives";
import { lineText } from "../../lib/grant/richText";

const STATUS: Record<ComplianceRow["status"], { tone: Tone; glyph: string }> = {
  have: { tone: "ok", glyph: "check" },
  missing: { tone: "blocked", glyph: "x" },
  confirm: { tone: "confirm", glyph: "help" },
  unknown: { tone: "confirm", glyph: "help" },
};

// Blocking first: unclosable block → closable block → confirm/unknown → done.
function rank(r: ComplianceRow): number {
  if (r.status === "missing") return r.closableInWindow === false ? 0 : 1;
  if (r.status === "confirm" || r.status === "unknown") return 2;
  return 3;
}

// The glyph already signals "done", so drop a redundant trailing check in the value.
function cleanFirm(v: string): string {
  return v.replace(/\s*✓\s*$/, "").trim();
}

export function ComplianceMatrix({
  rows,
  noticeId,
  sourcePath,
}: {
  rows: ComplianceRow[];
  noticeId?: string;
  sourcePath?: string | null;
}) {
  if (rows.length === 0) return null;
  const sorted = [...rows].sort((a, b) => rank(a) - rank(b));
  const blocking = rows.filter((r) => r.status === "missing").length;
  const toConfirm = rows.filter((r) => r.status === "confirm" || r.status === "unknown").length;

  const flag =
    blocking > 0
      ? { word: blocking === 1 ? "1 blocking" : `${blocking} blocking`, tone: "blocked" as Tone }
      : toConfirm > 0
        ? {
            word: toConfirm === 1 ? "1 to confirm" : `${toConfirm} to confirm`,
            tone: "confirm" as Tone,
          }
        : { word: "all clear", tone: "ok" as Tone };

  return (
    <details className="grant-matrix">
      <summary className="grant-matrix__summary">
        <ChevronRight size={15} strokeWidth={2} className="grant-matrix__chev" aria-hidden />
        <span className="grant-matrix__title">Compliance checklist</span>
        <span className="grant-matrix__count">
          <span className="mono">{rows.length}</span> requirements ·{" "}
          <span className={`grant-matrix__flag grant-matrix__flag--${flag.tone}`}>{flag.word}</span>
        </span>
      </summary>
      <ul className="grant-matrix__list">
        {sorted.map((row, i) => {
          const s = STATUS[row.status];
          const firm = cleanFirm(row.firmValue);
          return (
            <li key={i} className={`grant-matrix__row grant-matrix__row--${s.tone}`}>
              <ToneGlyph glyph={s.glyph} tone={s.tone} size={15} />
              <div className="grant-matrix__main">
                <span className="grant-matrix__req">
                  <RichText line={row.requirement} />
                  <EvidencePin
                    pin={row.sourceClause}
                    claim={`${lineText(row.requirement)} — needs ${row.requiredValue}.`}
                    noticeId={noticeId}
                    sourcePath={sourcePath}
                  />
                </span>
                <span className="grant-matrix__vals">
                  <span className="grant-matrix__need">needs {row.requiredValue}</span>
                  <span className="grant-matrix__you">{firm || "—"}</span>
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
