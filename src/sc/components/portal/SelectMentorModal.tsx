"use client";

import { useEffect, useState } from "react";

interface MentorRow {
  id: string;
  name: string;
  title: string | null;
  avatarUrl: string | null;
  bio: string | null;
  consultationPrice: string | null;
  consultationDescription: string | null;
}

interface Props {
  locationId: string;
  onClose: () => void;
  onAssigned?: () => void;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

function formatPrice(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // Admin-configured strings usually already include the "$" — surface as-is.
  return trimmed.startsWith("$") ? trimmed : `$${trimmed}`;
}

/**
 * Customer-facing mentor picker. Shown when the "Your Mentor" card has no
 * assigned mentor. Fetches every active mentor and lets the customer pick
 * one — POSTs `/assign-mentor` and closes on success.
 *
 * First pick is locked-in server-side (409 on a second attempt) so this
 * modal doesn't need to support "change mentor" — parent renders the
 * assigned card once populated.
 */
export function SelectMentorModal({ locationId, onClose, onAssigned }: Props) {
  const [mentors, setMentors] = useState<MentorRow[] | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [submitErr, setSubmitErr] = useState<Record<string, string | null>>({});

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/portal/${locationId}/mentors`, { cache: "no-store" });
        if (!res.ok) {
          if (!cancelled) setLoadErr(`Couldn't load mentors (HTTP ${res.status}).`);
          return;
        }
        const data = (await res.json()) as { mentors?: MentorRow[] };
        if (!cancelled) setMentors(data.mentors ?? []);
      } catch (err) {
        if (!cancelled) setLoadErr(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => { cancelled = true; };
  }, [locationId]);

  async function selectMentor(mentorId: string) {
    setSubmittingId(mentorId);
    setSubmitErr((m) => ({ ...m, [mentorId]: null }));
    try {
      const res = await fetch(`/api/portal/${locationId}/assign-mentor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mentorId }),
      });
      const data = await res.json().catch(() => ({} as { error?: string }));
      if (!res.ok) {
        setSubmitErr((m) => ({ ...m, [mentorId]: data?.error ?? `HTTP ${res.status}` }));
        return;
      }
      onAssigned?.();
      onClose();
    } catch (err) {
      setSubmitErr((m) => ({ ...m, [mentorId]: err instanceof Error ? err.message : String(err) }));
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: "rgba(15, 23, 42, 0.55)", backdropFilter: "blur(6px)" }}
      onClick={() => submittingId === null && onClose()}
    >
      <div
        className="w-full max-w-2xl rounded-2xl flex flex-col overflow-hidden"
        style={{
          maxHeight: "88vh",
          background: "#ffffff",
          boxShadow: "0 24px 60px rgba(15, 23, 42, 0.30)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
          <div>
            <p className="text-[0.62rem] font-bold uppercase tracking-wide" style={{ color: "#1d4ed8" }}>Your Mentor</p>
            <p className="text-base font-bold text-gray-900 mt-0.5">Choose your mentor</p>
            <p className="text-[0.72rem] text-gray-500 mt-1">
              Pick a mentor to unlock 1-on-1 guidance. You can start booking calls with them right away.
            </p>
          </div>
          <button
            onClick={() => submittingId === null && onClose()}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0"
            disabled={submittingId !== null}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5" style={{ background: "#f9fafb" }}>
          {loadErr && (
            <p className="text-[0.78rem] font-semibold text-red-600">{loadErr}</p>
          )}
          {!loadErr && mentors === null && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl animate-pulse"
                  style={{ background: "#ffffff", border: "1px solid #e5e7eb", minHeight: 148 }}
                />
              ))}
            </div>
          )}
          {mentors && mentors.length === 0 && (
            <p className="text-[0.82rem] text-gray-500 text-center py-8">
              No mentors available right now. Please check back soon.
            </p>
          )}
          {mentors && mentors.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {mentors.map((m) => {
                const price = formatPrice(m.consultationPrice);
                const busy = submittingId === m.id;
                const disabled = submittingId !== null && !busy;
                const err = submitErr[m.id] ?? null;
                return (
                  <div
                    key={m.id}
                    className="p-4 rounded-xl flex flex-col gap-3"
                    style={{ background: "#ffffff", border: "1px solid #e5e7eb", boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}
                  >
                    <div className="flex items-start gap-3">
                      {m.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={m.avatarUrl}
                          alt=""
                          className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                          style={{ background: "#f3f4f6" }}
                        />
                      ) : (
                        <div
                          className="w-14 h-14 rounded-full flex items-center justify-center text-[0.9rem] font-bold flex-shrink-0"
                          style={{ background: "#dbeafe", color: "#1d4ed8", border: "1px solid #bfdbfe" }}
                        >
                          {initials(m.name)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[0.9rem] font-bold text-gray-900 leading-tight truncate">{m.name}</p>
                        {m.title && (
                          <p className="text-[0.72rem] text-gray-500 mt-0.5 truncate">{m.title}</p>
                        )}
                        {price && (
                          <p className="text-[0.72rem] font-semibold mt-1.5" style={{ color: "#1d4ed8" }}>
                            From {price} per session
                          </p>
                        )}
                      </div>
                    </div>
                    {m.bio && (
                      <p
                        className="text-[0.72rem] text-gray-600 leading-snug"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {m.bio}
                      </p>
                    )}
                    {err && (
                      <p className="text-[0.68rem] font-semibold text-red-600">{err}</p>
                    )}
                    <button
                      onClick={() => selectMentor(m.id)}
                      disabled={busy || disabled}
                      className="w-full mt-auto px-3 py-2 text-[0.78rem] font-bold transition-colors disabled:opacity-60"
                      style={{ borderRadius: 8, background: "#1d4ed8", color: "#fff" }}
                    >
                      {busy ? "Selecting…" : "Select this mentor"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
