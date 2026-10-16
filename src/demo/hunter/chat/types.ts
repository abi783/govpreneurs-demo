// DEMO (Hunter chat): the shapes that the scripted engine passes around.

import type {
  ActPayload,
  FeedTab,
  HunterTurnResponse,
  VisibleOpp,
} from "../../../lib/hunterChat";
import type { FeedContext } from "../feedContext";
import type { FeedRow } from "../data";

/** The body of `POST /hunter-chat/message`. */
export interface MessageBody {
  message: string;
  visibleOpps?: VisibleOpp[];
  tab?: FeedTab;
  surface?: string;
}

/** What one rule returns. The engine adds the session id and the turn id. */
export interface Turn {
  reply: string;
  kind?: HunterTurnResponse["uiPayload"]["kind"];
  data?: unknown;
  actPayload?: ActPayload;
  /** Two or three follow-up questions, shown as buttons under the reply. */
  chips?: string[];
}

/** Everything a rule may read. */
export interface ChatCtx {
  /** The member's words, as typed. */
  text: string;
  /** Lower case, one space between words, no marks. */
  norm: string;
  tab: FeedTab;
  /** The opportunities on screen, in order, as story rows. */
  visible: FeedRow[];
  /** What the feed page shows: the member's current filters. */
  feed: FeedContext;
  /** The page that the member talks from. */
  surface: "feed" | "forecasts";
  /** The cards on screen, as the page sent them. On Forecasts these are not story opportunities. */
  raw: VisibleOpp[];
}

export interface Rule {
  id: string;
  /** Returns a turn, or null when this rule does not fit the words. */
  run: (ctx: ChatCtx) => Turn | null;
}
