// Knowledge Hub — in-memory store layered on top of knowledgeBase events.
// Models simulated connector sync, file processing, conflicts, and gap prompts.
// Demo only — no real OAuth, no persistence; resets on reload.

import { useSyncExternalStore } from "react";
import { bus } from "./eventBus";

export type SourceId = "gdrive" | "gdocs" | "dropbox";
export type SourceStatus = "not-connected" | "connecting" | "connected";

export interface HubSource {
  id: SourceId;
  label: string;
  status: SourceStatus;
  syncedAt: string | null; // ISO
  filesUsed: number;
}

export type FileStatus = "processing" | "read";

export interface HubFile {
  id: string;
  name: string;
  ext: "pdf" | "docx" | "zip" | "image" | "other";
  status: FileStatus;
  // Concrete value moment — what Hunter pulled out of this file.
  filledFields: string[];
}

export interface HubConflict {
  id: string;
  field: string;            // human-readable label
  docValue: string;
  profileValue: string;
  sourceFileName: string;
}

export interface MissingItem {
  key: string;
  label: string;            // matches readiness "Could match better with…" copy
}

interface HubState {
  sources: Record<SourceId, HubSource>;
  files: HubFile[];
  conflicts: HubConflict[];
  missing: MissingItem[];
}

const now = () => new Date().toISOString();
const hoursAgo = (h: number) =>
  new Date(Date.now() - h * 3600_000).toISOString();

function seed(): HubState {
  return {
    sources: {
      gdrive: {
        id: "gdrive",
        label: "Google Drive",
        status: "connected",
        syncedAt: hoursAgo(2),
        filesUsed: 4,
      },
      gdocs: {
        id: "gdocs",
        label: "Google Docs",
        status: "not-connected",
        syncedAt: null,
        filesUsed: 0,
      },
      dropbox: {
        id: "dropbox",
        label: "Dropbox",
        status: "not-connected",
        syncedAt: null,
        filesUsed: 0,
      },
    },
    files: [
      {
        id: "f_capstmt",
        name: "Capability Statement v2.pdf",
        ext: "pdf",
        status: "read",
        filledFields: ["NAICS", "past projects", "certifications"],
      },
      {
        id: "f_sam",
        name: "SAM Registration.pdf",
        ext: "pdf",
        status: "read",
        filledFields: ["UEI", "CAGE", "registration expiry"],
      },
      {
        id: "f_ftbragg",
        name: "Fort Bragg job photos.zip",
        ext: "zip",
        status: "processing",
        filledFields: [],
      },
    ],
    conflicts: [
      {
        id: "c_bonding",
        field: "Bonding capacity",
        docValue: "$2M",
        profileValue: "$1M",
        sourceFileName: "Capability Statement v2.pdf",
      },
    ],
    // Mirror ReadinessHeader's COULD_HELP_DEFAULT phrasing.
    missing: [
      { key: "dsbs", label: "a DSBS profile export" },
      { key: "cpars", label: "past-performance references (CPARS)" },
    ],
  };
}

let state: HubState = seed();

function commit(next: HubState) {
  state = next;
  bus.publish("knowledge");
}

const snapshot = (): HubState => state;

export function useKnowledgeHub(): HubState {
  return useSyncExternalStore(
    (cb) => bus.subscribe("knowledge", cb),
    snapshot,
    snapshot,
  );
}

// ─── actions ──────────────────────────────────────────────────────────

export function simulateConnect(id: SourceId) {
  const src = state.sources[id];
  if (src.status === "connected" || src.status === "connecting") return;

  commit({
    ...state,
    sources: { ...state.sources, [id]: { ...src, status: "connecting" } },
  });

  window.setTimeout(() => {
    const cur = state.sources[id];
    if (cur.status !== "connecting") return;
    const filesUsed = id === "gdrive" ? 4 : id === "gdocs" ? 3 : 2;
    commit({
      ...state,
      sources: {
        ...state.sources,
        [id]: { ...cur, status: "connected", syncedAt: now(), filesUsed },
      },
    });
  }, 850);
}

export function simulateSync(id: SourceId) {
  const src = state.sources[id];
  if (src.status !== "connected") return;
  commit({
    ...state,
    sources: { ...state.sources, [id]: { ...src, status: "connecting" } },
  });
  window.setTimeout(() => {
    commit({
      ...state,
      sources: {
        ...state.sources,
        [id]: { ...src, status: "connected", syncedAt: now() },
      },
    });
  }, 650);
}

export function disconnectSource(id: SourceId) {
  commit({
    ...state,
    sources: {
      ...state.sources,
      [id]: {
        ...state.sources[id],
        status: "not-connected",
        syncedAt: null,
        filesUsed: 0,
      },
    },
  });
}

function inferExt(name: string): HubFile["ext"] {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "pdf";
  if (ext === "doc" || ext === "docx") return "docx";
  if (ext === "zip") return "zip";
  if (["png", "jpg", "jpeg", "webp"].includes(ext)) return "image";
  return "other";
}

export function simulateUpload(name: string) {
  const id = `f_${Math.random().toString(36).slice(2, 9)}`;
  const file: HubFile = {
    id,
    name,
    ext: inferExt(name),
    status: "processing",
    filledFields: [],
  };
  commit({ ...state, files: [file, ...state.files] });

  window.setTimeout(() => {
    commit({
      ...state,
      files: state.files.map((f) =>
        f.id === id ? { ...f, status: "read" } : f,
      ),
    });
  }, 1200);
}

export function removeFile(id: string) {
  commit({ ...state, files: state.files.filter((f) => f.id !== id) });
}

export function resolveConflict(id: string, _choice: "doc" | "profile") {
  commit({ ...state, conflicts: state.conflicts.filter((c) => c.id !== id) });
}

export function dismissMissing(key: string) {
  commit({ ...state, missing: state.missing.filter((m) => m.key !== key) });
}

// ─── formatting helper ────────────────────────────────────────────────

export function formatRelative(iso: string | null): string {
  if (!iso) return "";
  const diffMin = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const h = Math.round(diffMin / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}
