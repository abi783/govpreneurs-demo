// DEMO: who is looking at the demo.
//
// A visitor on demo.govpreneurs.com gives a name and email and picks a business on
// /start, then explores the member for that trade (D98). A presenter turns on
// presenter mode at /admin, which shows the presenter panel and skips /start.
// Both live in localStorage, so this browser remembers them across visits.
//
// The /admin password is checked in the browser: anyone who reads the code can find
// it. It only hides demo controls; nothing private sits behind it.

import type { MemberId } from "./member";

const VISITOR_KEY = "gp-demo:visitor";
const PRESENTER_KEY = "gp-demo:presenter";
// Any capitals, with or without the space: "Tim Sabir", "timsabir".
const PRESENTER_PASSWORD = "timsabir";

/** The trades a visitor can pick. "Other" opens the marketing agency. */
export const NICHES: { id: string; label: string; member: MemberId }[] = [
  { id: "agency", label: "Marketing agency", member: "agency" },
  { id: "construction", label: "Construction", member: "construction" },
  { id: "trucking", label: "Trucking", member: "trucking" },
  { id: "it", label: "IT services", member: "it" },
  { id: "consulting", label: "Consulting", member: "consulting" },
  { id: "janitorial", label: "Janitorial", member: "janitorial" },
  { id: "other", label: "Other", member: "agency" },
];

export interface Visitor {
  name: string;
  email: string;
  phone: string;
  niche: string;
  member: MemberId;
  at: string;
}

/**
 * The start screen sends visitors to /start. Off in unit tests and in builds that
 * set VITE_START_SCREEN=off (the QA builds), so the crawl and scans see the pages.
 */
export const START_SCREEN_ON =
  import.meta.env?.VITE_START_SCREEN !== "off" && !(typeof process !== "undefined" && process.env?.VITEST);

/** Where a lead is posted. "none" (or unset) sends nothing. */
export const LEAD_URL: string | null = (() => {
  const url = import.meta.env?.VITE_LEAD_WEBHOOK_URL as string | undefined;
  return url && url !== "none" ? url : null;
})();

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* storage blocked: the session still works, it just isn't remembered */
  }
}

export function getVisitor(): Visitor | null {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(read(VISITOR_KEY) ?? "null") as Visitor | null;
  } catch {
    return null;
  }
}

export function saveVisitor(v: Visitor): void {
  write(VISITOR_KEY, JSON.stringify(v));
}

/** Presenter mode: the panel shows. Always on where the start screen is off. */
export function isPresenter(): boolean {
  if (!START_SCREEN_ON) return true;
  return typeof window !== "undefined" && read(PRESENTER_KEY) === "1";
}

export function setPresenter(on: boolean): void {
  write(PRESENTER_KEY, on ? "1" : null);
}

export function presenterPasswordMatches(typed: string): boolean {
  return typed.replace(/\s+/g, "").toLowerCase() === PRESENTER_PASSWORD;
}

/** True when this visitor has not been through /start yet. */
export function needsStart(): boolean {
  return START_SCREEN_ON && !isPresenter() && !getVisitor();
}

/**
 * Post the lead to the webhook as a plain form post (no CORS setup needed on the
 * receiver). The browser can't read the reply, so this never blocks the visitor.
 */
export function sendLead(v: Visitor): void {
  if (!LEAD_URL) return;
  const body = new URLSearchParams({
    name: v.name,
    email: v.email,
    phone: v.phone,
    business: NICHES.find((n) => n.id === v.niche)?.label ?? v.niche,
    source: "demo.govpreneurs.com",
    page: window.location.href,
    submitted_at: v.at,
  });
  void fetch(LEAD_URL, { method: "POST", mode: "no-cors", body, keepalive: true }).catch(() => {});
}
