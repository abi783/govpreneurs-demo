import { Building2, MapPin, Users, Target, ArrowRight, HelpCircle } from "lucide-react";
import type { GovBuyer } from "@/lib/mock/governmentBuyers";
import { getOpenOppsForBuyer } from "@/lib/mock/governmentBuyers";

export function BuyerCard({
  buyer,
  active,
  onSeePeople,
  onApproach,
}: {
  buyer: GovBuyer;
  active: boolean;
  onSeePeople: () => void;
  onApproach: () => void;
}) {
  const openCount = getOpenOppsForBuyer(buyer).length;
  const officerCount = buyer.officers.length;
  const typeLabel = buyer.type === "federal" ? "Federal" : "SLED";
  const distanceLabel =
    buyer.distanceMiles === 0
      ? "In Fayetteville"
      : `${buyer.distanceMiles} mi away`;

  return (
    <article className={`gov-buyer-card${active ? " is-active" : ""}`}>
      <div className="gov-buyer-card-head">
        <Building2 size={15} className="gov-buyer-card-icon" />
        <span className="gov-buyer-card-name">{buyer.name}</span>
        <span className={`gov-buyer-type gov-buyer-type--${buyer.type}`}>{typeLabel}</span>
      </div>
      <div className="gov-buyer-card-meta">
        <MapPin size={11} /> {buyer.location} · {distanceLabel}
      </div>
      <p className="gov-buyer-card-line">
        Buys: <strong>roofing &amp; building repair.</strong> {buyer.whatTheyBuy}
      </p>
      <div className="gov-buyer-card-stats">
        <span>
          <Users size={11} /> {officerCount} contracting {officerCount === 1 ? "person" : "people"}
        </span>
        <span>
          <Target size={11} /> {openCount} open {openCount === 1 ? "match" : "matches"} for you
        </span>
      </div>
      <div className="gov-buyer-card-actions">
        <button type="button" className="btn btn-secondary btn-sm" onClick={onSeePeople}>
          See the people <ArrowRight size={12} />
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onApproach}>
          <HelpCircle size={12} /> How to approach them
        </button>
      </div>
    </article>
  );
}
