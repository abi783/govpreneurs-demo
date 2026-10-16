import { type ReactNode } from "react";
import { PageHeader } from "./PageHeader";
import { PageMetaProvider, usePageMetaValue } from "./page-meta";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <PageMetaProvider>
      <div className="brand-stripe" />
      <div style={{ minHeight: "calc(100vh - 3px)", background: "var(--bg)" }}>
        <ShellMain>{children}</ShellMain>
      </div>
    </PageMetaProvider>
  );
}

function ShellMain({ children }: { children: ReactNode }) {
  const meta = usePageMetaValue();
  const wide = meta.layout === "wide";
  return (
    <main className="app-main" style={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex" }}>
      <div
        style={
          wide
            ? { flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column" }
            : {
                flex: 1,
                width: "100%",
                maxWidth: "var(--container-max)",
                margin: "0 auto",
                padding: "var(--s-8) var(--s-6)",
                minWidth: 0,
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
              }
        }
      >
        <div style={wide ? { display: "none" } : undefined}>
          <PageHeader />
        </div>
        <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column" }}>
          {children}
        </div>
      </div>
    </main>
  );
}
