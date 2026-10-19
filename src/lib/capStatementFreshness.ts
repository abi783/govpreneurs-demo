// Cap-statement freshness — refresh prompts that appear when a new certificate,
// project or capability file lands in the knowledge base.
// DEMO: kept in the demo store (key `profile.capFresh`), so a prompt survives a reload.

import { readDemoState, updateDemoState, useDemoState } from "../demo/runtime/store";
import type { KnowledgeSource } from "./knowledgeBase";

export interface PendingRefresh {
  id: string;
  triggerSourceId: string;
  triggerLabel: string;
  triggerKind: "cert" | "project" | "capability";
  createdAt: string;
}

export const CAP_FRESH_CHANGED_EVENT = "cap-fresh-changed";

const KEYWORDS: { match: RegExp; kind: PendingRefresh["triggerKind"]; label: (n: string) => string }[] = [
  { match: /cmmc/i, kind: "cert", label: (n) => labelFromName(n, "cert") },
  { match: /cert(ificate|ification)?/i, kind: "cert", label: (n) => labelFromName(n, "cert") },
  { match: /license|permit/i, kind: "cert", label: (n) => labelFromName(n, "license") },
  { match: /project|past performance|past-performance|award/i, kind: "project", label: (n) => labelFromName(n, "project") },
  { match: /capabilit/i, kind: "capability", label: (n) => labelFromName(n, "capability") },
];

function labelFromName(name: string, fallback: string): string {
  const base = name.replace(/\.[a-z0-9]+$/i, "");
  return base || fallback;
}

interface FreshState {
  pending: PendingRefresh[];
  seen: Record<string, true>;
}

const KEY = "profile.capFresh";
const seed = (): FreshState => ({ pending: [], seen: {} });

export function scanForFreshness(sources: KnowledgeSource[]) {
  updateDemoState<FreshState>(KEY, seed, (state) => {
    const seen = { ...state.seen };
    const newOnes: PendingRefresh[] = [];
    for (const src of sources) {
      if (seen[src.id]) continue;
      seen[src.id] = true;
      if (src.kind === "generated") continue;
      const hit = KEYWORDS.find((k) => k.match.test(src.name));
      if (!hit) continue;
      if (state.pending.some((p) => p.triggerSourceId === src.id)) continue;
      newOnes.push({
        id: `refresh_${src.id}`,
        triggerSourceId: src.id,
        triggerLabel: hit.label(src.name),
        triggerKind: hit.kind,
        createdAt: new Date().toISOString(),
      });
    }
    return { pending: [...state.pending, ...newOnes], seen };
  });
}

export function listPendingRefresh(): PendingRefresh[] {
  return readDemoState<FreshState>(KEY, seed).pending;
}

export function getPendingRefresh(id: string): PendingRefresh | undefined {
  return listPendingRefresh().find((p) => p.id === id);
}

export function dismissRefresh(id: string) {
  updateDemoState<FreshState>(KEY, seed, (s) => ({ ...s, pending: s.pending.filter((p) => p.id !== id) }));
}

export function clearAllRefresh() {
  updateDemoState<FreshState>(KEY, seed, (s) => ({ ...s, pending: [] }));
}

export function primeSeen(sources: KnowledgeSource[]) {
  updateDemoState<FreshState>(KEY, seed, (s) => {
    const seen = { ...s.seen };
    let changed = false;
    for (const src of sources) {
      if (!seen[src.id]) {
        seen[src.id] = true;
        changed = true;
      }
    }
    return changed ? { ...s, seen } : s;
  });
}

export function usePendingRefresh(): PendingRefresh[] {
  const [state] = useDemoState<FreshState>(KEY, seed);
  return state.pending;
}
