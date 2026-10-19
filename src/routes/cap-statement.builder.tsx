import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  Loader2,
  Save,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { usePageMeta } from "../components/Layout/page-meta";
import { useKnowledge, saveGeneratedCapStmt } from "../lib/knowledgeBase";
import { markCapStatementSaved } from "../lib/capStatementState";
import {
  buildCapStatementDraft,
  conciseSection,
  regenerateSection,
  useCapFacts,
  type CapSection,
  type CapStatementDraft,
  type CapStatementOverrides,
} from "../lib/capStatementBuilder";
// DEMO: the builder keeps its work in the demo store and downloads real files.
import { useDemoState } from "../demo/runtime/store";
import { wait } from "../demo/profile/delay";
import { buildCapStatementDocx, buildCapStatementPdf, saveBlob } from "../demo/profile/downloads";
import { CAP_STATEMENT_FILE_NAME } from "../lib/capStatementState";
import { AvaAvatar, AVA_IDENTITY } from "../components/Companion/identities/avaIdentity";
import { BuilderStepper } from "../components/CapStatement/BuilderStepper";
import { SourceFactsList, type FactKey } from "../components/CapStatement/SourceFactsList";
import { CapStatementDocument } from "../components/CapStatement/CapStatementDocument";
import { SectionEditor } from "../components/CapStatement/SectionEditor";
import { dismissRefresh, getPendingRefresh } from "../lib/capStatementFreshness";

interface CSSearch {
  refresh?: string;
}

export const Route = createFileRoute("/cap-statement/builder")({
  validateSearch: (search: Record<string, unknown>): CSSearch => ({
    refresh: typeof search.refresh === "string" ? search.refresh : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Build my capability statement — GovPreneurs" },
      {
        name: "description",
        content:
          "Ava drafts your federal capability statement from your business profile and knowledge — review and export.",
      },
    ],
  }),
  component: CapStatementBuilderPage,
});

type Step = 1 | 2 | 3 | 4;

// DEMO: what the builder holds between visits. A reload keeps the step, the edited
// facts and the draft; "Reset demo" clears them.
interface BuilderSaved {
  step: Step;
  overrides: CapStatementOverrides;
  confirmed: FactKey[];
  draft: CapStatementDraft | null;
  saved: boolean;
}
const BUILDER_INIT: BuilderSaved = { step: 1, overrides: {}, confirmed: [], draft: null, saved: false };

function CapStatementBuilderPage() {
  usePageMeta({ layout: "wide" });
  const member = useCapFacts();
  const { files } = useKnowledge();
  const navigate = useNavigate();
  const { refresh } = useSearch({ from: "/cap-statement/builder" });
  const pendingRefresh = useMemo(
    () => (refresh ? getPendingRefresh(refresh) : undefined),
    [refresh],
  );

  const [saveState, setSaveState] = useDemoState<BuilderSaved>("profile.capBuilder", BUILDER_INIT);
  const [generating, setGenerating] = useState(false);
  // The saved step is 1, 3 or 4. Step 2 is only the moment Ava is "drafting".
  const step: Step = generating ? 2 : saveState.step === 2 ? 1 : saveState.step;
  const overrides = saveState.overrides;
  const confirmed = useMemo(() => new Set<FactKey>(saveState.confirmed), [saveState.confirmed]);
  const draft: CapStatementDraft = useMemo(
    () => saveState.draft ?? buildCapStatementDraft(member, saveState.overrides),
    [saveState.draft, saveState.overrides, member],
  );
  const setStep = (n: Step) => setSaveState((s) => ({ ...s, step: n }));
  const setDraft = (next: CapStatementDraft | ((d: CapStatementDraft) => CapStatementDraft)) =>
    setSaveState((s) => {
      const base = s.draft ?? buildCapStatementDraft(member, s.overrides);
      return { ...s, draft: typeof next === "function" ? next(base) : next };
    });
  const [busyFile, setBusyFile] = useState<"pdf" | "docx" | null>(null);
  const saved = saveState.saved && step === 4;
  const aliveRef = useRef(true);
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const handleOverrideChange = (key: FactKey, value: string | null) => {
    setSaveState((s) => {
      const next = { ...s.overrides } as CapStatementOverrides;
      const k = key as keyof CapStatementOverrides;
      if (value === null) delete next[k];
      else next[k] = value;
      return { ...s, overrides: next };
    });
  };
  const handleConfirmedChange = (key: FactKey, on: boolean) => {
    setSaveState((s) => {
      const n = new Set(s.confirmed);
      if (on) n.add(key);
      else n.delete(key);
      return { ...s, confirmed: [...n] };
    });
  };

  const updateSection = (id: CapSection["id"], body: string) => {
    setDraft((d) => ({
      ...d,
      sections: d.sections.map((s) => (s.id === id ? { ...s, body } : s)),
    }));
  };

  const handleGenerate = async () => {
    setGenerating(true);
    await wait(1200);
    // DEMO: the draft is built fresh from the profile and the facts she edited.
    setSaveState((s) => ({ ...s, draft: buildCapStatementDraft(member, s.overrides), step: 3, saved: false }));
    if (aliveRef.current) setGenerating(false);
  };

  const handleSave = () => {
    saveGeneratedCapStmt();
    markCapStatementSaved(draft);
    if (refresh) dismissRefresh(refresh);
    setSaveState((s) => ({ ...s, step: 4, saved: true }));
  };

  // DEMO: real files, built in the browser from the draft on screen.
  const handleDownload = async (kind: "pdf" | "docx") => {
    setBusyFile(kind);
    try {
      const blob = kind === "pdf" ? await buildCapStatementPdf(draft) : await buildCapStatementDocx(draft);
      saveBlob(blob, CAP_STATEMENT_FILE_NAME.replace(/\.pdf$/, kind === "pdf" ? ".pdf" : ".docx"));
    } finally {
      if (aliveRef.current) setBusyFile(null);
    }
  };

  return (
    <div className="cs-shell">
      <div className="cs-shell-inner">
        <header className="cs-head">
          <button
            type="button"
            className="cs-back"
            onClick={() => navigate({ to: "/business-profile", search: { tab: "capabilities" } })}
          >
            <ArrowLeft size={13} /> Business Profile
          </button>
          <div className="cs-head-main">
            <div className="cs-head-agent">
              <AvaAvatar />
              <div>
                <div className="cs-head-eyebrow">{AVA_IDENTITY.name} · {AVA_IDENTITY.role}</div>
                <h1 className="cs-head-title">Build your capability statement</h1>
              </div>
            </div>
            <p className="cs-head-sub">
              I'll draft a one-page capability statement from your business profile
              and knowledge base — never from thin air. You review every section
              before it's done.
            </p>
          </div>
        </header>

        {pendingRefresh && (
          <div className="cs-honesty" role="note">
            <Sparkles size={12} />
            You just added {pendingRefresh.triggerLabel}. Check the facts below, then draft a fresh capability statement.
          </div>
        )}

        <BuilderStepper current={step} />

        {step === 1 && (
          <section className="cs-panel">
            <header className="cs-panel-head">
              <h2>Here's what I'll use</h2>
              <p>
                These are the facts I'll draw on. If something's missing, the
                section gets left out — I never invent details about your
                business.
              </p>
            </header>
            <SourceFactsList
              member={member}
              knowledge={files}
              overrides={overrides}
              onOverrideChange={handleOverrideChange}
              confirmed={confirmed}
              onConfirmedChange={handleConfirmedChange}
            />
            <div className="cs-honesty">
              <ShieldCheck size={12} />
              We only use what you connect, upload, or enter — nothing else.
            </div>
            <div className="cs-actions">
              <Link
                to="/business-profile"
                search={{ tab: "knowledge" }}
                className="cs-btn-ghost"
              >
                Add to my knowledge first
              </Link>
              <button type="button" className="cs-btn-primary" onClick={() => void handleGenerate()}>
                Draft my capability statement <ArrowRight size={13} />
              </button>
            </div>
          </section>
        )}

        {step === 2 && (
          <section className="cs-panel cs-panel--generating">
            <div className="cs-generating">
              <Loader2 size={22} className="cs-spin" />
              <div>
                <div className="cs-generating-title">Ava is drafting…</div>
                <div className="cs-generating-sub">
                  Pulling your profile facts, past performance, and source files
                  into a one-page layout.
                </div>
              </div>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="cs-review">
            <div className="cs-review-grid">
              <div className="cs-review-edit">
                <header className="cs-review-edit-head">
                  <h2>Review & edit</h2>
                  <p>
                    Edit any section inline. Use <em>Regenerate</em> for a fresh
                    take or <em>Make concise</em> to tighten it.
                  </p>
                </header>
                {draft.sections.map((s) => (
                  <SectionEditor
                    key={s.id}
                    section={s}
                    onChange={(body) => updateSection(s.id, body)}
                    onRegenerate={() => updateSection(s.id, regenerateSection(s.id, member))}
                    onConcise={() => updateSection(s.id, conciseSection(s.body))}
                  />
                ))}
              </div>
              <aside className="cs-review-preview">
                <div className="cs-preview-label">
                  <Sparkles size={11} /> Live preview
                </div>
                <CapStatementDocument draft={draft} />
              </aside>
            </div>
            <div className="cs-actions cs-actions--sticky">
              <button type="button" className="cs-btn-ghost" onClick={() => setStep(1)}>
                <ArrowLeft size={12} /> Back to sources
              </button>
              <button type="button" className="cs-btn-primary" onClick={() => setStep(4)}>
                Looks good — export <ArrowRight size={13} />
              </button>
            </div>
          </section>
        )}

        {step === 4 && (
          <section className="cs-panel">
            <header className="cs-panel-head">
              <h2>Export & save</h2>
              <p>
                Download a copy for buyers, and save it to your business
                knowledge so Hunter and Grant can cite it later.
              </p>
            </header>

            <div className="cs-preview-wrap">
              <CapStatementDocument draft={draft} />
            </div>

            <div className="cs-export-actions">
              <button
                type="button"
                className="cs-btn-ghost"
                disabled={busyFile !== null}
                onClick={() => void handleDownload("pdf")}
              >
                <Download size={13} /> {busyFile === "pdf" ? "Preparing…" : "Download PDF"}
              </button>
              <button
                type="button"
                className="cs-btn-ghost"
                disabled={busyFile !== null}
                onClick={() => void handleDownload("docx")}
              >
                <Download size={13} /> {busyFile === "docx" ? "Preparing…" : "Download DOCX"}
              </button>
              {saved ? (
                <button type="button" className="cs-btn-primary is-saved" disabled>
                  <Check size={13} /> Saved to your knowledge base
                </button>
              ) : (
                <button type="button" className="cs-btn-primary" onClick={handleSave}>
                  <Save size={13} /> Save to my knowledge base
                </button>
              )}
            </div>

            {saved && (
              <div className="cs-saved-note">
                <Check size={13} /> Saved. Hunter and Grant can now cite this on
                every match — and your <strong>Capability Statement</strong>{" "}
                step is marked complete.{" "}
                <Link to="/business-profile" search={{ tab: "knowledge" }} className="cs-fact-link">
                  See it in your knowledge base
                </Link>
                .
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
