import {
  BUYER_LANES,
  BUYER_LANE_LABEL,
  BUYER_LANE_QUESTION,
  type BuyerLane,
} from "../../lib/buyerLane";

/** The buyer switch: a segmented control of "All buyers", "Federal" and
 *  "State and local". A radio group, because exactly one lane is on. */
export function BuyerLaneSwitch({
  lane,
  onChange,
}: {
  lane: BuyerLane;
  onChange: (next: BuyerLane) => void;
}) {
  return (
    <div className="opps-lanes" role="radiogroup" aria-label={BUYER_LANE_QUESTION}>
      {BUYER_LANES.map((l) => (
        <button
          key={l}
          type="button"
          role="radio"
          aria-checked={lane === l}
          className={`opps-lane${lane === l ? " is-on" : ""}`}
          onClick={() => {
            if (l !== lane) onChange(l);
          }}
        >
          {BUYER_LANE_LABEL[l]}
        </button>
      ))}
    </div>
  );
}
