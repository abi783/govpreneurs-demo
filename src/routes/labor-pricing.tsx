// DEMO: this file shows food service copy and data for Amira Haddad. Changed lines are marked.
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { usePageMeta } from "../components/Layout/page-meta";
import { WhatThisMeansCard } from "../components/Market/WhatThisMeansCard";
import { PrevailingWageTable } from "../components/Market/PrevailingWageTable";
import { LcatBenchmark } from "../components/Market/LcatBenchmark";
import { JargonGloss } from "../components/Layout/JargonGloss";
import { MEMBER } from "../demo/member";

export const Route = createFileRoute("/labor-pricing")({
  head: () => ({
    meta: [
      { title: "Labor Pricing — Know your market · GovPreneurs" },
      {
        name: "description",
        // DEMO: "price fairly", not "price to win": the demo never promises a win.
        content:
          "What the government expects to pay — so you price fairly without leaving money on the table.",
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
          What the government expects to pay — so you price fairly without leaving money on the table.
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
        {MEMBER === "agency" ? (
          // DEMO: the agency's pricing world is people billed by the hour.
          <ul className="market-what-list">
            <li>
              Most federal <strong>marketing work</strong> is priced <em>per person per hour</em>, by
              labor category, or as a fixed price built from those hours. Contracting officers check
              your rates against GSA schedule rates for the same roles — the benchmark below.
            </li>
            <li>
              Some titles also carry a legal floor: the government&apos;s{" "}
              <JargonGloss term="wage determination">
                The hourly rate set by the U.S. Department of Labor under the Service Contract Act for
                each job title and county. The legal minimum on federal service contracts.
              </JargonGloss>{" "}
              sets minimum pay for graphic artists, illustrators and photographers in your county.
            </li>
            <li>
              Quick answer to "what should I charge": <em>your costs set the bottom, the median GSA
              rate for each role is a fair top.</em> Price between, and check what similar jobs went for.
            </li>
          </ul>
        ) : (
        <ul className="market-what-list">
          <li>
            There are <strong>two pricing worlds</strong>. <strong>Food service</strong> contracts
            are priced <em>by the meal or by the month</em>, and you must pay your workers at least
            the government's{" "}
            <JargonGloss term="wage determination">
              The hourly rate set by the U.S. Department of Labor under the Service Contract Act for
              each job title and county. The legal minimum on federal service contracts.
            </JargonGloss>{" "}
            for your area. <strong>Professional services / staffing</strong> work is priced{" "}
            <em>per person per hour</em> by labor category — less relevant to you today.
          </li>
          <li>
            We've defaulted your view to <strong>food service</strong>: your county's wage floor for
            cook / food service worker / dishwasher / dining facility attendant, plus what
            comparable NC food service jobs actually awarded for.
          </li>
          <li>
            Quick answer to "what should I charge": <em>here's the wage floor you must meet, plus
            what similar jobs went for.</em> Price between, closer to the median of the comps.
          </li>
        </ul>
        )}
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
              {/* DEMO: for the agency, this is the main way its work is priced. */}
              {MEMBER === "agency"
                ? "GSA schedule rates for account directors, designers, video producers and more. This is how most marketing work is priced."
                : "Full hourly-rate benchmarking tool — for professional service contracts, not meals. Available if you need it later."}
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
