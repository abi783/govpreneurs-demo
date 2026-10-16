import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { usePageMeta } from "../components/Layout/page-meta";
import { WhatThisMeansCard } from "../components/Market/WhatThisMeansCard";
import { PrevailingWageTable } from "../components/Market/PrevailingWageTable";
import { LcatBenchmark } from "../components/Market/LcatBenchmark";
import { JargonGloss } from "../components/Layout/JargonGloss";

export const Route = createFileRoute("/labor-pricing")({
  head: () => ({
    meta: [
      { title: "Labor Pricing — Know your market · GovPreneurs" },
      {
        name: "description",
        content:
          "What the government expects to pay — so you price to win without leaving money on the table.",
      },
    ],
  }),
  component: LaborPricingPage,
});

function LaborPricingPage() {
  usePageMeta({});
  const [lcatOpen, setLcatOpen] = useState(false);

  return (
    <div>
      <header style={{ marginBottom: "var(--s-4)" }}>
        <div className="t-label" style={{ marginBottom: "var(--s-3)" }}>Know your market</div>
        <h1 className="t-display-lg">Labor Pricing</h1>
        <p className="t-body-sm" style={{ marginTop: "var(--s-2)", maxWidth: 700 }}>
          What the government expects to pay — so you price to win without leaving money on the table.
        </p>
      </header>

      <WhatThisMeansCard
        caveat={
          <>
            <strong>Honest caveat:</strong> benchmark rates are often{" "}
            <JargonGloss term="not-to-exceed">
              Ceiling rates set in the contract — the maximum, not the expected price.
            </JargonGloss>{" "}
            ceilings — real awarded rates run roughly 10–20% below. Contracting officers flag
            outliers automatically, so aim near the <strong>median</strong>, not the extremes.
          </>
        }
      >
        <ul className="market-what-list">
          <li>
            There are <strong>two pricing worlds</strong>. <strong>Construction</strong> (like
            roofing) is priced <em>by the job</em>, and you must pay at least the government's{" "}
            <JargonGloss term="prevailing wage">
              The Davis-Bacon hourly rate set by the U.S. Department of Labor for the trade and
              county. The legal minimum on federal construction work.
            </JargonGloss>{" "}
            for your area. <strong>Services / staffing</strong> work is priced{" "}
            <em>per person per hour</em> by labor category — less relevant to you today.
          </li>
          <li>
            We've defaulted your view to <strong>construction</strong>: your county's wage floor for
            roofer / laborer / equipment operator, plus what comparable NC roofing jobs actually
            awarded for.
          </li>
          <li>
            Quick answer to "what should I charge": <em>here's the wage floor you must meet, plus
            what similar jobs went for.</em> Price between, closer to the median of the comps.
          </li>
        </ul>
      </WhatThisMeansCard>

      <div style={{ marginTop: "var(--s-5)" }}>
        <PrevailingWageTable />
      </div>

      <section className="lcat-disclosure" style={{ marginTop: "var(--s-6)" }}>
        <button
          type="button"
          className="lcat-disclosure-head"
          onClick={() => setLcatOpen((o) => !o)}
          aria-expanded={lcatOpen}
        >
          {lcatOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <div>
            <div className="lcat-disclosure-title">Service-contract labor benchmarks (LCAT)</div>
            <div className="lcat-disclosure-sub">
              Full hourly-rate benchmarking tool — for service contracts, not roofing. Available if
              you need it later.
            </div>
          </div>
        </button>
        {lcatOpen ? (
          <div className="lcat-disclosure-body">
            <LcatBenchmark />
          </div>
        ) : null}
      </section>
    </div>
  );
}
