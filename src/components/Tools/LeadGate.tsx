import { useState } from "react";
import { SignInPanel } from "@/components/Tools/SignInPanel";
import { postLead, type LeadPayload } from "@/lib/tools/api";
import { useToolsAnalytics } from "@/lib/tools/analytics";

interface LeadGateProps {
  source: LeadPayload["source"];
  context: Omit<LeadPayload, "source" | "consent">;
  onUnlocked: () => void;
}

const BUTTON_LABELS: Record<LeadPayload["source"], string> = {
  demand: "Email me my snapshot",
  naics: "Email me my snapshot",
  scorecard: "Email me my readiness report",
  account: "Send me a code",
  capstatement: "Send me the code",
  checklist: "Send me the code",
  hubzone: "Send me the code",
};

// The gate sells the payoff, never "Sign in" — nobody wants an account, they
// want the report.
const TITLES: Record<LeadPayload["source"], string> = {
  demand: "Get your full snapshot — free",
  naics: "Get your full snapshot — free",
  scorecard: "Get your full readiness report — free",
  account: "Sign in",
  capstatement: "Get your PDF — free",
  checklist: "Get your checklist — free",
  hubzone: "Get your certification steps — free",
};

// Only the NAICS-anchored sources have a code to send a weekly count for.
const NAICS_ANCHORED: ReadonlySet<LeadPayload["source"]> = new Set([
  "demand",
  "naics",
  "scorecard",
]);

export function LeadGate({ source, context, onUnlocked }: LeadGateProps) {
  const [consent, setConsent] = useState(false);
  const track = useToolsAnalytics();

  return (
    <div
      style={{
        marginTop: "var(--s-4)",
        padding: "var(--s-4)",
        border: "1px solid var(--n-5)",
        borderRadius: "var(--r-md)",
      }}
    >
      <SignInPanel
        title={TITLES[source]}
        emailButtonLabel={BUTTON_LABELS[source]}
        onUnlocked={onUnlocked}
        onEmailSubmitted={() => track("tools_email_submitted", { tool: source })}
        onCodeVerified={() => track("tools_code_verified", { tool: source })}
        onTokenIssued={async () => {
          try {
            await postLead({ source, ...context, consent });
          } catch {
            /* lead capture is best-effort; do not block unlocking the report on it */
          }
        }}
        belowEmailField={
          NAICS_ANCHORED.has(source) ? (
            <label
              className="t-body-sm"
              style={{ display: "flex", alignItems: "flex-start", gap: "var(--s-2)" }}
            >
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                style={{ marginTop: 2 }}
              />
              <span>
                Email me a weekly count of new postings in my code (you can unsubscribe any time)
              </span>
            </label>
          ) : undefined
        }
      />
    </div>
  );
}
