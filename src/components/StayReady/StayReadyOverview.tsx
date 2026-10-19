import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldCheck, MessageSquare, Upload } from "lucide-react";
import {
  computeStatus,
  useStayReady,
  useStayReadySummary,
  useSmsOutbox,
} from "../../lib/stayReady";
import { useKnowledge, attachUploadedFile, markFileRead, getKnowledge } from "../../lib/knowledgeBase";
import { primeSeen, scanForFreshness, usePendingRefresh } from "../../lib/capStatementFreshness";
import { wait } from "../../demo/profile/delay";
import { StayReadyItemRow } from "./StayReadyItemRow";
import { useFileChooser } from "../../demo/profile/useFileChooser";

export function StayReadyOverview() {
  const items = useStayReady();
  const summary = useStayReadySummary();
  const sms = useSmsOutbox();
  const { files } = useKnowledge();
  const pending = usePendingRefresh();

  // Prime "seen" so existing knowledge sources don't trigger refresh prompts.
  useEffect(() => {
    primeSeen(files);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sorted = [...items].sort((a, b) => {
    const order = ["overdue", "urgent", "due_soon", "in_progress", "upcoming", "ok", "done"];
    const sa = order.indexOf(computeStatus(a));
    const sb = order.indexOf(computeStatus(b));
    if (sa !== sb) return sa - sb;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  // DEMO: a real upload. Any file is accepted, listed in the knowledge base, and
  // checked for a capability statement refresh prompt.
  const chooser = useFileChooser(
    async (list) => {
      for (const f of list) {
        const entry = await attachUploadedFile(f);
        await wait(900);
        markFileRead(entry.id, ["renewal date"]);
      }
      scanForFreshness(getKnowledge().files);
    },
    { multiple: true },
  );

  return (
    <div className="sr-overview">
      <header className={`sr-summary sr-summary--${summary.tone}`}>
        <div className="sr-summary-eyebrow">Stay Ready</div>
        <h2 className="sr-summary-head">{summary.headline}</h2>
        <p className="sr-summary-sub">
          We track your time-bound obligations so a lapsed registration never
          costs you work. You'll hear from us early — never the day it expires.
        </p>
      </header>

      {pending.length > 0 && (
        <section className="sr-sms-panel" aria-label="Capability statement refresh">
          <ul className="sr-sms-list">
            {pending.map((p) => (
              <li key={p.id} className="sr-sms-item">
                <div className="sr-sms-body">
                  You just added {p.triggerLabel}. Refresh your capability statement?
                </div>
                <div className="sr-sms-meta">
                  <Link to="/cap-statement/builder" search={{ refresh: p.id }} className="sr-row-link">
                    Update it now →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="sr-list">
        {sorted.map((it) => (
          <StayReadyItemRow key={it.id} item={it} />
        ))}
      </section>

      {sms.length > 0 && (
        <section className="sr-sms-panel">
          <header className="sr-sms-head">
            <MessageSquare size={13} />
            <h3>Recent text alerts</h3>
          </header>
          <ul className="sr-sms-list">
            {sms.slice(0, 5).map((m) => (
              <li key={m.id} className="sr-sms-item">
                <div className="sr-sms-meta">To {m.to}</div>
                <div className="sr-sms-body">{m.body}</div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="sr-honesty">
        <ShieldCheck size={11} />
        We track these so you don't lose work to a lapsed registration.
      </footer>

      <div className="sr-demo-tools">
        <button type="button" className="sr-demo-btn" onClick={chooser.open}>
          <Upload size={11} /> Add a new certificate or permit
        </button>
        {chooser.input}
        {chooser.choosing && (
          <span className="fr-note" role="status">
            Choose a file in the window that opened.
          </span>
        )}
      </div>
    </div>
  );
}
