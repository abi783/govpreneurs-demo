// DEMO: this file shows food service copy and data for Amira Haddad. Changed lines are marked.
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useRef } from "react";
import { usePageMeta } from "../components/Layout/page-meta";
import { GOV_BUYERS, getBuyer, searchBuyers } from "../lib/mock/governmentBuyers";
import { BuyerSearchBar } from "../components/Buyers/BuyerSearchBar";
import { BuyerCard } from "../components/Buyers/BuyerCard";
import { BuyerDetailPanel } from "../components/Buyers/BuyerDetailPanel";

interface BuyerSearch {
  q: string;
  near: "nc" | "all";
  buys: "food" | "all";
  buyer?: string;
  focus?: "people" | "approach";
}

function validateBuyerSearch(input: Record<string, unknown>): BuyerSearch {
  const q = typeof input.q === "string" ? input.q : "";
  const near = input.near === "all" ? "all" : "nc";
  const buys = input.buys === "all" ? "all" : "food";
  const buyer = typeof input.buyer === "string" && input.buyer ? input.buyer : undefined;
  const focus =
    input.focus === "people" || input.focus === "approach" ? input.focus : undefined;
  return { q, near, buys, buyer, focus };
}

export const Route = createFileRoute("/government-buyers")({
  validateSearch: validateBuyerSearch,
  head: () => ({
    meta: [
      { title: "Government Buyers — Know your market · GovPreneurs" },
      {
        name: "description",
        content:
          "The people who buy what you do — and how to reach them. Search any agency, see the right contacts, and learn who to talk to first.",
      },
    ],
  }),
  component: GovernmentBuyersPage,
});

function GovernmentBuyersPage() {
  usePageMeta({});
  const navigate = useNavigate({ from: "/government-buyers" });
  const { q, near, buys, buyer, focus } = Route.useSearch();
  const detailRef = useRef<HTMLElement | null>(null);

  const filtered = useMemo(
    () => searchBuyers(GOV_BUYERS, q, near, buys),
    [q, near, buys],
  );
  const selected = buyer ? getBuyer(buyer) : null;

  function setSearch(patch: Partial<BuyerSearch>) {
    navigate({ search: (prev: BuyerSearch) => ({ ...prev, ...patch }) });
  }

  function openBuyer(id: string, target: "people" | "approach") {
    navigate({ search: (prev: BuyerSearch) => ({ ...prev, buyer: id, focus: target }) });
    requestAnimationFrame(() => {
      const root = detailRef.current;
      if (!root) return;
      const el = root.querySelector<HTMLElement>(`[data-sec="${target}"]`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function closeDetail() {
    navigate({ search: (prev: BuyerSearch) => ({ ...prev, buyer: undefined, focus: undefined }) });
  }

  return (
    <div>
      <header style={{ marginBottom: "var(--s-4)" }}>
        <div className="t-label" style={{ marginBottom: "var(--s-3)" }}>Know your market</div>
        <h1 className="t-display-lg">Government Buyers</h1>
        <p className="t-body-sm" style={{ marginTop: "var(--s-2)", maxWidth: 640 }}>
          The people who buy what you do — and how to reach them.
        </p>
        <p className="exp-scan-scope">Every buyer we track. No limits, no per-pull caps.</p>
      </header>

      <BuyerSearchBar
        q={q}
        onQChange={(v) => setSearch({ q: v })}
        near={near}
        onNearChange={(v) => setSearch({ near: v })}
        buys={buys}
        onBuysChange={(v) => setSearch({ buys: v })}
      />

      <div className="gov-buyer-grid" style={{ marginTop: "var(--s-4)" }}>
        <div className="gov-buyer-list">
          {filtered.map((b) => (
            <BuyerCard
              key={b.id}
              buyer={b}
              active={b.id === buyer}
              onSeePeople={() => openBuyer(b.id, "people")}
              onApproach={() => openBuyer(b.id, "approach")}
            />
          ))}
          {filtered.length === 0 && (
            <div className="card card-padded" style={{ textAlign: "center" }}>
              <p className="t-body-sm">No buyers match those filters.</p>
            </div>
          )}
        </div>
        {selected && (
          <BuyerDetailPanel
            ref={detailRef}
            buyer={selected}
            focus={focus ?? null}
            onClose={closeDetail}
          />
        )}
      </div>
    </div>
  );
}
