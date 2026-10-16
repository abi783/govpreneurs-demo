import { useState } from "react";
import { Check, Mail } from "lucide-react";
import { LeadGate } from "@/components/Tools/LeadGate";
import { getToolsToken, postResult, type LeadPayload } from "@/lib/tools/api";

interface EmailChecklistCtaProps {
  tool: string;
  title: string;
  summary: string;
  data: unknown;
  /** Defaults to "checklist". HUBZone uses its own gate source. */
  source?: LeadPayload["source"];
  /** Button label. Defaults to "Email me this checklist". */
  label?: string;
  /** Confirmation copy after a signed-in save that also emailed a link.
   *  Defaults to the shared "Sent" copy. */
  savedLabel?: string;
  /** Confirmation copy when the save succeeded but no email went out
   *  (emailed:false — e.g. the GHL workflow isn't configured yet). */
  savedOnlyLabel?: string;
}

/**
 * Shared "Email me this checklist" / "Send me the steps" action for the two
 * checklist tools and HUBZone. Signed out: opens the LeadGate inline. Signed
 * in: saves the current state via /public/tools/results with notify:true,
 * which — for these three tools, when TOOLS_SAVED_GHL_WORKFLOW_ID is set —
 * triggers a GHL workflow that emails the saved link. `emailed:false` in the
 * response (e.g. workflow id unset) falls back to "Saved to your account".
 */
export function EmailChecklistCta({
  tool,
  title,
  summary,
  data,
  source = "checklist",
  label = "Email me this checklist",
  savedLabel = "Sent — check your inbox for the link.",
  savedOnlyLabel = "Saved to your account.",
}: EmailChecklistCtaProps) {
  const [gateOpen, setGateOpen] = useState(false);
  const [result, setResult] = useState<"emailed" | "saved" | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (saving || result) return;
    setSaving(true);
    setError(null);
    try {
      const res = await postResult({ tool, title, summary, data, notify: true });
      setResult(res.emailed ? "emailed" : "saved");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save — try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleClick = () => {
    if (getToolsToken()) {
      void save();
      return;
    }
    setGateOpen(true);
  };

  if (result) {
    return (
      <p className="t-body-sm tool-unlocked-toast">
        <Check size={14} aria-hidden style={{ verticalAlign: "-2px", marginRight: "var(--s-1)" }} />
        {result === "emailed" ? savedLabel : savedOnlyLabel}
      </p>
    );
  }

  return (
    <div style={{ marginTop: "var(--s-4)" }}>
      <button
        type="button"
        className="btn btn-brand tool-email-cta-btn"
        onClick={handleClick}
        disabled={saving}
      >
        <Mail size={16} aria-hidden /> {saving ? "Sending…" : label}
      </button>
      {error && (
        <p className="t-body-sm" style={{ color: "var(--urg-7)", marginTop: "var(--s-2)" }}>
          {error}
        </p>
      )}
      {gateOpen && (
        <div className="tool-inline-gate">
          <LeadGate
            source={source}
            context={{}}
            onUnlocked={() => {
              setGateOpen(false);
              void save();
            }}
          />
        </div>
      )}
    </div>
  );
}
