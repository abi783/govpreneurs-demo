import { useEffect } from "react";
import { ShieldCheck, MessageSquare, Sparkles } from "lucide-react";
import {
  computeStatus,
  useStayReady,
  useStayReadySummary,
  resetItemDemo,
} from "../../lib/stayReady";
import { useSMSOutbox } from "../../lib/mockSMS";
import { useKnowledge, attachFile, getKnowledge } from "../../lib/knowledgeBase";
import { primeSeen, scanForFreshness } from "../../lib/capStatementFreshness";
import { StayReadyItemRow } from "./StayReadyItemRow";

export function StayReadyOverview() {
  const items = useStayReady();
  const summary = useStayReadySummary();
  const sms = useSMSOutbox();
  const { files } = useKnowledge();

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

  function simulateCert() {
    attachFile({ name: "CMMC Level 1 Certification.pdf", sizeKB: 188, mime: "pdf" });
    // Scan immediately so the prompt appears
    window.setTimeout(() => {
      scanForFreshness(getKnowledge().files);
    }, 50);
  }

  function resetDemo() {
    items.forEach((i) => resetItemDemo(i.id));
  }

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
            <span className="sr-sms-count">(demo)</span>
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
        SMS sends and filings shown here are demo.
      </footer>

      <div className="sr-demo-tools">
        <button type="button" className="sr-demo-btn" onClick={simulateCert}>
          <Sparkles size={11} /> Simulate: upload a new cert
        </button>
        <button type="button" className="sr-demo-btn" onClick={resetDemo}>
          Reset Stay Ready demo
        </button>
      </div>
    </div>
  );
}
