// Grant's free-text chat on the forecast page: the client for
// `POST /forecasts/:oppKey/grant/reply` and `GET /forecasts/:oppKey/grant/session`.
// Owner: feature 8. The contract is ARCHITECTURE-forecasts-grant-chat.md, and the
// backend half is `backend/src/forecast-grant/forecast-grant.types.ts`.
//
// Identity is the signed-in session, resolved on the server. No call here sends a
// `locationId`. A failed call resolves to a typed error, never to a reply.

import { API_BASE_URL, apiFetch } from "../api";
import { rich, type ForecastRead } from "./grant";
import type { ForecastCall } from "./grantCopy";

/** Bounds, in characters. They equal the backend's; change both or neither. */
export const MESSAGE_MAX = 2000;
export const READ_SUMMARY_MAX = 600;
export const READ_UNKNOWNS_MAX_ITEMS = 12;
export const READ_UNKNOWN_MAX = 160;

/** What the request carries of the page's read: the call, the summary, the open unknowns. */
export interface ForecastGrantReadSummary {
  call: ForecastCall;
  summary: string;
  unknowns: string[];
}

/** One stored message. */
export interface ForecastGrantMessage {
  role: "user" | "grant";
  text: string;
  /** ISO 8601. */
  at: string;
}

/** Why a call failed. `unavailable` is a 502 (the model failed); `failed` is anything else. */
export type ForecastGrantChatError = "unavailable" | "failed";

export type ForecastGrantReplyResult =
  | { ok: true; reply: string }
  | { ok: false; error: ForecastGrantChatError };

const BAD_GATEWAY = 502;
const ROLES: readonly ForecastGrantMessage["role"][] = ["user", "grant"];

/** "Price **alone** decided it" → "Price alone decided it", through the page's own mark parser. */
function stripMarks(text: string): string {
  return rich(text)
    .map((segment) => segment.text)
    .join("");
}

/** The read summary, cut to its bounds, with the `**` bold marks taken out. */
export function toReadSummary(read: ForecastRead): ForecastGrantReadSummary {
  return {
    call: read.call,
    summary: stripMarks(read.summary).slice(0, READ_SUMMARY_MAX),
    unknowns: read.unknowns
      .slice(0, READ_UNKNOWNS_MAX_ITEMS)
      .map((u) => u.label.slice(0, READ_UNKNOWN_MAX)),
  };
}

function grantUrl(oppKey: string, leaf: "reply" | "session"): string {
  return `${API_BASE_URL}/forecasts/${encodeURIComponent(oppKey)}/grant/${leaf}`;
}

/** Reads a JSON body, or `null` when the body is not JSON. */
async function jsonOrNull(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch (err) {
    console.warn("forecast grant: the response body is not JSON", err);
    return null;
  }
}

/** Sends one message. Resolves to the reply or to a typed error. */
export async function sendForecastGrantMessage(
  oppKey: string,
  message: string,
  read: ForecastGrantReadSummary,
): Promise<ForecastGrantReplyResult> {
  let response: Response;
  try {
    response = await apiFetch(grantUrl(oppKey, "reply"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, read }),
    });
  } catch (err) {
    console.warn("forecast grant: the reply request failed", err);
    return { ok: false, error: "failed" };
  }
  if (response.status === BAD_GATEWAY) return { ok: false, error: "unavailable" };
  if (!response.ok) return { ok: false, error: "failed" };
  const reply = ((await jsonOrNull(response)) as { reply?: unknown } | null)?.reply;
  if (typeof reply !== "string" || reply.trim() === "") return { ok: false, error: "failed" };
  return { ok: true, reply };
}

function isMessage(value: unknown): value is ForecastGrantMessage {
  if (value == null || typeof value !== "object") return false;
  const m = value as Partial<ForecastGrantMessage>;
  return (
    ROLES.includes(m.role as ForecastGrantMessage["role"]) &&
    typeof m.text === "string" &&
    typeof m.at === "string"
  );
}

/** The stored thread, newest last. Resolves to `null` when the read fails. */
export async function fetchForecastGrantSession(
  oppKey: string,
): Promise<ForecastGrantMessage[] | null> {
  let response: Response;
  try {
    response = await apiFetch(grantUrl(oppKey, "session"));
  } catch (err) {
    console.warn("forecast grant: the session request failed", err);
    return null;
  }
  if (!response.ok) return null;
  const messages = ((await jsonOrNull(response)) as { messages?: unknown } | null)?.messages;
  return Array.isArray(messages) ? messages.filter(isMessage) : null;
}
