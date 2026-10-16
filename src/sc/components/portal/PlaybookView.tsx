"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Card } from "@sc/components/ui/Card";
import type { ActivePlaybook } from "@sc/types/portal";

interface PlaybookViewProps {
  playbook: ActivePlaybook;
  locationId?: string;
  /**
   * Open on arrival and scroll to it. Set when the member followed a link that
   * named this plan — a task row pointing at the step it came from.
   *
   * Plans are collapsed by default, so a link that only lands on the page
   * leaves the reader looking at a closed card with a title they have already
   * read. Arriving at the thing you asked for is the whole point of the link.
   */
  autoOpen?: boolean;
}

/** DOM id for a plan, so a link can name one. Shared with the page that reads
 *  the query parameter, rather than spelled out in two places. */
export function planAnchorId(assignmentId: string): string {
  return `plan-${assignmentId}`;
}

/**
 * Render either Markdown OR HTML depending on a cheap heuristic — content
 * starting with `<` is treated as HTML output from the admin rich text
 * editor; everything else stays Markdown so legacy entries keep rendering
 * correctly. No schema migration required.
 */
function ContentBlock({ content, className }: { content: string; className?: string }) {
  if (!content) return null;
  const isHtml = content.trim().startsWith("<");
  if (isHtml) {
    return (
      <div
        className={`md-content rte-content ${className ?? ""}`}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }
  return (
    <div className={`md-content ${className ?? ""}`}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}

export function PlaybookView({ playbook, locationId, autoOpen = false }: PlaybookViewProps) {
  const { steps } = playbook;
  // Local copy of stepStatuses so the checkbox updates optimistically.
  const [statuses, setStatuses] = useState<Record<string, string>>(playbook.stepStatuses ?? {});
  // Keep in sync if the server-rendered prop changes (e.g. on revalidate).
  useEffect(() => { setStatuses(playbook.stepStatuses ?? {}); }, [playbook.stepStatuses]);
  // Member-uploaded PDFs per step (mentor enabled the upload on the step).
  const [uploads, setUploads] = useState<ActivePlaybook["stepUploads"]>(playbook.stepUploads ?? {});
  useEffect(() => { setUploads(playbook.stepUploads ?? {}); }, [playbook.stepUploads]);
  const [uploadingStepId, setUploadingStepId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function uploadPdf(stepId: string, file: File) {
    if (!locationId) return;
    setUploadingStepId(stepId);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.set("assignmentId", playbook.assignmentId);
      fd.set("stepId", stepId);
      fd.set("file", file);
      const r = await fetch(`/api/portal/${locationId}/playbook-upload`, { method: "POST", body: fd });
      const data = await r.json().catch(() => null);
      if (!r.ok) throw new Error(data?.error ?? `HTTP ${r.status}`);
      if (data?.stepUploads) setUploads(data.stepUploads as ActivePlaybook["stepUploads"]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingStepId(null);
    }
  }

  const completedCount = steps.filter((s) => statuses[s.id] === "completed").length;
  const isComplete = steps.length > 0 && completedCount === steps.length;
  /* COLLAPSED UNLESS THE MEMBER ASKED FOR THIS ONE. A page holding several
     plans must not open all of them, and a link that names one must not land
     the reader on a closed card showing a title they have already read. */
  const [open, setOpen] = useState(autoOpen);

  useEffect(() => {
    if (!autoOpen) return;
    setOpen(true);
    // Located by id rather than a ref: `Card` spreads props onto its div but
    // does not forward a ref, and the id has to exist for the anchor anyway.
    const el = document.getElementById(planAnchorId(playbook.assignmentId));
    // `start`, not the default, so the plan's own heading is what the reader
    // lands on rather than its middle.
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [autoOpen, playbook.assignmentId]);

  async function toggleStep(stepId: string) {
    if (!locationId) return;
    const wasDone = statuses[stepId] === "completed";
    const next = { ...statuses };
    if (wasDone) delete next[stepId];
    else next[stepId] = "completed";
    setStatuses(next); // optimistic
    try {
      const r = await fetch(`/api/portal/${locationId}/playbooks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: playbook.assignmentId,
          stepId,
          checked: !wasDone,
        }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      if (data?.stepStatuses) setStatuses(data.stepStatuses as Record<string, string>);
    } catch {
      // Roll back on failure so the UI never lies about server state.
      setStatuses((s) => {
        const back = { ...s };
        if (wasDone) back[stepId] = "completed"; else delete back[stepId];
        return back;
      });
    }
  }

  return (
    <Card
      variant="gold"
      id={planAnchorId(playbook.assignmentId)}
      className={open ? "p-6" : "overflow-hidden"}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center gap-3 text-left hover:bg-white/[0.02] transition-colors duration-200 cursor-pointer ${open ? "mb-5" : "p-4"}`}
        aria-expanded={open}
      >
        <div className="w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--gold-glow)", border: "1px solid rgba(180,151,90,0.3)" }}>
          <svg className="w-4.5 h-4.5 text-[var(--gold)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[0.95rem] font-extrabold text-white">{playbook.title}</div>
          <div className="text-[0.72rem] text-[var(--text-muted)]">
            {isComplete
              ? `All ${steps.length} steps complete`
              : `${completedCount} of ${steps.length} steps complete`}
          </div>
        </div>
        <svg
          className={`w-4 h-4 text-[var(--text-muted)] transition-transform duration-250 flex-shrink-0 ${open ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && playbook.description && (
        <ContentBlock
          content={playbook.description}
          className="text-[0.8rem] text-[var(--text-secondary)] leading-relaxed mb-5"
        />
      )}

      {open && playbook.sourceDocUrl && (
        <a
          href={playbook.sourceDocUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block mb-5 text-[0.72rem] font-semibold text-[var(--green-text)] hover:underline"
        >
          📎 {playbook.sourceDocName ?? "Download the full plan"}
        </a>
      )}

      {open && <div className="flex flex-col gap-2">
        {steps.map((step) => {
          const isDone = statuses[step.id] === "completed";

          return (
            <div
              key={step.id}
              className={`flex flex-col gap-2 px-3.5 py-3 rounded-[var(--radius-sm)] border ${
                isDone
                  ? "bg-white/[0.02] border-white/[0.04]"
                  : "bg-white/[0.02] border-white/[0.04]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => toggleStep(step.id)}
                  aria-label={isDone ? "Mark step incomplete" : "Mark step complete"}
                  className={`w-5.5 h-5.5 rounded-md flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer ${
                    isDone ? "" : "hover:bg-[var(--glass-border)]"
                  }`}
                  style={{
                    background: isDone ? "var(--green-mid)" : "var(--bg-3)",
                    border: isDone ? "1px solid var(--green-mid)" : "1px solid var(--text-muted)",
                    minWidth: "22px", minHeight: "22px",
                  }}
                >
                  {isDone && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>

                <span className={`text-[0.82rem] font-semibold ${
                  isDone ? "text-[var(--text-muted)] line-through" : "text-white"
                }`}>
                  {step.title}
                </span>
              </div>

              {step.content && (
                <ContentBlock
                  content={step.content}
                  className="text-[0.76rem] text-[var(--text-secondary)] leading-relaxed pl-8"
                />
              )}

              {(step.videoUrl || step.resourceUrl || step.attachmentUrl) && (
                <div className="flex items-center gap-3 pl-8 flex-wrap">
                  {step.videoUrl && (
                    <a
                      href={step.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[0.7rem] font-semibold text-[var(--green-text)] hover:underline"
                    >
                      ▶ Watch video
                    </a>
                  )}
                  {step.resourceUrl && (
                    <a
                      href={step.resourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[0.7rem] font-semibold text-[var(--gold-light)] hover:underline"
                    >
                      🔗 Open resource
                    </a>
                  )}
                  {step.attachmentUrl && (
                    <a
                      href={step.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[0.7rem] font-semibold text-[var(--gold-light)] hover:underline"
                    >
                      📎 {step.attachmentName ?? "Attachment (PDF)"}
                    </a>
                  )}
                </div>
              )}

              {step.allowMemberUpload && (
                <div className="flex items-center gap-3 pl-8 flex-wrap">
                  {uploads[step.id] && (
                    <a
                      href={uploads[step.id].url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[0.7rem] font-semibold text-[var(--green-text)] hover:underline"
                    >
                      📄 Your upload: {uploads[step.id].name}
                    </a>
                  )}
                  <label
                    className="text-[0.7rem] font-semibold cursor-pointer px-2.5 py-1 rounded-md border border-[var(--glass-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.04]"
                  >
                    {uploadingStepId === step.id ? "Uploading…" : uploads[step.id] ? "Replace PDF" : "⬆ Upload PDF"}
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      disabled={uploadingStepId === step.id}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) uploadPdf(step.id, f);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  {uploadError && uploadingStepId === null && (
                    <span className="text-[0.68rem] text-red-400">{uploadError}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>}
    </Card>
  );
}
