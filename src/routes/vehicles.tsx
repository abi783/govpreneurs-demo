import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { usePageMeta } from "../components/Layout/page-meta";
import { VEHICLES, vehiclesByFit } from "../lib/mock/vehicles";
import { WhatThisMeansCard } from "../components/Market/WhatThisMeansCard";
import { VehiclesList } from "../components/Market/VehiclesList";
import { JargonGloss } from "../components/Layout/JargonGloss";

export const Route = createFileRoute("/vehicles")({
  head: () => ({
    meta: [
      { title: "Contract Vehicles — Know your market · GovPreneurs" },
      {
        name: "description",
        content:
          "Pre-approved contracts that let agencies buy from you faster — and what they actually mean for a food service business.",
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
          Pre-approved contracts that let agencies buy from you faster — and what they mean for a
          food service business like yours.
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
            For a caterer: the most famous vehicles (
            <JargonGloss term="SEWP">NASA's IT-hardware GWAC — not for food service.</JargonGloss>,{" "}
            <JargonGloss term="Alliant">GSA's IT-services GWAC — not for food service.</JargonGloss>,{" "}
            <JargonGloss term="CIO-SP">NIH's IT/health-IT GWAC — not for food service.</JargonGloss>,{" "}
            <JargonGloss term="VETS 2">Service-disabled veteran-only — and IT services only.</JargonGloss>,{" "}
            <JargonGloss term="Polaris">Small-business IT services GWAC.</JargonGloss>) are
            IT-focused — <strong>not your path</strong>.
          </li>
          <li>
            The ones that fit food service: <strong>base and agency food service IDIQs</strong>{" "}
            (Fort Bragg events, VA nutrition), <strong>state term contracts</strong>, and{" "}
            <strong>teaming with the prime</strong> that holds a big dining contract. We've defaulted
            you to those.
          </li>
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
          Fits my work (food service)
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
