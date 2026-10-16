import { useState } from "react";

export function FeedHeader({
  strongCount,
  newThisWeek,
  headlineOverride,
  sublineOverride,
}: {
  strongCount: number;
  newThisWeek: number;
  headlineOverride?: string;
  sublineOverride?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <section className="feed-header">
      <div className="feed-header-row">
        <h2 className="feed-header-count">
          {headlineOverride ?? (
            <>
              <span className="feed-header-num">{strongCount.toLocaleString()}</span>{" "}
              <span className="feed-header-noun">strong matches</span>
            </>
          )}
        </h2>
        {!headlineOverride && newThisWeek > 0 && (
          <span className="feed-header-sep" aria-hidden>
            ·
          </span>
        )}
        {!headlineOverride && newThisWeek > 0 && (
          <span className="feed-header-new">{newThisWeek} new this week</span>
        )}
        <span className="feed-header-spacer" />
        <button
          type="button"
          className="feed-header-why"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          {open ? "Hide reasoning" : "Why these?"}
        </button>
      </div>
      {sublineOverride && <p className="feed-header-subline">{sublineOverride}</p>}
      {open && (
        <p className="feed-header-reasoning">
          Weighted by <strong>scope fit</strong> (how closely an opportunity matches your business
          categories), <strong>location</strong>, and <strong>certification eligibility</strong>{" "}
          (your set-asides).
        </p>
      )}
    </section>
  );
}
