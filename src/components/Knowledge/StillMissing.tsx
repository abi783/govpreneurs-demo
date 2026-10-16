import { Plus } from "lucide-react";
import { dismissMissing, useKnowledgeHub } from "../../lib/knowledgeHub";

export function StillMissing() {
  const { missing } = useKnowledgeHub();
  if (missing.length === 0) return null;

  return (
    <section className="kh-missing">
      <header className="kh-missing-head">
        <h3 className="kh-missing-title">Still missing</h3>
        <span className="kh-missing-hint">
          Hunter matches better with these.
        </span>
      </header>
      <ul className="kh-missing-list">
        {missing.map((m) => (
          <li key={m.key} className="kh-missing-row">
            <span className="kh-missing-dot" aria-hidden />
            <span className="kh-missing-label">{m.label}</span>
            <button
              type="button"
              className="kh-btn-link"
              onClick={() => {
                console.log("add missing:", m.key);
                dismissMissing(m.key);
              }}
            >
              <Plus size={12} /> Add
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
