// Your business knowledge — connectors + uploads + generated docs.
// In-memory store; resets on reload.

import { useSyncExternalStore } from "react";
import { bus } from "./eventBus";

export type ConnectorId = "gdrive" | "onedrive" | "dropbox";
export type SourceKind = ConnectorId | "upload" | "generated";

export interface KnowledgeSource {
  id: string;
  kind: SourceKind;
  name: string;
  sizeKB: number;
  mime: string;
  addedAt: string;
  connectorId?: ConnectorId;
}

export interface KnowledgeConnectorState {
  id: ConnectorId;
  connected: boolean;
  connectedAt?: string;
}

export interface KnowledgeState {
  connectors: Record<ConnectorId, KnowledgeConnectorState>;
  files: KnowledgeSource[];
}

export const KNOWLEDGE_CHANGED_EVENT = "knowledge-changed";

const DEFAULT_STATE: KnowledgeState = {
  connectors: {
    gdrive: { id: "gdrive", connected: false },
    onedrive: { id: "onedrive", connected: false },
    dropbox: { id: "dropbox", connected: false },
  },
  files: [],
};

const CONNECTOR_SEED_FILES: Record<ConnectorId, Omit<KnowledgeSource, "id" | "addedAt">[]> = {
  gdrive: [
    { kind: "gdrive", connectorId: "gdrive", name: "Williams Construction — Past Projects.docx", sizeKB: 184, mime: "docx" },
    { kind: "gdrive", connectorId: "gdrive", name: "Insurance & Bonding.pdf", sizeKB: 421, mime: "pdf" },
  ],
  onedrive: [
    { kind: "onedrive", connectorId: "onedrive", name: "NC GC License.pdf", sizeKB: 96, mime: "pdf" },
    { kind: "onedrive", connectorId: "onedrive", name: "DD-214 (Marcus Williams).pdf", sizeKB: 312, mime: "pdf" },
  ],
  dropbox: [
    { kind: "dropbox", connectorId: "dropbox", name: "Field Photos — Ft Bragg re-roof.zip", sizeKB: 18432, mime: "zip" },
  ],
};

export const CONNECTOR_META: Record<
  ConnectorId,
  { label: string; oneLiner: string; accent: string }
> = {
  gdrive: { label: "Google Drive", oneLiner: "Connect to let us read your business docs from Drive.", accent: "#1FA463" },
  onedrive: { label: "Microsoft OneDrive", oneLiner: "Connect to pull in files from OneDrive.", accent: "#0364B8" },
  dropbox: { label: "Dropbox", oneLiner: "Connect to pull in files from Dropbox.", accent: "#0061FF" },
};

function seed(): KnowledgeState {
  return {
    connectors: { ...DEFAULT_STATE.connectors },
    files: [],
  };
}

let state: KnowledgeState = seed();

function commit(next: KnowledgeState) {
  state = next;
  bus.publish("knowledge");
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function snapshot(): KnowledgeState { return state; }

export function useKnowledge(): KnowledgeState {
  return useSyncExternalStore(
    (cb) => bus.subscribe("knowledge", cb),
    snapshot,
    snapshot,
  );
}

export function getKnowledge(): KnowledgeState {
  return state;
}

export function connectSource(id: ConnectorId) {
  if (state.connectors[id].connected) return;
  const now = new Date().toISOString();
  const seeded: KnowledgeSource[] = CONNECTOR_SEED_FILES[id].map((f) => ({
    ...f,
    id: uid("src"),
    addedAt: now,
  }));
  commit({
    connectors: {
      ...state.connectors,
      [id]: { id, connected: true, connectedAt: now },
    },
    files: [...state.files, ...seeded],
  });
}

export function disconnectSource(id: ConnectorId) {
  commit({
    connectors: {
      ...state.connectors,
      [id]: { id, connected: false },
    },
    files: state.files.filter((f) => f.connectorId !== id),
  });
}

export function attachFile(meta: { name: string; sizeKB: number; mime: string }) {
  const file: KnowledgeSource = {
    id: uid("upl"),
    kind: "upload",
    addedAt: new Date().toISOString(),
    ...meta,
  };
  commit({ ...state, files: [...state.files, file] });
}

export function removeFile(id: string) {
  commit({ ...state, files: state.files.filter((f) => f.id !== id) });
}

export function saveGeneratedCapStmt(): KnowledgeSource {
  const file: KnowledgeSource = {
    id: uid("gen"),
    kind: "generated",
    name: "Williams Construction — Capability Statement.pdf",
    sizeKB: 142,
    mime: "pdf",
    addedAt: new Date().toISOString(),
  };
  const filtered = state.files.filter(
    (f) => !(f.kind === "generated" && f.name.includes("Capability Statement")),
  );
  commit({ ...state, files: [...filtered, file] });
  return file;
}

export function saveRenewalConfirmation(opts: {
  itemName: string;
  confirmationNumber: string;
  year: number;
}): KnowledgeSource {
  const file: KnowledgeSource = {
    id: uid("gen"),
    kind: "generated",
    name: `${opts.itemName} — Renewal Confirmation ${opts.year} (${opts.confirmationNumber}).pdf`,
    sizeKB: 64,
    mime: "pdf",
    addedAt: new Date().toISOString(),
  };
  commit({ ...state, files: [...state.files, file] });
  return file;
}

export function clearKnowledge() {
  commit(seed());
}
