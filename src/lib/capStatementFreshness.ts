// Cap-statement freshness — in-memory store of pending refresh prompts
// triggered when new cert/project/capability sources land in the KB.

import { useSyncExternalStore } from "react";
import { bus } from "./eventBus";
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
  { match: /license/i, kind: "cert", label: (n) => labelFromName(n, "license") },
  { match: /project|past performance|past-performance|award/i, kind: "project", label: (n) => labelFromName(n, "project") },
  { match: /capabilit/i, kind: "capability", label: (n) => labelFromName(n, "capability") },
];

function labelFromName(name: string, fallback: string): string {
  const base = name.replace(/\.[a-z0-9]+$/i, "");
  return base || fallback;
}

let pending: PendingRefresh[] = [];
let seen: Record<string, true> = {};

export function scanForFreshness(sources: KnowledgeSource[]) {
  const newOnes: PendingRefresh[] = [];
  for (const src of sources) {
    if (seen[src.id]) continue;
    if (src.kind === "generated") {
      seen[src.id] = true;
      continue;
    }
    const hit = KEYWORDS.find((k) => k.match.test(src.name));
    if (!hit) {
      seen[src.id] = true;
      continue;
    }
    if (pending.some((p) => p.triggerSourceId === src.id)) {
      seen[src.id] = true;
      continue;
    }
    newOnes.push({
      id: `refresh_${src.id}`,
      triggerSourceId: src.id,
      triggerLabel: hit.label(src.name),
      triggerKind: hit.kind,
      createdAt: new Date().toISOString(),
    });
    seen[src.id] = true;
  }
  if (newOnes.length > 0) {
    pending = [...pending, ...newOnes];
    bus.publish("capFresh");
  }
}

export function listPendingRefresh(): PendingRefresh[] {
  return pending;
}

export function getPendingRefresh(id: string): PendingRefresh | undefined {
  return pending.find((p) => p.id === id);
}

export function dismissRefresh(id: string) {
  pending = pending.filter((p) => p.id !== id);
  bus.publish("capFresh");
}

export function clearAllRefresh() {
  pending = [];
  bus.publish("capFresh");
}

export function primeSeen(sources: KnowledgeSource[]) {
  for (const s of sources) seen[s.id] = true;
}

function snapshot(): PendingRefresh[] {
  return pending;
}

export function usePendingRefresh(): PendingRefresh[] {
  return useSyncExternalStore(
    (cb) => {
      const a = bus.subscribe("capFresh", cb);
      const b = bus.subscribe("knowledge", cb);
      return () => { a(); b(); };
    },
    snapshot,
    snapshot,
  );
}
