import { useKnowledgeHub } from "../../lib/knowledgeHub";
import { SourceRow } from "./SourceRow";

export function ConnectedSourcesList() {
  const { sources } = useKnowledgeHub();
  const order: Array<keyof typeof sources> = ["gdrive", "gdocs", "dropbox"];

  return (
    <section className="kh-block">
      <header className="kh-block-head">
        <h3 className="kh-block-title">Connected sources</h3>
        <span className="kh-block-hint">
          Connect once. Hunter keeps things in sync.
        </span>
      </header>
      <ul className="kh-src-list">
        {order.map((id) => (
          <SourceRow key={id} source={sources[id]} />
        ))}
      </ul>
    </section>
  );
}
