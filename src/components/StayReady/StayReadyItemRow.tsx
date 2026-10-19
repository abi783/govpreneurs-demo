import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import {
  computeStatus,
  formatDueLine,
  isSnoozed,
  statusChip,
  type TrackedItem,
} from "../../lib/stayReady";
import { StayReadyDFYConsent } from "./StayReadyDFYConsent";
import { StayReadySnoozeMenu } from "./StayReadySnoozeMenu";

export function StayReadyItemRow({
  item,
  variant = "overview",
}: {
  item: TrackedItem;
  variant?: "overview" | "card";
}) {
  const status = computeStatus(item);
  const chip = statusChip(status);
  const [dfyOpen, setDfyOpen] = useState(false);

  const showActions = status === "due_soon" || status === "urgent" || status === "overdue";

  return (
    <div className={`sr-row sr-row--${chip.tone} sr-row--${variant}`}>
      <div className="sr-row-main">
        <div className="sr-row-head">
          <span className={`sr-chip sr-chip--${chip.tone}`}>{chip.label}</span>
          <span className="sr-row-name">{item.name}</span>
        </div>
        <div className="sr-row-due">Your {item.shortName} {formatDueLine(item)}.</div>
        {showActions && (
          <p className="sr-row-stakes">
            <ShieldCheck size={11} /> {item.stakes}
          </p>
        )}
        {isSnoozed(item) && (
          <p className="sr-row-stakes">
            Reminders paused until{" "}
            {new Date(item.snoozedUntil!).toLocaleDateString("en-US", { month: "short", day: "numeric" })}.
          </p>
        )}
        {status === "in_progress" && (
          <p className="sr-row-stakes">
            <Sparkles size={11} /> Renewal in progress — we'll let you know when it's done.
          </p>
        )}
        {status === "done" && (
          <p className="sr-row-stakes">
            Renewed · confirmation saved to your knowledge base.
          </p>
        )}
      </div>

      <div className="sr-row-actions">
        {status === "in_progress" ? (
          <Link to="/stay-ready/$itemId" params={{ itemId: item.id }} className="sr-btn-primary">
            View progress <ArrowRight size={12} />
          </Link>
        ) : showActions ? (
          <>
            <Link
              to="/stay-ready/$itemId"
              params={{ itemId: item.id }}
              search={{ mode: "self" }}
              className="sr-btn-primary"
            >
              Renew it myself <ArrowRight size={12} />
            </Link>
            {item.dfyAvailable && (
              <button
                type="button"
                className="sr-btn-secondary"
                onClick={() => setDfyOpen(true)}
              >
                Have us do it — ${item.dfyPriceUSD}
              </button>
            )}
            {!isSnoozed(item) && <StayReadySnoozeMenu itemId={item.id} />}
          </>
        ) : (
          <Link
            to="/stay-ready/$itemId"
            params={{ itemId: item.id }}
            className="sr-row-link"
          >
            Details →
          </Link>
        )}
      </div>

      <StayReadyDFYConsent
        item={dfyOpen ? item : null}
        open={dfyOpen}
        onOpenChange={setDfyOpen}
      />
    </div>
  );
}
