// Shared "Capability Statement" gap flag — in-memory, resets on reload.

import { useSyncExternalStore } from "react";
import { bus } from "./eventBus";

let snap: { uploaded: boolean; savedAt: string | null } = { uploaded: false, savedAt: null };

export function markCapStatementSaved() {
  snap = { uploaded: true, savedAt: new Date().toISOString() };
  bus.publish("capStatement");
}

export function clearCapStatement() {
  snap = { uploaded: false, savedAt: null };
  bus.publish("capStatement");
}

function snapshot(): { uploaded: boolean; savedAt: string | null } {
  return snap;
}

export function useCapStatementUploaded(): { uploaded: boolean; savedAt: string | null } {
  return useSyncExternalStore(
    (cb) => bus.subscribe("capStatement", cb),
    snapshot,
    snapshot,
  );
}

export const CAP_STATEMENT_CHANGED_EVENT = "cap-statement-changed";
