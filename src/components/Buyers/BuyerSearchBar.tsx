// DEMO: this file shows food service copy and data for Amira Haddad. Changed lines are marked.
import { Search, MapPin, UtensilsCrossed, Megaphone } from "lucide-react";
import { byMember } from "@/demo/member";
import { TRADE } from "@/lib/mock/governmentBuyers";

// DEMO: the "buys my trade" pill names the member's trade.
const TradeIcon = byMember({ pack: Megaphone, caterer: UtensilsCrossed });

export function BuyerSearchBar({
  q,
  onQChange,
  near,
  onNearChange,
  buys,
  onBuysChange,
}: {
  q: string;
  onQChange: (v: string) => void;
  near: "nc" | "all";
  onNearChange: (v: "nc" | "all") => void;
  buys: "food" | "all";
  onBuysChange: (v: "food" | "all") => void;
}) {
  return (
    <div className="buyer-toolbar">
      <div className="buyer-search">
        <Search size={14} />
        <input
          className="buyer-search-input"
          placeholder="Search by agency or buyer name…"
          value={q}
          onChange={(e) => onQChange(e.target.value)}
          aria-label="Search government buyers"
        />
      </div>
      <div className="buyer-pills" role="group" aria-label="Filters">
        <button
          type="button"
          className={`buyer-pill${near === "nc" ? " is-active" : ""}`}
          onClick={() => onNearChange(near === "nc" ? "all" : "nc")}
          aria-pressed={near === "nc"}
        >
          <MapPin size={11} /> Near me · NC
        </button>
        <button
          type="button"
          className={`buyer-pill${buys === "food" ? " is-active" : ""}`}
          onClick={() => onBuysChange(buys === "food" ? "all" : "food")}
          aria-pressed={buys === "food"}
        >
          <TradeIcon size={11} /> Buys · {TRADE.label}
        </button>
      </div>
    </div>
  );
}
