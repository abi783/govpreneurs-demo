/**
 * The task ledger's icon set.
 *
 * The DS specifies inline stroke SVG on a 24×24 viewBox at stroke-width 1.75,
 * inheriting `currentColor` — no icon font, no sprite, no emoji (the page used
 * ▤ ◉ ◈ ★ ⚙ ✓ ✕ ◔ ⚑ ⌕ ▶ ··· before 2026-08-13). Shapes follow Lucide, which
 * the DS names as its closest reference.
 */

type Props = { className?: string };

const S = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function CheckIcon({ className }: Props) {
  return <svg {...S} className={className}><path d="M20 6 9 17l-5-5" /></svg>;
}

export function XIcon({ className }: Props) {
  return <svg {...S} className={className}><path d="M18 6 6 18M6 6l12 12" /></svg>;
}

/** Auto-ticked: we are watching for the signal, the member never asserts it. */
export function WatchingIcon({ className }: Props) {
  return <svg {...S} className={className}><circle cx="12" cy="12" r="3.25" fill="currentColor" stroke="none" /></svg>;
}

export function FlagIcon({ className }: Props) {
  return (
    <svg {...S} className={className}>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V4s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <path d="M4 22v-7" />
    </svg>
  );
}

export function SearchIcon({ className }: Props) {
  return (
    <svg {...S} className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

/** Section open/closed. Points down when open; CSS rotates it when closed. */
export function ChevronIcon({ className }: Props) {
  return <svg {...S} className={className}><path d="m6 9 6 6 6-6" /></svg>;
}

export function MoreIcon({ className }: Props) {
  return (
    <svg {...S} className={className}>
      <circle cx="5" cy="12" r="1.1" fill="currentColor" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" />
      <circle cx="19" cy="12" r="1.1" fill="currentColor" />
    </svg>
  );
}

export function PlayIcon({ className }: Props) {
  return (
    <svg {...S} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M10 8.5v7l6-3.5z" />
    </svg>
  );
}

/** AI mark — the amber lane's glyph, used only where a model wrote the text. */
export function SparkIcon({ className }: Props) {
  return (
    <svg {...S} className={className}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
      <path d="M12 8.5a3.5 3.5 0 0 0 3.5 3.5A3.5 3.5 0 0 0 12 15.5 3.5 3.5 0 0 0 8.5 12 3.5 3.5 0 0 0 12 8.5z" />
    </svg>
  );
}

/* ── Source glyphs ─────────────────────────────────────────────────────── */

export function RouteIcon({ className }: Props) {
  return (
    <svg {...S} className={className}>
      <circle cx="6" cy="19" r="2.5" />
      <circle cx="18" cy="5" r="2.5" />
      <path d="M8.5 19H15a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h6.5" />
    </svg>
  );
}

export function MicIcon({ className }: Props) {
  return (
    <svg {...S} className={className}>
      <rect x="9" y="2.5" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
    </svg>
  );
}

export function ClipboardIcon({ className }: Props) {
  return (
    <svg {...S} className={className}>
      <rect x="4.5" y="4" width="15" height="17" rx="2.5" />
      <path d="M9 4V3h6v1M8.5 11h7M8.5 15.5h4.5" />
    </svg>
  );
}

export function FlagStartIcon({ className }: Props) {
  return (
    <svg {...S} className={className}>
      <path d="M5 21V4h9l-1.5 3.5L14 11H5" />
    </svg>
  );
}

export function UserIcon({ className }: Props) {
  return (
    <svg {...S} className={className}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}

export function PaperclipIcon({ className }: Props) {
  return (
    <svg {...S} className={className}>
      <path d="M20 11.5 12 19.5a4.5 4.5 0 0 1-6.4-6.4l8.2-8.2a3 3 0 0 1 4.3 4.3l-8.2 8.2a1.5 1.5 0 0 1-2.1-2.1l7.5-7.5" />
    </svg>
  );
}

export function LinkIcon({ className }: Props) {
  return (
    <svg {...S} className={className}>
      <path d="M10 13a3.5 3.5 0 0 0 5 0l3-3a3.5 3.5 0 0 0-5-5l-1.5 1.5" />
      <path d="M14 11a3.5 3.5 0 0 0-5 0l-3 3a3.5 3.5 0 0 0 5 5l1.5-1.5" />
    </svg>
  );
}

export function CogIcon({ className }: Props) {
  return (
    <svg {...S} className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.5v2.2M12 19.3v2.2M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" />
    </svg>
  );
}
