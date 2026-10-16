// Best-effort result reporting for the four ported free tools. Fires only
// when a tools:token already exists (the user unlocked via LeadGate on some
// other tool in this session) — never blocks or surfaces errors.
import { getResults, getToolsToken } from "@/lib/tools/api";

const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? "";

export interface ToolResultPayload {
  tool: string;
  title?: string;
  summary?: string;
  data?: unknown;
  notify?: boolean;
}

export interface ToolResultSaved {
  id: string;
  emailed: boolean;
}

/** Awaitable save — throws on failure so callers (e.g. EmailChecklistCta) can
 *  show an error. Returns null when there's no tools token to send. */
export async function postToolResult(payload: ToolResultPayload): Promise<ToolResultSaved | null> {
  const token = getToolsToken();
  if (!token) return null;
  const res = await fetch(`${API_BASE_URL}/public/tools/results`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Save failed (${res.status})`);
  return res.json() as Promise<ToolResultSaved>;
}

/** Fire-and-forget wrapper for callers that only want best-effort reporting
 *  and never surface an error (the three tools' own auto-report-on-complete
 *  effects). */
export function postToolResultFireAndForget(payload: ToolResultPayload): void {
  void postToolResult(payload).catch(() => {
    /* best-effort — swallow errors */
  });
}

/** Latest saved `data` blob for one tool, for restoring a signed-in user's
 *  state on a device where localStorage is empty (results are newest-first
 *  already; the first match is the latest). Returns null with no token, no
 *  saved rows for that tool, or a fetch error. */
export async function getLatestSavedData<T>(tool: string): Promise<T | null> {
  if (!getToolsToken()) return null;
  try {
    const { results } = await getResults();
    const row = results.find((r) => r.tool === tool && r.data !== undefined);
    return (row?.data as T | undefined) ?? null;
  } catch {
    return null;
  }
}

/** "2h ago" / "3d ago" style relative date for the recent-results list. */
export function formatRelativeDate(iso: string): string {
  const diffMin = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const h = Math.round(diffMin / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
