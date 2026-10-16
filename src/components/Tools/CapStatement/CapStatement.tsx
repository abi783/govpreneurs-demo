import { useEffect, useState } from "react";
import { Eye, FileText } from "lucide-react";
import { ToolRail } from "@/components/Tools/ToolRail";
import { isEmbedMode, useEmbedBridge } from "@/lib/tools/embed";
import { postToolResultFireAndForget } from "@/lib/tools/results";
import {
  CAPSTMT_DEFAULTS,
  CAPSTMT_STEPS,
  getEffective,
  isFormEmpty,
  loadCapStmtState,
  loadCapStmtTemplate,
  saveCapStmtState,
  saveCapStmtTemplate,
  type CapStmtState,
  type CapStmtTemplate,
} from "@/lib/tools/capStatement.types";
import { CapStatementForm } from "./CapStatementForm";
import { CapStatementPreview } from "./CapStatementPreview";
import "./cap-statement.css";

type View = "form" | "preview";

export function CapStatement() {
  const [state, setState] = useState<CapStmtState>(
    () => loadCapStmtState() || { ...CAPSTMT_DEFAULTS },
  );
  const [template, setTemplate] = useState<CapStmtTemplate>(
    () => loadCapStmtTemplate() || "classic",
  );
  const [view, setView] = useState<View>("form");
  const [step, setStep] = useState(0);

  useEmbedBridge(view === "preview" ? "result" : "input");

  const updateState = (patch: Partial<CapStmtState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      saveCapStmtState(next);
      return next;
    });
  };

  const onLogoUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      updateState({ logoDataUrl: String(reader.result), logoName: file.name });
    };
    reader.readAsDataURL(file);
  };

  const onReset = () => {
    if (!window.confirm("Clear all fields and start over?")) return;
    const next = { ...CAPSTMT_DEFAULTS };
    setState(next);
    saveCapStmtState(next);
    setStep(0);
  };

  const onTemplateChange = (tpl: CapStmtTemplate) => {
    setTemplate(tpl);
    saveCapStmtTemplate(tpl);
  };

  const goGenerate = () => {
    setView("preview");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    if (view === "preview") {
      const P = getEffective(state);
      postToolResultFireAndForget({
        tool: "capability-statement",
        title: P.legalName || P.dba || "Capability statement generated",
        summary: `Template: ${template}`,
        data: { template, isSample: isFormEmpty(state) },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const main = (
    <div className="cs tool-main">
      <h1 className="tool-page-title">Free capability statement builder</h1>
      <p
        className="t-body"
        style={{ color: "var(--n-9)", marginTop: "var(--s-2)", marginBottom: "var(--s-5)" }}
      >
        Fill in your business details and generate a one-page capability statement, ready to share
        with government buyers.
      </p>

      <div className="cs-tabs">
        <button
          type="button"
          className={`cs-tab${view === "form" ? " active" : ""}`}
          onClick={() => setView("form")}
        >
          <FileText size={16} aria-hidden /> Form
        </button>
        <button
          type="button"
          className={`cs-tab${view === "preview" ? " active" : ""}`}
          onClick={() => setView("preview")}
        >
          <Eye size={16} aria-hidden /> Preview
        </button>
      </div>

      {view === "form" && (
        <div>
          <CapStatementForm
            state={state}
            onChange={updateState}
            onLogoUpload={onLogoUpload}
            onReset={onReset}
            step={step}
            onStepChange={(i) => setStep(Math.max(0, Math.min(CAPSTMT_STEPS.length - 1, i)))}
            onGenerate={goGenerate}
          />
          <p className="cs-disclaimer">
            <strong>Tool only — not legal or procurement advice.</strong> This builder formats your
            inputs into a PDF. GovPreneurs LLC does not verify the accuracy of the content you
            enter. Ensure all certifications, NAICS codes, and credentials match your official
            SAM.gov record before sharing with government buyers.
          </p>
        </div>
      )}

      {view === "preview" && (
        <div>
          <CapStatementPreview
            state={state}
            template={template}
            onTemplateChange={onTemplateChange}
          />
          <p className="cs-disclaimer">
            <strong>Tool only — not legal or procurement advice.</strong> GovPreneurs LLC makes no
            warranties about the content of generated documents. Verify all information against your
            SAM.gov record before using publicly.
          </p>
        </div>
      )}
    </div>
  );

  if (isEmbedMode()) return main;

  return (
    <div className="tool-layout">
      {main}
      <ToolRail
        bullets={[
          "A one-page capability statement generated from your details",
          "Three ready-made templates — download as a PDF",
          "Your entries are saved on this device",
        ]}
        lastResult={
          view === "preview"
            ? {
                title: getEffective(state).legalName || "Capability statement",
                createdAt: new Date().toISOString(),
              }
            : null
        }
        crossLinks={[
          { label: "Registration checklist", to: "/tools/registration-checklist", external: true },
          { label: "HUBZone map", to: "/tools/hubzone", external: true },
        ]}
      />
    </div>
  );
}
