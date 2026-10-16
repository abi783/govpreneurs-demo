import type { Pin } from "./types";
import { apiFetch, API_BASE_URL } from "../api";

/** The rail conversation reply (Phase 7). Mirrors the backend GrantRailReply. */
export interface RailReply {
  kind:
    | "interrogate"
    | "supply"
    | "draft_request"
    | "offscope"
    | "unavailable"
    | "pending";
  reply: string;
  fact?: { label: string; value: string } | null;
  /** The pins Grant's brief was built from that the reply actually cited —
   *  rendered under the reply so a chatbox answer is as checkable as a canvas
   *  claim. Labelled "what Grant read", never as proof of a particular
   *  sentence. */
  sources?: Pin[];
  /** A platform action to offer under this reply. `mentor` rides on a
   *  draft_request turn: the copy points at a mentor call, and a message can't
   *  carry a link, so the action travels as data and renders as a button. */
  cta?: "mentor";
}

/** Hard deadline for one rail turn. Generous — a retrieval + LLM turn can run
 *  tens of seconds — but finite, so the composer always unlocks. */
const RAIL_TIMEOUT_MS = 60_000;

/** Mirrors the backend DTO's @MaxLength on `message` (grants-take.dto.ts). */
export const MAX_RAIL_MESSAGE = 2000;

const KINDS = new Set<RailReply["kind"]>([
  "interrogate",
  "supply",
  "draft_request",
  "offscope",
  "unavailable",
  "pending",
]);

const UNAVAILABLE: RailReply = {
  kind: "unavailable",
  reply: "Grant is unavailable right now — try again in a moment.",
};

/** One stored turn of the conversation. Mirrors the backend RailSessionMessage. */
export interface RailSessionMessage {
  role: "user" | "grant";
  text: string;
  at: string;
}

/** The saved conversation for one member and one opportunity. */
export interface RailSession {
  messages: RailSessionMessage[];
  /** questionId → times skipped, so a skip survives a regen and a new visit. */
  skipped: Record<string, number>;
}

const EMPTY_SESSION: RailSession = { messages: [], skipped: {} };

/**
 * Loads the saved conversation for this opportunity so the rail reopens where the
 * member left it — a refresh, or a visit days later. Failure-tolerant: any error
 * yields an empty session, so a store or network problem opens a fresh thread
 * rather than blocking the rail.
 */
export async function fetchRailSession(oppKey: string): Promise<RailSession> {
  try {
    const res = await apiFetch(`${API_BASE_URL}/grants-take/rail/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oppKey }),
    });
    if (!res.ok) return EMPTY_SESSION;
    const body = (await res.json()) as Partial<RailSession> | null;
    if (!body || !Array.isArray(body.messages)) return EMPTY_SESSION;
    return {
      messages: body.messages.filter(
        (m): m is RailSessionMessage =>
          !!m && typeof m.text === "string" && (m.role === "user" || m.role === "grant"),
      ),
      skipped: body.skipped && typeof body.skipped === "object" ? body.skipped : {},
    };
  } catch {
    return EMPTY_SESSION;
  }
}

/** Records a skipped open question. Fire-and-forget: the UI already advanced, and
 *  a failed write only means the question may resurface later. */
/**
 * Start over — wipe this opportunity's stored conversation and its skips.
 *
 * Returns whether the server confirmed it. Unlike a skip, this one is NOT
 * fire-and-forget: the member is about to watch their thread disappear, and
 * clearing it locally while the server keeps it means the old conversation
 * reappears on the next visit. Better to tell them it failed than to fake it.
 */
export async function resetRailSession(oppKey: string): Promise<boolean> {
  try {
    const res = await apiFetch(`${API_BASE_URL}/grants-take/rail/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oppKey }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function recordRailSkip(
  oppKey: string,
  questionId: string,
): Promise<void> {
  try {
    await apiFetch(`${API_BASE_URL}/grants-take/rail/skip`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oppKey, questionId }),
    });
  } catch {
    // best-effort — never block the member on it.
  }
}

/**
 * Sends one rail turn to POST /grants-take/rail — Grant answers ABOUT this
 * analysis (interrogate) or acknowledges info the member supplies. Failure-
 * tolerant: any error resolves to an "unavailable" reply so the thread never
 * breaks (mirrors the analysis loader's fall-back discipline).
 */
export async function fetchRailReply(
  oppKey: string,
  message: string,
  openQuestion?: string,
): Promise<RailReply> {
  // A rail turn runs a retrieval + an LLM call; observed p100 is tens of
  // seconds. Without a deadline a stalled request never settles, and the rail's
  // `sending` flag locks the composer for the rest of the session — so bound it
  // and degrade to the same "unavailable" reply every other failure produces.
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), RAIL_TIMEOUT_MS);
  try {
    const res = await apiFetch(`${API_BASE_URL}/grants-take/rail`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        oppKey,
        message,
        ...(openQuestion ? { openQuestion } : {}),
      }),
      signal: abort.signal,
    });
    if (!res.ok) return UNAVAILABLE;
    const body = (await res.json()) as Partial<RailReply> | null;
    // Shape-check the payload: a proxy/gateway can return 200 with something
    // that is not a reply, and rendering `undefined` into the thread (or
    // treating an absent `kind` as "landed") is worse than saying so.
    if (!body || typeof body.reply !== "string" || !KINDS.has(body.kind as RailReply["kind"])) {
      return UNAVAILABLE;
    }
    // `cta` names an ACTION the rail will render as a button, so an unknown
    // value is dropped rather than passed through to the dispatcher.
    return { ...body, cta: body.cta === "mentor" ? "mentor" : undefined } as RailReply;
  } catch {
    return UNAVAILABLE;
  } finally {
    clearTimeout(timer);
  }
}
