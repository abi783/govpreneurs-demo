import { usePageMetaValue } from "./page-meta";

export function PageHeader() {
  const { kicker, title, subtitle } = usePageMetaValue();
  if (!title && !kicker && !subtitle) return null;
  return (
    <header style={{ marginBottom: "var(--s-8)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--s-2)", marginBottom: "var(--s-3)", flexWrap: "wrap" }}>
        {kicker && <div className="t-label">{kicker}</div>}
        <span className="sample-chip" title="All data on this page is illustrative sample data.">Sample data</span>
      </div>
      {title && <h1 className="t-display-lg">{title}</h1>}
      {subtitle && <p className="t-body-sm" style={{ marginTop: "var(--s-2)" }}>{subtitle}</p>}
    </header>
  );
}
