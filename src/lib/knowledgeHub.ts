// Knowledge Hub — the view the Knowledge tab reads, built on the one list of files in
// knowledgeBase.ts. DEMO: nothing here is a separate copy. Sources and files come from
// the knowledge store; "Needs your eye" and "Still missing" come from the Business
// Profile fields, so fixing a field anywhere fixes it here too.

import { useMemo } from "react";
import {
  beginConnect,
  beginSync,
  disconnectSource as disconnectBase,
  finishConnect,
  removeFile as removeBase,
  syncSource,
  useKnowledge,
  type ConnectorId,
  type KnowledgeSource,
} from "./knowledgeBase";
import { wait } from "../demo/profile/delay";
import { FIELD_DEFS, effectiveField } from "../demo/profile/fields";
import { patchField, useFieldOverrides } from "../demo/profile/store";
import { usePastPerformance } from "../demo/profile/pastPerformance";
import { fmtShort } from "../demo/profile/dates";

export type SourceId = ConnectorId;
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
  source: KnowledgeSource;
}

export interface HubConflict {
  id: string;
  field: string; // human-readable label
  docValue: string;
  profileValue: string;
  sourceFileName: string;
  /** The profile field that holds this fact. */
  fieldId: string;
}

export interface MissingItem {
  key: string;
  label: string; // matches readiness "Could match better with…" copy
  /** The Business Profile tab where the visitor adds it. */
  tab: "identity" | "certifications" | "past-performance" | "positioning";
}

export interface HubState {
  sources: Record<SourceId, HubSource>;
  files: HubFile[];
  conflicts: HubConflict[];
  missing: MissingItem[];
}

const LABELS: Record<SourceId, string> = { gdrive: "Google Drive", gdocs: "Google Docs", dropbox: "Dropbox" };

function inferExt(name: string): HubFile["ext"] {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "pdf";
  if (ext === "doc" || ext === "docx") return "docx";
  if (ext === "zip") return "zip";
  if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) return "image";
  return "other";
}

/** The SAM file that holds the mailing address the conflict is about. */
const SAM_FILE_NAME = "SAM.gov registration — active.pdf";

export function useKnowledgeHub(): HubState {
  const knowledge = useKnowledge();
  const overrides = useFieldOverrides();
  const pp = usePastPerformance();

  return useMemo<HubState>(() => {
    const ids: SourceId[] = ["gdrive", "gdocs", "dropbox"];
    const sources = Object.fromEntries(
      ids.map((id) => {
        const c = knowledge.connectors[id];
        const status: SourceStatus = c.connecting ? "connecting" : c.connected ? "connected" : "not-connected";
        return [
          id,
          {
            id,
            label: LABELS[id],
            status,
            syncedAt: c.connected ? (c.connectedAt ?? null) : null,
            filesUsed: c.connected ? knowledge.files.filter((f) => f.connectorId === id).length : 0,
          } satisfies HubSource,
        ];
      }),
    ) as Record<SourceId, HubSource>;

    const files: HubFile[] = knowledge.files.map((f) => ({
      id: f.id,
      name: f.name,
      ext: inferExt(f.name),
      status: f.status,
      filledFields: f.filledFields,
      source: f,
    }));

    // "Needs your eye": a profile fact that a document and the profile say differently.
    const conflicts: HubConflict[] = [];
    const mailing = FIELD_DEFS["mailing-address"];
    const m = effectiveField(mailing, overrides);
    if (m.state === "conflict" && mailing.conflict && mailing.conflict.length >= 2) {
      conflicts.push({
        id: "c_mailing",
        fieldId: mailing.id,
        field: "Mailing address",
        docValue: mailing.conflict[0].value,
        profileValue: mailing.conflict[1].value,
        sourceFileName: SAM_FILE_NAME,
      });
    }

    // "Still missing": things Hunter matches better with. Each leaves when it is filled in.
    const missing: MissingItem[] = [];
    const state = (id: string) => effectiveField(FIELD_DEFS[id], overrides).state;
    if (state("dsbs") === "missing") {
      missing.push({ key: "dsbs", label: "a DSBS profile (so federal buyers can find you)", tab: "certifications" });
    }
    if (pp.some((e) => e.cpars === "Awaiting rating")) {
      const w = pp.find((e) => e.cpars === "Awaiting rating")!;
      missing.push({
        key: "cpars",
        label: `the performance rating (CPARS) for your ${w.customer.split(" ")[0]} job`,
        tab: "past-performance",
      });
    }
    if (state("ein") === "missing") {
      missing.push({ key: "ein", label: "your EIN, for invoices and tax forms", tab: "identity" });
    }
    if (state("win-themes") === "missing") {
      missing.push({ key: "win-themes", label: "your win themes, so Ava drafts in your voice", tab: "positioning" });
    }

    return { sources, files, conflicts, missing };
  }, [knowledge, overrides, pp]);
}

// ─── actions ──────────────────────────────────────────────────────────

export async function simulateConnect(id: SourceId) {
  beginConnect(id);
  await wait(850);
  finishConnect(id);
}

export async function simulateSync(id: SourceId) {
  beginSync(id);
  await wait(650);
  syncSource(id);
}

export function disconnectSource(id: SourceId) {
  disconnectBase(id);
}

export function removeFile(id: string) {
  removeBase(id);
}

/** Keep the document's value (`doc`) or the profile's value (`profile`). The profile field is updated. */
export function resolveConflict(id: string, choice: "doc" | "profile") {
  if (id !== "c_mailing") return;
  const def = FIELD_DEFS["mailing-address"];
  const pick = choice === "doc" ? def.conflict?.[0] : def.conflict?.[1];
  if (!pick) return;
  patchField(def.id, {
    state: "attested",
    value: pick.value,
    source: `You chose this in your knowledge hub on ${fmtShort(new Date())}`,
    at: new Date().toISOString(),
  });
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
