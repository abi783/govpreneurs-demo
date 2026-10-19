import { Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useKnowledgeHub } from "../../lib/knowledgeHub";

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
            {/* DEMO: Add opens the Business Profile tab where the answer is entered.
                The item leaves this list once the field has an answer. */}
            <Link to="/business-profile" search={{ tab: m.tab }} className="kh-btn-link">
              <Plus size={12} /> Add
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
