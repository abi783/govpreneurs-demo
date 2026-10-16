import { useMemo, useState } from "react";
import { X, Mail, CheckCircle2, Copy } from "lucide-react";
import type { GovBuyer, BuyerOfficer } from "@/lib/mock/governmentBuyers";
import { logBuyerOutreach } from "@/lib/outreachLog";
import { PERSONA } from "@/demo/story/persona";

function defaultIntro(buyer: GovBuyer, officer: BuyerOfficer): string {
  return `Subject: Introduction — ${PERSONA.businessName} (WOSB, ${PERSONA.hqCity})

Dear ${officer.name},

My name is ${PERSONA.ownerName}. I'm the ${PERSONA.ownerTitle.toLowerCase()} of ${PERSONA.businessName}, a ${PERSONA.hqCity}-based, woman-owned small business (NAICS ${PERSONA.primaryNaics}). We cook and deliver up to 1,100 meals a day from our commercial kitchen, and we'd like to be on your radar for upcoming food service work at ${buyer.name}.

In short:
  • WOSB · Small Business · ${PERSONA.hqCity}-local
  • Food service focus: dining facility support, event catering, therapeutic diets (renal, diabetic, pureed)
  • Past work: Womack Army Medical Center patient meals, Fort Bragg dining facilities (as a subcontractor), Cumberland County Schools summer meals
  • Typical job size: $120K–$750K
  • SAM-registered (UEI ${PERSONA.uei}, CAGE ${PERSONA.cage}), ${PERSONA.foodHandlerCertified} ServSafe-certified staff, two refrigerated vans

I've attached our capability statement. If there's a better person to speak with about ${buyer.location} food service work — or an upcoming industry day you'd recommend we attend — I'd be grateful for the pointer.

Thank you for your time,
${PERSONA.ownerName}
${PERSONA.businessName}
${PERSONA.email} · ${PERSONA.phone}`;
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
    } catch {
      // DEMO: a browser may refuse clipboard access. The text is on screen, so say so anyway.
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
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
              <Mail size={12} /> Send intro
            </button>
          </footer>
        ) : (
          <footer className="buyer-modal-foot buyer-modal-foot--done">
            <CheckCircle2 size={14} className="ok" />
            <span className="t-body-sm">
              {sent === "lead"
                ? "Intro sent. If you do not hear back, follow up in 7 days."
                : "Saved to your outreach list. Send it when you are ready."}
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
