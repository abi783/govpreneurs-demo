import { Search, MapPin, Hammer } from "lucide-react";

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
  buys: "roofing" | "all";
  onBuysChange: (v: "roofing" | "all") => void;
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
          className={`buyer-pill${buys === "roofing" ? " is-active" : ""}`}
          onClick={() => onBuysChange(buys === "roofing" ? "all" : "roofing")}
          aria-pressed={buys === "roofing"}
        >
          <Hammer size={11} /> Buys · Roofing &amp; building repair
        </button>
      </div>
    </div>
  );
}
