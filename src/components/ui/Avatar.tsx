import { useState, forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type AgentId = "hunter" | "grant" | "ava";
export type AvatarSize = 20 | 24 | 28 | 32 | 40 | 48;

// Avatar art lives in public/agents/ (recovered from the Lovable asset store —
// the *.png.asset.json pointers only resolve inside Lovable's hosting).
// Prefix with BASE_URL so paths resolve under the app's base path ("/v2/ui").
// Vite may inject BASE_URL without a trailing slash — normalize to add one.
const B = import.meta.env.BASE_URL.replace(/\/?$/, "/");
const AGENT_META: Record<AgentId, { url: string; name: string; role: string; letter: string }> = {
  hunter: { url: `${B}agents/hunter.png`, name: "Hunter", role: "discovery agent", letter: "H" },
  grant: { url: `${B}agents/grant.png`, name: "Grant", role: "bid analyst", letter: "G" },
  ava: { url: `${B}agents/ava.png`, name: "Ava", role: "drafting agent", letter: "A" },
};

interface CommonProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  size?: AvatarSize;
  className?: string;
}

type AgentAvatarProps = CommonProps & {
  kind: "agent";
  agent: AgentId;
};

type HumanAvatarProps = CommonProps & {
  kind: "human";
  /** Full name; used for initials fallback and aria-label. */
  name: string;
  src?: string;
};

export type AvatarProps = AgentAvatarProps | HumanAvatarProps;

function initialsFor(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("");
}

export const Avatar = forwardRef<HTMLSpanElement, AvatarProps>(function Avatar(props, ref) {
  const { size = 32, className, kind, ...rest } = props as CommonProps & { kind: AvatarProps["kind"] };
  const [failed, setFailed] = useState(false);

  if (kind === "agent") {
    const { agent } = props as AgentAvatarProps;
    const m = AGENT_META[agent];
    return (
      <span
        ref={ref}
        className={cn(
          "agent-avatar",
          `agent-avatar--${agent}`,
          `agent-avatar--${size}`,
          className,
        )}
        role="img"
        aria-label={`${m.name}, your ${m.role}`}
        {...rest}
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

  const { name, src } = props as HumanAvatarProps;
  const initials = initialsFor(name);
  return (
    <span
      ref={ref}
      className={cn("ui-avatar", `ui-avatar--${size}`, className)}
      role="img"
      aria-label={name}
      {...rest}
    >
      {src && !failed ? (
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="ui-avatar__initials">{initials}</span>
      )}
    </span>
  );
});
