"use client";

import type { ApiProvenance } from "./types";

/** The proof viewer (PRD prototype SourceSheet): one shell, four bodies in
 *  v1 — document excerpt, member record, conversation, unavailable. The
 *  sheet is a closed room: no external links. */
export function SourceSheet({ provenance, claim, onClose }: {
  provenance: ApiProvenance;
  claim: string;
  onClose: () => void;
}) {
  const p = provenance;
  const label = p.sourceLabel ?? (p.type === "profile" ? "Your record" : p.type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.45)" }} onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200">
          <p className="text-sm font-bold text-gray-900">Source · {label}</p>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
        </div>

        <div className="px-5 py-4 space-y-3">
          <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2.5">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-0.5">What you tapped</p>
            <p className="text-sm text-gray-900">{claim || "—"}</p>
          </div>

          {p.locator && <p className="font-mono text-[11px] text-gray-500">{p.locator}</p>}

          {p.unavailable ? (
            <div className="text-sm text-gray-700">
              <p className="font-semibold">That source is not on file.</p>
              {p.unavailable.reason && <p className="text-gray-600 mt-1">{p.unavailable.reason}</p>}
            </div>
          ) : p.conversation?.turns?.length ? (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {p.conversation.turns.map((t) => (
                <div key={t.id} className={`rounded-lg px-3 py-2 text-sm ${t.id === p.conversation!.cited_turn_id ? "bg-amber-50 border border-amber-200" : "bg-gray-50"}`}>
                  <p className="font-mono text-[10.5px] text-gray-500 mb-0.5">{t.speaker}{t.at ? ` · ${t.at}` : ""}</p>
                  <p className="text-gray-900">{t.text}</p>
                </div>
              ))}
            </div>
          ) : p.excerpt ? (
            <p className="text-sm leading-relaxed">
              {p.excerpt.before && <span className="text-gray-400">…{p.excerpt.before} </span>}
              <mark className="bg-amber-100 px-0.5 rounded">{p.excerpt.span}</mark>
              {p.excerpt.after && <span className="text-gray-400"> {p.excerpt.after}…</span>}
            </p>
          ) : p.quote ? (
            <p className="text-sm text-gray-900">
              <mark className="bg-amber-100 px-0.5 rounded">{p.quote}</mark>
              <span className="block font-mono text-[10.5px] text-gray-500 mt-1">Shown without surrounding context.</span>
            </p>
          ) : (
            <p className="text-sm text-gray-600">
              This value came from {label.toLowerCase()}. There is no excerpt to show — the record itself backs it.
            </p>
          )}
        </div>

        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50">
          <p className="font-mono text-[11px] text-gray-500">
            {label}
            {p.retrievedAt ? ` · ${p.retrievedAt}` : ""}
          </p>
        </div>
      </div>
    </div>
  );
}
