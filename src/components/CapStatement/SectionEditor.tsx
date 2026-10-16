import { RefreshCw, Scissors } from "lucide-react";
import type { CapSection } from "../../lib/capStatementBuilder";

export function SectionEditor({
  section,
  onChange,
  onRegenerate,
  onConcise,
}: {
  section: CapSection;
  onChange: (body: string) => void;
  onRegenerate: () => void;
  onConcise: () => void;
}) {
  return (
    <div className="cs-edit">
      <header className="cs-edit-head">
        <div>
          <h3 className="cs-edit-title">{section.title}</h3>
          <p className="cs-edit-why">{section.whyItMatters}</p>
        </div>
        <div className="cs-edit-actions">
          <button type="button" className="cs-edit-btn" onClick={onRegenerate}>
            <RefreshCw size={12} /> Regenerate
          </button>
          <button type="button" className="cs-edit-btn" onClick={onConcise}>
            <Scissors size={12} /> Make concise
          </button>
        </div>
      </header>
      <textarea
        className="cs-edit-ta"
        value={section.body}
        rows={Math.max(4, section.body.split("\n").length + 1)}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
