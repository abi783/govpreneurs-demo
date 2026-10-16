import { useMemo, useState } from "react";
import { X, Mail, CheckCircle2, Copy } from "lucide-react";
import type { GovBuyer, BuyerOfficer } from "@/lib/mock/governmentBuyers";
import { logBuyerOutreach } from "@/lib/outreachLog";

function defaultIntro(buyer: GovBuyer, officer: BuyerOfficer): string {
  const first = officer.name.split(" ").slice(-1)[0]; // last name
  return `Subject: Introduction — Williams Construction LLC (SDVOSB, Fayetteville)

Dear ${officer.role === "Small-Business Liaison" ? "Ms./Mr." : "Contracting Officer"} ${first},

My name is Marcus Williams. I'm the owner of Williams Construction LLC, a Fayetteville-based, SDVOSB-certified roofing contractor (NAICS 238160). We've completed re-roofing and envelope work on commercial and county buildings across Cumberland and Robeson counties, and we'd like to be on your radar for upcoming projects at ${buyer.name}.

In short:
  • SDVOSB · Small Business · Fayetteville-local
  • Roofing focus: modified bitumen, TPO, standing-seam metal, shingle
  • Typical job size: $150K–$800K
  • UEI / SAM-registered, bonded, EMR < 1.0

I've attached our capability statement. If there's a better person to speak with about ${buyer.location} roofing work — or an upcoming pre-bid you'd recommend we sit in on — I'd be grateful for the pointer.

Thank you for your time,
Marcus Williams
Williams Construction LLC
marcus@williamsconstruction.example · 910-555-0142`;
}

export function DraftIntroModal({
  buyer,
  officer,
  onClose,
}: {
  buyer: GovBuyer;
  officer: BuyerOfficer;
  onClose: () => void;
}) {
  const initial = useMemo(() => defaultIntro(buyer, officer), [buyer, officer]);
  const [text, setText] = useState(initial);
  const [sent, setSent] = useState<"none" | "saved" | "lead">("none");
  const [copied, setCopied] = useState(false);

  function logOutreach(kind: "saved" | "lead") {
    logBuyerOutreach({
      buyerId: buyer.id,
      officerId: officer.id,
      kind,
      at: new Date().toISOString(),
    });
    setSent(kind);
  }

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  }

  return (
    <div className="buyer-modal-scrim" role="dialog" aria-modal="true" aria-label="Draft introduction">
      <div className="buyer-modal">
        <header className="buyer-modal-head">
          <div>
            <div className="t-label">Draft the intro</div>
            <h3 className="t-heading" style={{ marginTop: 4 }}>
              To {officer.name} · {officer.role}
            </h3>
            <p className="t-caption" style={{ marginTop: 2 }}>
              {buyer.name} · pre-filled with your business details. Edit before sending.
            </p>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" aria-label="Close" onClick={onClose}>
            <X size={14} />
          </button>
        </header>

        <textarea
          className="buyer-modal-textarea"
          value={text}
          onChange={(e) => setText(e.target.value)}
          spellCheck
          aria-label="Intro message"
        />

        {sent === "none" ? (
          <footer className="buyer-modal-foot">
            <button type="button" className="btn btn-ghost btn-sm" onClick={copyToClipboard}>
              <Copy size={12} /> {copied ? "Copied" : "Copy text"}
            </button>
            <div style={{ flex: 1 }} />
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => logOutreach("saved")}>
              Save as outreach task
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={() => logOutreach("lead")}>
              <Mail size={12} /> Send (mock)
            </button>
          </footer>
        ) : (
          <footer className="buyer-modal-foot buyer-modal-foot--done">
            <CheckCircle2 size={14} className="ok" />
            <span className="t-body-sm">
              {sent === "lead"
                ? "Logged as a sent intro. We'll surface a follow-up reminder in 7 days."
                : "Saved as a task. It will show up in Tasks under buyer outreach."}
            </span>
            <div style={{ flex: 1 }} />
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Done
            </button>
          </footer>
        )}
      </div>
    </div>
  );
}
