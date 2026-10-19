import { useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Download, Plus, Upload, X } from "lucide-react";
import { Button } from "@/components/ui";
import {
  PastPerformanceCard,
  type PastPerformanceEntry as CardEntry,
} from "../PastPerformanceCard";
import { PastPerformanceModal } from "../PastPerformanceModal";
import { useEditMode } from "../BusinessProfileMode";
import {
  addPastPerformance,
  deletePastPerformance,
  summarize,
  updatePastPerformance,
  usePastPerformance,
  type PpEntry,
} from "../../../demo/profile/pastPerformance";
import { fmtMonthYear, fmtMoneyShort } from "../../../demo/profile/dates";
import { saveTextFile } from "../../../demo/profile/downloads";
import { byMember } from "../../../demo/member";

// DEMO: the projects come from the story (PAST_PERFORMANCE) and live in the demo store.
function toCardEntry(e: PpEntry): CardEntry {
  return {
    id: e.id,
    title: e.title,
    customer: e.customer,
    customerType: e.customerType,
    contractType: e.contractType,
    periodStart: fmtMonthYear(e.periodStart),
    periodEnd: fmtMonthYear(e.periodEnd),
    value: e.value,
    naics: e.naics,
    scope: e.scope,
    referenceName: e.referenceName,
    referenceTitle: e.referenceTitle,
    cpars: e.cpars,
    status: e.status,
    extractedFrom: e.extractedFrom,
  };
}

// DEMO: the example row fits the member's own work.
const TEMPLATE = [
  "title,customer,value,start,end,naics,role,scope",
  byMember({
    caterer:
      '"Example: school lunch program","Example School District",50000,2024-01-08,2024-06-14,722310,Prime,"Cooked and delivered 400 lunches a day to four schools. Menus met the USDA meal pattern."',
    pack:
      '"Example: recruiting video campaign","Example County",45000,2024-03-01,2024-09-30,541810,Prime,"Made four 30-second videos and ran paid social for six months. 1,200 people filled in the lead form."',
  }),
].join("\n");

/** Reads a CSV the visitor chose. Returns the projects it could read. */
function readProjects(csv: string, fileName: string): Omit<PpEntry, "id">[] {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const split = (line: string): string[] => {
    const out: string[] = [];
    let cur = "";
    let quoted = false;
    for (const ch of line) {
      if (ch === '"') quoted = !quoted;
      else if (ch === "," && !quoted) {
        out.push(cur.trim());
        cur = "";
      } else cur += ch;
    }
    out.push(cur.trim());
    return out;
  };
  const header = split(lines[0]).map((h) => h.toLowerCase());
  const col = (...names: string[]) => header.findIndex((h) => names.includes(h));
  const iTitle = col("title", "project", "project title");
  const iCustomer = col("customer", "customer name");
  const iValue = col("value", "amount", "total value");
  const iStart = col("start", "start date");
  const iEnd = col("end", "end date");
  const iNaics = col("naics", "naics code");
  const iRole = col("role");
  const iScope = col("scope", "description");
  if (iTitle < 0 || iCustomer < 0) return [];
  const out: Omit<PpEntry, "id">[] = [];
  for (const line of lines.slice(1)) {
    const c = split(line);
    const title = c[iTitle];
    const customer = c[iCustomer];
    if (!title || !customer) continue;
    out.push({
      title,
      customer,
      customerType: "Other",
      periodStart: iStart >= 0 ? c[iStart] || "" : "",
      periodEnd: iEnd >= 0 ? c[iEnd] || "" : "",
      value: iValue >= 0 ? Number(c[iValue]?.replace(/[$,]/g, "")) || 0 : 0,
      role: iRole >= 0 && /sub/i.test(c[iRole] ?? "") ? "Sub" : "Prime",
      naics: iNaics >= 0 ? c[iNaics] || "" : "",
      scope: iScope >= 0 ? c[iScope] || "" : "",
      status: "needs_review",
      extractedFrom: `Read from ${fileName}`,
    });
  }
  return out;
}

function BulkImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const picker = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  async function onFile(file: File) {
    const text = await file.text().catch(() => "");
    const rows = readProjects(text, file.name);
    if (rows.length === 0) {
      setResult({
        ok: false,
        text: `We could not find any projects in ${file.name}. Use the template: it has the columns we read.`,
      });
      return;
    }
    rows.forEach((r) => addPastPerformance(r));
    setResult({
      ok: true,
      text: `Added ${rows.length} ${rows.length === 1 ? "project" : "projects"} from ${file.name}. Please review each one and confirm it.`,
    });
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) setResult(null);
        onOpenChange(o);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="ky-modal-overlay" />
        <Dialog.Content className="bp-modal-content">
          <Dialog.Title className="bp-modal-title">Bulk import</Dialog.Title>
          <Dialog.Description className="bp-modal-helper">
            Add many projects at once from a spreadsheet saved as CSV. Each project comes in as "needs review" until you
            confirm it.
          </Dialog.Description>
          <div className="bp-modal-form">
            <p className="pp-import-note">
              The columns we read: title, customer, value, start, end, naics, role, scope. Title and customer are required.
            </p>
            <div className="bp-modal-footer" style={{ justifyContent: "flex-start" }}>
              <Button
                variant="secondary"
                onClick={() => saveTextFile("past-performance-template.csv", TEMPLATE, "text/csv")}
              >
                <Download size={14} aria-hidden /> Download the template
              </Button>
              <Button variant="primary" onClick={() => picker.current?.click()}>
                <Upload size={14} aria-hidden /> Choose a CSV file
              </Button>
              <input
                ref={picker}
                type="file"
                hidden
                accept=".csv,text/csv,text/plain"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void onFile(f);
                  e.target.value = "";
                }}
              />
            </div>
            {result && (
              <p className="pp-import-result" data-ok={result.ok ? "true" : "false"} role="status">
                {result.text}
              </p>
            )}
          </div>
          <div className="bp-modal-footer">
            <Button variant="primary" onClick={() => onOpenChange(false)}>
              Done
            </Button>
          </div>
          <Dialog.Close asChild>
            <button type="button" className="ky-modal-close" aria-label="Close">
              <X size={16} />
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function PastPerformanceTab() {
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<PpEntry | undefined>(undefined);
  const editMode = useEditMode();
  const all = usePastPerformance();
  const entries = all.map(toCardEntry);
  const sum = summarize(all);

  return (
    <div className="pp-tab">
      <header className="pp-tab-header">
        <h2 className="pp-tab-title">Past Performance</h2>
        {editMode && (
          <div className="pp-tab-actions">
            <button
              type="button"
              className="pp-btn-primary"
              onClick={() => {
                setEditing(undefined);
                setAddOpen(true);
              }}
            >
              <Plus size={16} aria-hidden /> Add a project
            </button>
            <button type="button" className="pp-btn-secondary" onClick={() => setImportOpen(true)}>
              <Upload size={16} aria-hidden /> Bulk import
            </button>
          </div>
        )}
      </header>
      <div className="pp-summary">
        {entries.length} {entries.length === 1 ? "entry" : "entries"} · Total {fmtMoneyShort(sum.total)} · {sum.federal}{" "}
        federal, {sum.local} local, {sum.commercial} commercial{sum.other > 0 ? `, ${sum.other} other` : ""}
      </div>

      {entries.length === 0 && (
        <p className="pp-import-note">
          No projects yet. Add one, or bulk import a list. Buyers read this section first.
        </p>
      )}

      <div className="pp-list">
        {entries.map((e) => (
          <PastPerformanceCard
            key={e.id}
            entry={e}
            actions={{
              onEdit: (id) => {
                setEditing(all.find((x) => x.id === id));
                setAddOpen(true);
              },
              onDelete: deletePastPerformance,
              onConfirm: (id) => updatePastPerformance(id, { status: "attested", extractedFrom: undefined }),
              onNotReal: deletePastPerformance,
            }}
          />
        ))}
      </div>

      <PastPerformanceModal
        open={addOpen}
        onOpenChange={setAddOpen}
        entry={editing}
        onSave={(data) => {
          if (editing) updatePastPerformance(editing.id, data);
          else addPastPerformance(data);
        }}
      />
      <BulkImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}
