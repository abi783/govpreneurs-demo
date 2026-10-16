import { useEffect, useMemo, useState } from "react";
import {
  createFileRoute,
  Link,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ExternalLink,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { usePageMeta } from "../components/Layout/page-meta";
import {
  computeStatus,
  completeRenewal,
  formatDueLine,
  getItem,
  startRenewal,
  statusChip,
  toggleWorkflowStep,
  useStayReady,
} from "../lib/stayReady";

interface SRSearch {
  mode?: "self" | "dfy";
}

export const Route = createFileRoute("/stay-ready/$itemId")({
  validateSearch: (search: Record<string, unknown>): SRSearch => {
    const m = search.mode === "self" || search.mode === "dfy" ? search.mode : undefined;
    return { mode: m };
  },
  head: () => ({
    meta: [
      { title: "Stay Ready — Renewal · GovPreneurs" },
      {
        name: "description",
        content: "Renew a tracked obligation step-by-step.",
      },
    ],
  }),
  component: StayReadyItemPage,
});

function StayReadyItemPage() {
  usePageMeta({});
  const { itemId } = Route.useParams();
  const { mode } = useSearch({ from: "/stay-ready/$itemId" });
  const navigate = useNavigate();
  const items = useStayReady();
  const item = useMemo(() => items.find((i) => i.id === itemId) ?? getItem(itemId), [items, itemId]);
  const [confirmationNumber, setConfirmationNumber] = useState("");
  const [done, setDone] = useState(false);

  // If a `mode` is in the URL and no workflow yet, start it.
  useEffect(() => {
    if (item && !item.workflow && mode) {
      startRenewal(item.id, mode);
    }
  }, [item?.id, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!item) {
    return (
      <div className="sr-page">
        <p>Item not found.</p>
        <Link to="/business-profile" search={{ tab: "stay-ready" }}>Back to Stay Ready</Link>
      </div>
    );
  }

  const status = computeStatus(item);
  const chip = statusChip(status);
  const wf = item.workflow;
  const allStepsDone = wf?.steps.every((s) => s.done) ?? false;

  function handleComplete() {
    if (!confirmationNumber.trim()) return;
    completeRenewal(item!.id, confirmationNumber.trim());
    setDone(true);
  }

  return (
    <div className="sr-page">
      <button
        type="button"
        className="cs-back"
        onClick={() => navigate({ to: "/business-profile", search: { tab: "stay-ready" } })}
      >
        <ArrowLeft size={13} /> Stay Ready
      </button>

      <header className="sr-page-head">
        <div className="sr-page-eyebrow">
          <ShieldCheck size={12} /> Renewal
        </div>
        <h1 className="sr-page-title">{item.name}</h1>
        <div className="sr-page-meta">
          <span className={`sr-chip sr-chip--${chip.tone}`}>{chip.label}</span>
          <span>Your {item.shortName} {formatDueLine(item)}.</span>
        </div>
        <p className="sr-page-stakes">
          <strong>Why this matters:</strong> {item.stakes}
        </p>
      </header>

      {done ? (
        <section className="sr-done-panel">
          <div className="sr-done-icon"><Check size={22} strokeWidth={2.5} /></div>
          <h2>Renewed.</h2>
          <p>
            Confirmation saved to your knowledge base. We'll start the clock
            again — next reminder will be a calm one, way ahead of the new
            expiry.
          </p>
          <div className="sr-done-actions">
            <Link
              to="/business-profile"
              search={{ tab: "stay-ready" }}
              className="sr-btn-primary"
            >
              Back to Stay Ready <ArrowRight size={12} />
            </Link>
            <Link
              to="/business-profile"
              search={{ tab: "knowledge" }}
              className="sr-btn-secondary"
            >
              See it in your knowledge base
            </Link>
          </div>
        </section>
      ) : wf?.mode === "dfy" ? (
        <section className="sr-workflow-panel">
          <header className="sr-workflow-head">
            <Sparkles size={14} />
            <div>
              <h2>We're handling it.</h2>
              <p>
                You don't need to do anything. We'll text and email you the
                moment your confirmation comes back.
              </p>
            </div>
          </header>
          <ol className="sr-steps sr-steps--dfy">
            {wf.steps.map((s, i) => (
              <li key={i} className={`sr-step ${s.done ? "is-done" : ""}`}>
                <span className="sr-step-bullet">{s.done ? <Check size={12} /> : i + 1}</span>
                <span className="sr-step-label">{s.label}</span>
              </li>
            ))}
          </ol>
          <div className="sr-workflow-foot">
            <button
              type="button"
              className="sr-btn-ghost"
              onClick={() => {
                // Demo: mark every step done, then prompt for confirmation
                wf.steps.forEach((s, i) => { if (!s.done) toggleWorkflowStep(item.id, i); });
                window.setTimeout(() => {
                  completeRenewal(item.id, `GP-${Date.now().toString().slice(-6)}`);
                  setDone(true);
                }, 400);
              }}
            >
              Demo · mark complete
            </button>
          </div>
        </section>
      ) : (
        <section className="sr-workflow-panel">
          <header className="sr-workflow-head">
            <div>
              <h2>Renew it yourself</h2>
              <p>
                Walk through these steps. When you've got your confirmation
                number, paste it below and we'll save it to your knowledge
                base.
              </p>
            </div>
            {item.govLink && (
              <a
                href={item.govLink}
                target="_blank"
                rel="noreferrer"
                className="sr-gov-link"
              >
                Open {new URL(item.govLink).hostname} <ExternalLink size={12} />
              </a>
            )}
          </header>
          <ol className="sr-steps">
            {(wf?.steps ?? []).map((s, i) => (
              <li key={i} className={`sr-step ${s.done ? "is-done" : ""}`}>
                <label className="sr-step-check">
                  <input
                    type="checkbox"
                    checked={s.done}
                    onChange={() => toggleWorkflowStep(item.id, i)}
                  />
                  <span className="sr-step-bullet">
                    {s.done ? <Check size={12} /> : i + 1}
                  </span>
                  <span className="sr-step-label">{s.label}</span>
                </label>
              </li>
            ))}
          </ol>

          <div className="sr-confirm-block">
            <label htmlFor="sr-conf" className="sr-confirm-label">
              Confirmation number
            </label>
            <input
              id="sr-conf"
              className="sr-confirm-input"
              type="text"
              placeholder="e.g. SAM-2026-04-15-A8F2"
              value={confirmationNumber}
              onChange={(e) => setConfirmationNumber(e.target.value)}
              disabled={!allStepsDone}
            />
            <button
              type="button"
              className="sr-btn-primary"
              disabled={!allStepsDone || !confirmationNumber.trim()}
              onClick={handleComplete}
            >
              Mark renewed <Check size={12} />
            </button>
            {!allStepsDone && (
              <p className="sr-confirm-hint">
                Finish the steps above first.
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
