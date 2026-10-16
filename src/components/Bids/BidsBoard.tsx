// The pipeline board — four columns mapping the pursuit journey
// (Saved → Mentor review → Proposal → Outcome), with the GovCon convention
// of count + pipeline value in every column header.

import { formatAwardValue } from "../../lib/mock/awardedContracts";
import { groupByColumn, type Bid, type BoardColumnId } from "../../lib/mock/bids";
import { BidCard } from "./BidCard";

const COLUMN_EMPTY: Record<BoardColumnId, string> = {
  saved: "Nothing saved — star opportunities from the feed and they land here.",
  mentor: "No reviews in flight. A $97 second opinion beats a $10K mistake.",
  proposal: "No proposals in progress yet.",
  outcome: "Nothing submitted yet — your first result will show here.",
};

export function BidsBoard({ bids, showExpired }: { bids: Bid[]; showExpired: boolean }) {
  const columns = groupByColumn(bids, showExpired);
  return (
    <div className="bids-board" role="list" aria-label="Bid pipeline">
      {columns.map((col) => (
        <section key={col.id} className="bids-col" role="listitem" aria-label={col.title}>
          <header className="bids-col__head">
            <div className="bids-col__title-row">
              <span className="bids-col__title">{col.title}</span>
              <span className="bids-col__count">{col.bids.length}</span>
              {col.totalUsd > 0 && (
                <span className="bids-col__total">{formatAwardValue(col.totalUsd)}</span>
              )}
            </div>
            <div className="bids-col__sub">{col.sub}</div>
          </header>
          <div className="bids-col__cards">
            {col.bids.map((bid) => (
              <BidCard key={bid.id} bid={bid} />
            ))}
            {col.bids.length === 0 && <p className="bids-col__empty">{COLUMN_EMPTY[col.id]}</p>}
          </div>
        </section>
      ))}
    </div>
  );
}
