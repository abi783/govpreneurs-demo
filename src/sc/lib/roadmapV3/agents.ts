// Roadmap v3 — the AI agents a sub-step can declare.
//
// A sub-step lists the agents involved in it; the member page renders a card
// per agent. Before this existed the only card was Hunter's, hardcoded to the
// `pursuit` card type, so it could not be attached anywhere else and Ava and
// Grant could not appear at all.
//
// Copy lives here as DEFAULTS, not as the truth: an admin overrides any field
// per sub-step in /admin/roadmapv3. A blank override falls back here rather
// than rendering an empty line, so clearing a box in the admin UI restores the
// default instead of breaking the card.

export const AGENT_KEYS = ["hunter", "ava", "grant"] as const;
export type AgentKey = (typeof AGENT_KEYS)[number];

export type V3AgentCard = {
  key: AgentKey;
  name: string;
  tagline: string;
  body: string;
  /** Rendered only when ctaUrl is set — a button that goes nowhere is worse
   *  than no button (the same rule the DFY panel follows). */
  ctaLabel: string;
  ctaUrl: string | null;
};

type AgentDefault = Omit<V3AgentCard, "key" | "ctaUrl">;

/**
 * Hunter's copy is the live wording from RoadmapV3Client, verbatim, so steps
 * that already show his card do not change when they move onto this path.
 *
 * Ava's and Grant's are STARTER copy — written here to make the checkbox
 * useful on day one, and expected to be corrected in the admin by someone who
 * knows what they actually do.
 */
export const AGENT_DEFAULTS: Record<AgentKey, AgentDefault> = {
  hunter: {
    name: "Hunter",
    tagline: "Finds the work. Explains why it fits.",
    body:
      "Hunter reads every new federal and state notice each morning. The jobs that fit your business go to the top, with a reason.",
    ctaLabel: "See what Hunter found",
  },
  ava: {
    name: "Ava",
    tagline: "Keeps your profile ready to be found.",
    body:
      "Ava watches the details buyers check before they call — your codes, your registrations, your capability statement — and tells you what to fix before it costs you a bid.",
    ctaLabel: "See what Ava suggests",
  },
  grant: {
    name: "Grant",
    tagline: "Turns an opportunity into a submission.",
    body:
      "Grant breaks a solicitation into what it actually asks for, drafts the parts you have answered before, and flags the clauses that decide whether you are compliant.",
    ctaLabel: "Work on a submission",
  },
};

const MAX_LEN = 600;

/** Trim, cap, and treat blank as absent so a cleared admin field falls back. */
function text(v: unknown, fallback: string): string {
  if (typeof v !== "string") return fallback;
  const t = v.trim();
  return t ? t.slice(0, MAX_LEN) : fallback;
}

function url(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t.slice(0, MAX_LEN) : null;
}

function isAgentKey(v: unknown): v is AgentKey {
  return typeof v === "string" && (AGENT_KEYS as readonly string[]).includes(v);
}

/**
 * Stored JSON → the cards to render.
 *
 * Order is the admin's, preserved. Unknown keys are dropped rather than
 * guessed at, and a repeated key appears once — a member seeing the same agent
 * twice reads as a bug whichever way it happened.
 */
export function parseAgents(raw: unknown): V3AgentCard[] {
  if (!Array.isArray(raw)) return [];
  const out: V3AgentCard[] = [];
  const seen = new Set<AgentKey>();

  for (const entry of raw) {
    // A bare "hunter" string is accepted as well as {key: "hunter", ...}: the
    // checkbox writes the object form, but the shorthand is the obvious thing
    // to hand-write when seeding a row.
    const key = isAgentKey(entry)
      ? entry
      : entry && typeof entry === "object" && isAgentKey((entry as Record<string, unknown>).key)
        ? ((entry as Record<string, unknown>).key as AgentKey)
        : null;
    if (!key || seen.has(key)) continue;
    seen.add(key);

    const o = (typeof entry === "object" && entry ? entry : {}) as Record<string, unknown>;
    const d = AGENT_DEFAULTS[key];
    out.push({
      key,
      name: text(o.name, d.name),
      tagline: text(o.tagline, d.tagline),
      body: text(o.body, d.body),
      ctaLabel: text(o.ctaLabel, d.ctaLabel),
      ctaUrl: url(o.ctaUrl),
    });
  }
  return out;
}
