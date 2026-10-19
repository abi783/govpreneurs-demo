// DEMO: this file shows food service copy and data for Amira Haddad. Changed lines are marked.
// DEMO: two members. The copy below is picked per member (COPY); the data is in lib/mock/vehicles.ts.
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { usePageMeta } from "../components/Layout/page-meta";
import { VEHICLES, vehiclesByFit } from "../lib/mock/vehicles";
import { WhatThisMeansCard } from "../components/Market/WhatThisMeansCard";
import { VehiclesList } from "../components/Market/VehiclesList";
import { JargonGloss } from "../components/Layout/JargonGloss";
import { byMember } from "../demo/member";

// DEMO: each member's words for the page.
const COPY = byMember({
  agency: {
    meta: "Pre-approved contracts that let agencies buy from you faster — and what they actually mean for an ad agency.",
    lead: "an ad agency like yours.",
    fitsLabel: "Fits my work (marketing)",
    famous: "For an ad agency: the most famous vehicles (",
    path: (
      <>
        The ones that fit: <strong>GSA&apos;s Marketing and Public Relations schedule</strong> (you are not on
        it yet), the <strong>woman-owned set-asides</strong> you already qualify for, and{" "}
        <strong>teaming with a prime</strong> on work you can&apos;t bid alone. We&apos;ve defaulted you to those.
      </>
    ),
  },
  caterer: {
    meta: "Pre-approved contracts that let agencies buy from you faster — and what they actually mean for a food service business.",
    lead: "a food service business like yours.",
    fitsLabel: "Fits my work (food service)",
    famous: "For a caterer: the most famous vehicles (",
    path: (
      <>
        The ones that fit food service: <strong>base and agency food service IDIQs</strong>{" "}
        (Fort Bragg events, VA nutrition), <strong>state term contracts</strong>, and{" "}
        <strong>teaming with the prime</strong> that holds a big dining contract. We&apos;ve defaulted
        you to those.
      </>
    ),
  },
});
const NOT_FOR = byMember({ agency: "not for ad work", caterer: "not for food service" });

export const Route = createFileRoute("/vehicles")({
  head: () => ({
    meta: [
      { title: "Contract Vehicles — Know your market · GovPreneurs" },
      {
        name: "description",
        content: COPY.meta,
      },
    ],
  }),
  component: VehiclesPage,
});

type FitFilter = "fits" | "all";

function VehiclesPage() {
  usePageMeta({});
  const [filter, setFilter] = useState<FitFilter>("fits");

  const list = useMemo(
    () => vehiclesByFit(VEHICLES, filter === "fits"),
    [filter],
  );

  const fitsCount = VEHICLES.filter((v) => v.fitsFood).length;

  return (
    <div>
      <header style={{ marginBottom: "var(--s-4)" }}>
        <div className="t-label" style={{ marginBottom: "var(--s-3)" }}>Know your market</div>
        <h1 className="t-display-lg">Contract Vehicles</h1>
        <p className="t-body-sm" style={{ marginTop: "var(--s-2)", maxWidth: 700 }}>
          Pre-approved contracts that let agencies buy from you faster — and what they mean for{" "}
          {COPY.lead}
        </p>
      </header>

      <WhatThisMeansCard
        caveat={
          <>
            <strong>Honest catch:</strong> getting on a vehicle is a months-long application and just
            the start — you still compete for individual <em>task orders</em> under it. A strategic
            play for later, not your first win.
          </>
        }
      >
        <ul className="market-what-list">
          <li>
            A <strong>contract vehicle</strong> is a pre-approved "license to sell." Once you're on
            it, you compete only against the few others on it — not thousands.
          </li>
          <li>
            {COPY.famous}
            <JargonGloss term="SEWP">{`NASA's IT-hardware GWAC — ${NOT_FOR}.`}</JargonGloss>,{" "}
            <JargonGloss term="Alliant">{`GSA's IT-services GWAC — ${NOT_FOR}.`}</JargonGloss>,{" "}
            <JargonGloss term="CIO-SP">{`NIH's IT/health-IT GWAC — ${NOT_FOR}.`}</JargonGloss>,{" "}
            <JargonGloss term="VETS 2">Service-disabled veteran-only — and IT services only.</JargonGloss>,{" "}
            <JargonGloss term="Polaris">Small-business IT services GWAC.</JargonGloss>) are
            IT-focused — <strong>not your path</strong>.
          </li>
          <li>{COPY.path}</li>
        </ul>
      </WhatThisMeansCard>

      <div className="forecast-view-toggle" role="tablist" aria-label="Filter vehicles" style={{ marginTop: "var(--s-4)" }}>
        <button
          type="button"
          role="tab"
          aria-selected={filter === "fits"}
          className={`forecast-view-btn${filter === "fits" ? " is-active" : ""}`}
          onClick={() => setFilter("fits")}
        >
          {COPY.fitsLabel}
          <span className="forecast-view-count">{fitsCount}</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={filter === "all"}
          className={`forecast-view-btn${filter === "all" ? " is-active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All vehicles
          <span className="forecast-view-count">{VEHICLES.length}</span>
        </button>
      </div>

      <div style={{ marginTop: "var(--s-4)" }}>
        <VehiclesList vehicles={list} />
      </div>
    </div>
  );
}
