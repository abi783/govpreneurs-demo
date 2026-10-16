// DEMO: the stand-in that every new page starts as.
//
// A page agent replaces the body of the route component. Keep the route file and
// its path. Do not leave this component on a page that is finished.

import { FileText } from "lucide-react";
import { PERSONA } from "../story/persona";

export function DemoPlaceholder({ title, owner }: { title: string; owner: string }) {
  return (
    <section
      data-demo-placeholder={title}
      style={{
        maxWidth: 640,
        margin: "0 auto",
        padding: "var(--s-8) var(--s-6)",
        textAlign: "center",
      }}
    >
      <div
        aria-hidden
        style={{
          display: "inline-flex",
          width: 44,
          height: 44,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 12,
          background: "var(--bg-element)",
          color: "var(--text-2)",
          marginBottom: "var(--s-4)",
        }}
      >
        <FileText size={20} />
      </div>
      <h1 className="t-display-lg">{title}</h1>
      <p className="t-body-sm" style={{ marginTop: "var(--s-3)", color: "var(--text-2)" }}>
        This page is still being built for the {PERSONA.businessShortName} demo. Its owner is{" "}
        {owner}.
      </p>
    </section>
  );
}
