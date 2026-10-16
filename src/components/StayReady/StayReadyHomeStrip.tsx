import { Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck } from "lucide-react";
import {
  computeStatus,
  statusChip,
  useStayReadySummary,
} from "../../lib/stayReady";

export function StayReadyHomeStrip() {
  const summary = useStayReadySummary();
  const item = summary.nextItem;
  if (!item) return null;
  const status = computeStatus(item);
  const chip = statusChip(status);
  return (
    <section className={`sr-home-strip sr-home-strip--${summary.tone}`}>
      <div className="sr-home-strip-main">
        <div className="sr-home-strip-eyebrow">
          <ShieldCheck size={12} /> Stay Ready
        </div>
        <div className="sr-home-strip-headline">{summary.headline}</div>
        <div className="sr-home-strip-sub">
          <span className={`sr-chip sr-chip--${chip.tone}`}>{chip.label}</span>
          <span>{item.name}</span>
        </div>
      </div>
      <Link to="/stay-ready" className="sr-home-strip-link">
        View all <ArrowRight size={12} />
      </Link>
    </section>
  );
}
