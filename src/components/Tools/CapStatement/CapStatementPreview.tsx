import { useEffect, useMemo, useRef, useState } from "react";
import { FileDown } from "lucide-react";
import {
  getEffective,
  isFormEmpty,
  type CapStmtState,
  type CapStmtTemplate,
} from "@/lib/tools/capStatement.types";
import { renderTemplate } from "@/lib/tools/capStatement.render";
import { downloadCapStmtPdf } from "@/lib/tools/capStatement.pdf";
import { LeadGate } from "@/components/Tools/LeadGate";
import { getToolsToken } from "@/lib/tools/api";
import { useToolsAnalytics } from "@/lib/tools/analytics";

const TEMPLATES: { key: CapStmtTemplate; name: string; desc: string; thumbClass: string }[] = [
  {
    key: "classic",
    name: "Classic Federal",
    desc: "Bold navy header with accent stripe. Strong, traditional, recognizable.",
    thumbClass: "cs-thumb-classic",
  },
  {
    key: "modern",
    name: "Modern Split",
    desc: "Sidebar layout with company facts left, narrative right. Clean and contemporary.",
    thumbClass: "cs-thumb-modern",
  },
  {
    key: "executive",
    name: "Executive Elegant",
    desc: "Serif typography with gold accents on cream. Premium and refined.",
    thumbClass: "cs-thumb-executive",
  },
];

interface CapStatementPreviewProps {
  state: CapStmtState;
  template: CapStmtTemplate;
  onTemplateChange: (tpl: CapStmtTemplate) => void;
}

export function CapStatementPreview({
  state,
  template,
  onTemplateChange,
}: CapStatementPreviewProps) {
  const effective = getEffective(state);
  const rendered = useMemo(() => renderTemplate(effective, template), [effective, template]);
  const showSampleBadge = isFormEmpty(state);
  const [gateOpen, setGateOpen] = useState(false);
  const gateRef = useRef<HTMLDivElement>(null);
  const track = useToolsAnalytics();

  const handleDownloadClick = () => {
    if (getToolsToken()) {
      downloadCapStmtPdf(state, template);
      return;
    }
    track("tools_gate_viewed", { tool: "capstatement" });
    setGateOpen(true);
  };

  useEffect(() => {
    if (!gateOpen || !gateRef.current) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gateRef.current.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
    gateRef.current.querySelector("input")?.focus();
  }, [gateOpen]);

  return (
    <div className="cs-preview-card">
      <div className="cs-preview-head">
        <div>
          <h2 className="t-heading">PDF Preview</h2>
          <p className="t-body-sm" style={{ marginTop: "var(--s-2)" }}>
            Choose a template and see your capability statement render in real time.
          </p>
        </div>
        <button type="button" className="btn btn-brand" onClick={handleDownloadClick}>
          <FileDown size={16} aria-hidden /> Download PDF
        </button>
      </div>

      {gateOpen && (
        <div className="tool-inline-gate" ref={gateRef}>
          <LeadGate
            source="capstatement"
            context={{}}
            onUnlocked={() => {
              setGateOpen(false);
              downloadCapStmtPdf(state, template);
            }}
          />
        </div>
      )}

      <div className="cs-tpl-picker" style={{ margin: "4px 0 var(--s-5)" }}>
        <div className="t-label" style={{ marginBottom: "var(--s-2)" }}>
          Choose a Template
        </div>
        <div className="cs-tpl-grid">
          {TEMPLATES.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`cs-tpl-card${template === t.key ? " active" : ""}`}
              onClick={() => onTemplateChange(t.key)}
            >
              <div className={`cs-tpl-thumb ${t.thumbClass}`}>
                {t.key === "modern" ? (
                  <>
                    <div className="side">
                      <div />
                      <div />
                      <div />
                      <div />
                    </div>
                    <div className="main">
                      <div />
                      <div />
                      <div />
                      <div />
                      <div />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="h" />
                    <div className="s" />
                    <div className="b">
                      <div />
                      <div />
                      <div />
                      <div />
                    </div>
                    <div className="f" />
                  </>
                )}
              </div>
              <div className="cs-tpl-name">
                {t.name} <span className="cs-tpl-check">✓</span>
              </div>
              <div className="cs-tpl-desc">{t.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="cs-preview-scale-wrap">
        <div className="cs-frame">
          {showSampleBadge && <div className="cs-sample-badge">Sample Preview</div>}
          <div
            className={`cs-page cs-tpl-${template}`}
            style={
              {
                "--tpl-primary": rendered.primary,
                "--tpl-secondary": rendered.secondary,
                "--tpl-primary-dark": rendered.primaryDark,
                "--tpl-primary-light": rendered.primaryLight,
              } as React.CSSProperties
            }
            // Content is generated by capStatement.render.ts from the user's own form
            // inputs (escaped via escapeHtml) — mirrors the original funnel's
            // innerHTML-based template rendering.
            dangerouslySetInnerHTML={{ __html: rendered.html }}
          />
        </div>
      </div>
    </div>
  );
}
