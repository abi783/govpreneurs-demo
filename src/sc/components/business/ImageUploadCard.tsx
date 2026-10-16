"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { UPLOAD_FAILED_PORTAL } from "@sc/lib/storage/uploadMessages";
import { CONTROL_BUTTON_GHOST } from "./controlStyles";

/**
 * A small image field — profile picture or business logo. Presentation only:
 * the caller supplies `upload`, so the same card serves the member Business
 * page (POST /api/portal/{loc}/upload) and the public intake form
 * (POST /api/intake/upload). Both ultimately land on the same storage the
 * portal home's contact/company cards read, which is what keeps every
 * surface in sync without any copy step.
 */
export function ImageUploadCard({ label, helper, currentUrl, round, upload }: {
  label: string;
  helper: string;
  currentUrl: string | null;
  /** Round preview for the person, square for the logo. */
  round?: boolean;
  upload: (file: File) => Promise<{ url: string } | { error: string }>;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(currentUrl);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  // DEMO: the button says "Choose a file…" while the file box is open, so the click is
  // visible on screen. It clears when a file is chosen, when the box is cancelled, or
  // when the window gets focus back.
  const [picking, setPicking] = useState(false);

  const pick = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true); setErr(null);
    try {
      const res = await upload(f);
      if ("url" in res) setUrl(res.url);
      else setErr(res.error);
    } catch (e) {
      // A throw here is the request itself failing — she is offline, or the
      // route 500'd before it could answer. Its message is for the console, not
      // for her: "Failed to fetch" tells her nothing she can do.
      console.error("[upload] request failed:", e);
      setErr(UPLOAD_FAILED_PORTAL);
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  };

  const shape = round ? " gpds-imgcard__preview--round" : "";

  return (
    <div className="gpds-imgcard">
      <span className={`gpds-imgcard__preview${shape}`}>
        {url
          ? <Image src={url} alt={label} width={56} height={56} unoptimized />
          : <PlaceholderGlyph round={round} />}
      </span>
      <span className="gpds-imgcard__text">
        <span className="gpds-imgcard__label">{label}</span>
        <span className="gpds-imgcard__helper">{helper}</span>
        {/* No "Could not upload:" prefix — the message is already a sentence,
            and the doubled preamble made the card read like a stack trace. */}
        {err && <span className="gpds-imgcard__err">{err}</span>}
      </span>
      <input ref={ref} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden"
        onChange={(e) => { setPicking(false); void pick(e.target.files?.[0]); }} />
      <button onClick={() => {
        setPicking(true);
        window.addEventListener("focus", () => setTimeout(() => setPicking(false), 400), { once: true });
        ref.current?.click();
      }} disabled={busy}
        className={`${CONTROL_BUTTON_GHOST} flex-shrink-0`}>
        {busy ? "Uploading…" : picking ? "Choose a file…" : url ? "Replace" : "Upload"}
      </button>
    </div>
  );
}

/** The stand-in for an image not uploaded yet: a person for a portrait, a
 *  building for a logo. Inline SVG rather than an emoji — both surfaces that
 *  render this card are Design System pages, and the system does not use
 *  emoji. */
function PlaceholderGlyph({ round }: { round?: boolean }) {
  const path = round
    ? "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4.5 20a7.5 7.5 0 0 1 15 0"
    : "M3 21h18M5 21V5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v16M14 10h4a1 1 0 0 1 1 1v10M8 8h3M8 12h3M8 16h3";
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      focusable="false"
      className="gpds-imgcard__glyph"
    >
      <path
        d={path}
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
