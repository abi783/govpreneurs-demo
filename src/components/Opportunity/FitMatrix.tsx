import { AlertTriangle, Check, X } from "lucide-react";
import type { FitRow, FitMarker } from "../../lib/mock/grantAnalysis";

function MarkerIcon({ marker }: { marker: FitMarker }) {
  if (marker === "ok") return <Check size={14} aria-label="Good" />;
  if (marker === "warn") return <AlertTriangle size={14} aria-label="Warning" />;
  return <X size={14} aria-label="Problem" />;
}

export function FitMatrix({
  rows,
  onCiteClick,
}: {
  rows: FitRow[];
  onCiteClick: (anchor: string) => void;
}) {
  return (
    <ul className="fit-matrix" role="list">
      {rows.map((r) => (
        <li key={r.dimension} className={`fit-row fit-row--${r.marker}`}>
          <span className={`fit-marker fit-marker--${r.marker}`} aria-hidden>
            <MarkerIcon marker={r.marker} />
          </span>
          <div className="fit-row__body">
            <div className="fit-row__dimension">{r.dimension}</div>
            <div className="fit-row__line">
              {r.line}{" "}
              {r.citation && (
                <button
                  type="button"
                  className="cite-chip"
                  onClick={() => onCiteClick(r.citation!.anchor)}
                  title={`Jump to ${r.citation.label}`}
                >
                  {r.citation.label}
                </button>
              )}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
