import { useState } from "react";

export type AgentId = "hunter" | "grant" | "ava";

// Avatar art lives in public/agents/ (recovered from the Lovable asset store —
// the *.png.asset.json pointers only resolve inside Lovable's hosting).
// Prefix with BASE_URL so paths resolve under the app's base path ("/v2/ui").
// Vite may inject BASE_URL without a trailing slash — normalize to add one.
const B = import.meta.env.BASE_URL.replace(/\/?$/, "/");
const META: Record<AgentId, { url: string; name: string; role: string; letter: string }> = {
  hunter: { url: `${B}agents/hunter.png`, name: "Hunter", role: "discovery agent", letter: "H" },
  grant:  { url: `${B}agents/grant.png`,  name: "Grant",  role: "bid analyst",     letter: "G" },
  ava:    { url: `${B}agents/ava.png`,    name: "Ava",    role: "drafting agent",  letter: "A" },
};

export function AgentAvatar({
  agent,
  size = 32,
  className = "",
}: {
  agent: AgentId;
  size?: 20 | 24 | 28 | 32 | 40 | 48 | 96;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const m = META[agent];
  return (
    <span
      className={`agent-avatar agent-avatar--${agent} agent-avatar--${size} ${className}`.trim()}
      aria-hidden={false}
      role="img"
      aria-label={`${m.name}, your ${m.role}`}
    >
      {failed ? (
        <span className="agent-avatar__letter">{m.letter}</span>
      ) : (
        <img
          src={m.url}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}
