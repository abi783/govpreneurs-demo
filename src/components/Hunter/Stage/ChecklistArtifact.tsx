// The action checklist — the `ActPayload` artifact on the stage.
//
// It REUSES `ActCard` rather than restating it. `ActCard` is still live in its
// own right (`EnrichmentJourney` renders a deferred offer with it), so a second
// renderer of the same payload would be two places to keep one rule true — and
// the rule in question is the one that matters most here: a `DfyOffer` carries
// NO price, and `mentorFeeUSD` is the only monetary figure this payload may put
// on screen (`lib/hunterChat.ts`). The prototype's checklist footer renders a
// `priceLabel`. There is no field to render it from and there will not be one.
//
// The stage supplies the `Action checklist · {title}` header, so the body adds
// nothing above what `ActCard` already shows.

import type { ActPayload } from "../../../lib/hunterChat";
import { getMockLocationId } from "../../../lib/api";
import { ActCard } from "../ActCard";

/** Renders the act agent's gap resolution on the stage. */
export function ChecklistArtifact({ payload }: { payload: ActPayload }) {
  // In production this app runs inside the GoHighLevel iframe and the DIY route
  // goes through the parent bridge, which needs no location. Standalone dev has
  // no parent, and there the `?locationId=` override is the account.
  return <ActCard payload={payload} locationId={getMockLocationId()} />;
}
