"use client";

// Roadmap v3 — avatar primitives, merged port of the prototype's ui/Avatar
// and Companion/AgentAvatar. Agent art ships at /ds-assets/agents/.

import { useState } from "react";

export type AvatarSize = 20 | 24 | 28 | 32 | 40 | 48;

function initialsFor(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("");
}

export function Avatar({
  name,
  src,
  size = 32,
}: {
  name: string;
  src?: string | null;
  size?: AvatarSize;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <span className={`ui-avatar ui-avatar--${size}`} role="img" aria-label={name}>
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} />
      ) : (
        <span className="ui-avatar__initials">{initialsFor(name)}</span>
      )}
    </span>
  );
}

/**
 * An agent's avatar. Each has its own accent already defined in
 * roadmap-v3.css (`--ai-7` for Hunter, `--blue-7` for Grant, `--ava-7` for
 * Ava); art ships at /ds-assets/agents/<key>.png and only Hunter's exists so
 * far, so the others fall through to the letter glyph — which is the same path
 * a failed image load takes, not a special case.
 */
export function AgentAvatar({
  agent = "hunter",
  name,
  size = 32,
}: {
  agent?: string;
  /** Display name, so an admin-renamed agent is announced as renamed. */
  name?: string;
  size?: AvatarSize;
}) {
  const [failed, setFailed] = useState(false);
  const label = name?.trim() || agent;
  return (
    <span
      className={`agent-avatar agent-avatar--${agent} agent-avatar--${size}`}
      role="img"
      aria-label={`${label}, an AI agent`}
    >
      {failed ? (
        <span className="agent-avatar__letter">{label[0]?.toUpperCase() ?? "A"}</span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/ds-assets/agents/${agent}.png`}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}
