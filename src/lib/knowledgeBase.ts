// Your business knowledge — connected sources, uploaded files and generated documents.
// DEMO: kept in the demo store (key `profile.knowledge`), so a connection or a file
// survives a reload, and "Reset demo" puts the starting files back. The Knowledge
// tab, Stay Ready (renewal confirmations) and the capability statement builder all
// read and write this one list.

import { byMember } from "../demo/member";
import { PERSONA } from "../demo/story/persona";
import { isoDaysFromNow } from "../demo/story/clock";
import { readDemoState, updateDemoState, useDemoState } from "../demo/runtime/store";
import { CAP_STATEMENT_FILE_NAME } from "./capStatementState";

export type ConnectorId = "gdrive" | "gdocs" | "dropbox";
export type SourceKind = ConnectorId | "upload" | "generated";

export interface KnowledgeSource {
  id: string;
  kind: SourceKind;
  name: string;
  sizeKB: number;
  mime: string;
  addedAt: string;
  connectorId?: ConnectorId;
  /** `processing` shows a spinner for a moment. Every file ends as `read`. */
  status: "processing" | "read";
  /** What Hunter pulled out of the file. */
  filledFields: string[];
  /** A real file in public/ that the Download button gives back. */
  href?: string;
  /** The file's own bytes, kept only for small uploads. */
  dataUrl?: string;
}

export interface KnowledgeConnectorState {
  id: ConnectorId;
  connected: boolean;
  connectedAt?: string;
  /** `connecting` shows a spinner for a moment. */
  connecting?: boolean;
}

export interface KnowledgeState {
  connectors: Record<ConnectorId, KnowledgeConnectorState>;
  files: KnowledgeSource[];
}

export const KNOWLEDGE_CHANGED_EVENT = "knowledge-changed";

export const CONNECTOR_META: Record<ConnectorId, { label: string }> = {
  gdrive: { label: "Google Drive" },
  gdocs: { label: "Google Docs" },
  dropbox: { label: "Dropbox" },
};

type ConnectorFiles = Record<ConnectorId, Omit<KnowledgeSource, "id" | "addedAt" | "status">[]>;

/** DEMO: the agency's files — certificates, rate card, campaign results, studio kit. */
const AGENCY_FILES: ConnectorFiles = {
  gdrive: [
    {
      kind: "gdrive",
      connectorId: "gdrive",
      name: "SAM.gov registration — active.pdf",
      sizeKB: 212,
      mime: "pdf",
      filledFields: ["UEI", "CAGE", "registration expiry"],
    },
    {
      kind: "gdrive",
      connectorId: "gdrive",
      name: "WOSB certification letter.pdf",
      sizeKB: 188,
      mime: "pdf",
      filledFields: ["certifications", "renewal date"],
    },
  ],
  gdocs: [
    {
      kind: "gdocs",
      connectorId: "gdocs",
      name: "Rate card for video, paid media and print buying.docx",
      sizeKB: 84,
      mime: "docx",
      filledFields: ["services and prices"],
    },
    {
      kind: "gdocs",
      connectorId: "gdocs",
      name: "Campaign results: NC Guard and stormwater.docx",
      sizeKB: 156,
      mime: "docx",
      filledFields: ["past projects", "results"],
    },
  ],
  dropbox: [
    {
      kind: "dropbox",
      connectorId: "dropbox",
      name: "Studio and camera equipment list.pdf",
      sizeKB: 72,
      mime: "pdf",
      filledFields: ["facilities", "equipment"],
    },
  ],
};

/** The files each source brings in when it connects. Fictional files for a fictional business. */
const CATERER_FILES: ConnectorFiles = {
  gdrive: [
    {
      kind: "gdrive",
      connectorId: "gdrive",
      name: "SAM.gov registration — active.pdf",
      sizeKB: 212,
      mime: "pdf",
      filledFields: ["UEI", "CAGE", "registration expiry"],
    },
    {
      kind: "gdrive",
      connectorId: "gdrive",
      name: "ServSafe food-handler certificates.pdf",
      sizeKB: 348,
      mime: "pdf",
      filledFields: ["food-handler certificates"],
    },
  ],
  gdocs: [
    {
      kind: "gdocs",
      connectorId: "gdocs",
      name: "Spring catering menu and prices.docx",
      sizeKB: 96,
      mime: "docx",
      filledFields: ["menus and prices"],
    },
    {
      kind: "gdocs",
      connectorId: "gdocs",
      name: "Allergen and halal handling plan.docx",
      sizeKB: 128,
      mime: "docx",
      filledFields: ["allergen plan", "halal handling"],
    },
  ],
  dropbox: [
    {
      kind: "dropbox",
      connectorId: "dropbox",
      name: "Kitchen equipment and delivery van list.pdf",
      sizeKB: 88,
      mime: "pdf",
      filledFields: ["facilities", "equipment"],
    },
  ],
};

const CONNECTOR_FILES: ConnectorFiles = byMember({ caterer: CATERER_FILES, pack: AGENCY_FILES });

function seed(): KnowledgeState {
  // Drive synced a couple of hours before the demo opened.
  const gdriveAt = new Date(Date.now() - 2 * 3_600_000).toISOString();
  const files: KnowledgeSource[] = [
    {
      id: "src_capstmt",
      kind: "upload",
      name: CAP_STATEMENT_FILE_NAME,
      sizeKB: 3,
      mime: "pdf",
      addedAt: isoDaysFromNow(-45, 11),
      status: "read",
      filledFields: ["NAICS", "past projects", "certifications"],
      href: PERSONA.capabilityStatementFile,
    },
    ...CONNECTOR_FILES.gdrive.map((f, i) => ({
      ...f,
      id: `src_gdrive_${i}`,
      addedAt: gdriveAt,
      status: "read" as const,
    })),
  ];
  return {
    connectors: {
      gdrive: { id: "gdrive", connected: true, connectedAt: gdriveAt },
      gdocs: { id: "gdocs", connected: false },
      dropbox: { id: "dropbox", connected: false },
    },
    files,
  };
}

const KEY = "profile.knowledge";

/** A file that was still processing when the page was left is read now. */
function settled(state: KnowledgeState): KnowledgeState {
  const stuck = state.files.some((f) => f.status === "processing" && Date.now() - new Date(f.addedAt).getTime() > 4000);
  const stuckConn = Object.values(state.connectors).some((c) => c.connecting);
  if (!stuck && !stuckConn) return state;
  return {
    connectors: Object.fromEntries(
      Object.entries(state.connectors).map(([k, c]) => [k, c.connecting ? { ...c, connecting: false } : c]),
    ) as Record<ConnectorId, KnowledgeConnectorState>,
    files: state.files.map((f) => (f.status === "processing" ? { ...f, status: "read" as const } : f)),
  };
}

let normalized = false;
function ensure(): KnowledgeState {
  const current = readDemoState<KnowledgeState>(KEY, seed);
  if (normalized) return current;
  normalized = true;
  const next = settled(current);
  if (next !== current) updateDemoState<KnowledgeState>(KEY, seed, () => next);
  return next;
}

function commit(fn: (prev: KnowledgeState) => KnowledgeState) {
  ensure();
  updateDemoState<KnowledgeState>(KEY, seed, fn);
}

export function useKnowledge(): KnowledgeState {
  ensure();
  const [state] = useDemoState<KnowledgeState>(KEY, seed);
  return state;
}

export function getKnowledge(): KnowledgeState {
  return ensure();
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

/** Start connecting a source. `finishConnect` completes it. */
export function beginConnect(id: ConnectorId) {
  commit((s) => ({ ...s, connectors: { ...s.connectors, [id]: { id, connected: false, connecting: true } } }));
}

export function finishConnect(id: ConnectorId) {
  const now = new Date().toISOString();
  commit((s) => {
    if (!s.connectors[id].connecting) return s;
    const have = new Set(s.files.map((f) => f.name));
    const brought: KnowledgeSource[] = CONNECTOR_FILES[id]
      .filter((f) => !have.has(f.name))
      .map((f) => ({ ...f, id: uid("src"), addedAt: now, status: "read" as const }));
    return {
      connectors: { ...s.connectors, [id]: { id, connected: true, connectedAt: now } },
      files: [...s.files, ...brought],
    };
  });
}

export function beginSync(id: ConnectorId) {
  commit((s) => ({ ...s, connectors: { ...s.connectors, [id]: { ...s.connectors[id], connecting: true } } }));
}

export function syncSource(id: ConnectorId) {
  commit((s) => ({
    ...s,
    connectors: { ...s.connectors, [id]: { ...s.connectors[id], connectedAt: new Date().toISOString(), connecting: false } },
  }));
}

export function disconnectSource(id: ConnectorId) {
  commit((s) => ({
    connectors: { ...s.connectors, [id]: { id, connected: false } },
    files: s.files.filter((f) => f.connectorId !== id),
  }));
}

function inferMime(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "pdf";
  if (ext === "doc" || ext === "docx") return "docx";
  if (ext === "zip") return "zip";
  if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext)) return "image";
  return ext || "file";
}

const KEEP_BYTES_UP_TO = 400 * 1024;

function readAsDataUrl(file: File): Promise<string | undefined> {
  if (file.size > KEEP_BYTES_UP_TO) return Promise.resolve(undefined);
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : undefined);
    reader.onerror = () => resolve(undefined);
    reader.readAsDataURL(file);
  });
}

/** Add an uploaded file. Any file is accepted. It shows as processing, then read. */
export async function attachUploadedFile(file: File): Promise<KnowledgeSource> {
  const dataUrl = await readAsDataUrl(file);
  const entry: KnowledgeSource = {
    id: uid("upl"),
    kind: "upload",
    name: file.name,
    sizeKB: Math.max(1, Math.round(file.size / 1024)),
    mime: inferMime(file.name),
    addedAt: new Date().toISOString(),
    status: "processing",
    filledFields: [],
    dataUrl,
  };
  commit((s) => ({ ...s, files: [entry, ...s.files] }));
  return entry;
}

/** Add a file by name only (used by Stay Ready's "simulate" tool and by generated documents). */
export function attachFile(meta: { name: string; sizeKB: number; mime: string }): KnowledgeSource {
  const entry: KnowledgeSource = {
    id: uid("upl"),
    kind: "upload",
    addedAt: new Date().toISOString(),
    status: "read",
    filledFields: [],
    ...meta,
  };
  commit((s) => ({ ...s, files: [entry, ...s.files] }));
  return entry;
}

export function markFileRead(id: string, filledFields?: string[]) {
  commit((s) => ({
    ...s,
    files: s.files.map((f) => (f.id === id ? { ...f, status: "read" as const, filledFields: filledFields ?? f.filledFields } : f)),
  }));
}

export function removeFile(id: string) {
  commit((s) => ({ ...s, files: s.files.filter((f) => f.id !== id) }));
}

export function saveGeneratedCapStmt(): KnowledgeSource {
  const file: KnowledgeSource = {
    id: uid("gen"),
    kind: "generated",
    name: CAP_STATEMENT_FILE_NAME,
    sizeKB: 142,
    mime: "pdf",
    addedAt: new Date().toISOString(),
    status: "read",
    filledFields: ["NAICS", "past projects", "certifications"],
  };
  commit((s) => ({
    ...s,
    // The new statement replaces the older one with the same name.
    files: [file, ...s.files.filter((f) => !(f.name === CAP_STATEMENT_FILE_NAME || (f.kind === "generated" && f.name.includes("Capability Statement"))))],
  }));
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
    status: "read",
    filledFields: ["renewal date"],
  };
  commit((s) => ({ ...s, files: [file, ...s.files] }));
  return file;
}

export function clearKnowledge() {
  updateDemoState<KnowledgeState>(KEY, seed, () => seed());
}
