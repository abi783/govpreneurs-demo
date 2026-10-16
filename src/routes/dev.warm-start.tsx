import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { usePageMeta } from "../components/Layout/page-meta";
import { WarmStartWizard } from "../components/Hunter/WarmStartWizard";

export const Route = createFileRoute("/dev/warm-start")({
  head: () => ({
    meta: [{ title: "WarmStartWizard — Dev" }, { name: "robots", content: "noindex,nofollow" }],
  }),
  component: WarmStartGallery,
});

const DEV_LOCATION_ID = "dev-preview";

function WarmStartGallery() {
  usePageMeta({ layout: "wide" });
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const [key, setKey] = useState(0);

  return (
    <div className="bp-shell">
      <div className="bp-shell-inner">
        <header className="bp-header">
          <div>
            <h1 className="bp-title">WarmStartWizard — Dev QA</h1>
            <p className="dev-subtitle">Design QA — not in primary nav.</p>
          </div>
        </header>

        <div className="dev-gallery">
          <section className="dev-gallery-section">
            <div className="dev-gallery-label" style={{ color: "#b91c1c" }}>
              Warning: this renders the REAL wizard against the real backend. In local dev this
              stores real preview answers under the mock location id "{DEV_LOCATION_ID}" (POST
              /opportunities/preview/answers) — it is not stubbed or intercepted. Do not point this
              at a real user's locationId.
            </div>
            {completedAt && (
              <div className="dev-gallery-label">
                Wizard completed at {completedAt}. Answers were POSTed for locationId "
                {DEV_LOCATION_ID}". Click "Restart" to render a fresh instance.
              </div>
            )}
            <div className="dev-gallery-row">
              <button
                type="button"
                className="preview-gate-banner-reanswer"
                onClick={() => {
                  setCompletedAt(null);
                  setKey((k) => k + 1);
                }}
              >
                Restart
              </button>
            </div>
            <div className="dev-gallery-row">
              <WarmStartWizard
                key={key}
                locationId={DEV_LOCATION_ID}
                onComplete={() => setCompletedAt(new Date().toLocaleString())}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
