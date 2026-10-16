import { Bookmark, FileText, Layers } from "lucide-react";
import { TabBar } from "../TabBar";

/** The three tabs the feed offers. */
export type OppTab = "for_you" | "all" | "saved";

/** The three view names. Forecasts passes its own, so both lists share one control. */
export interface OppTabLabels {
  forYou: string;
  all: string;
  saved: string;
}

const OPPORTUNITY_LABELS: OppTabLabels = {
  forYou: "Opportunities for you",
  all: "All opportunities",
  saved: "Saved",
};

/** The feed's tab strip. A count the caller does not know yet is `null`, and a
 *  `null` count renders no badge — an unfetched count is not a measurement. */
export function OpportunitiesTabs({
  tab,
  onChange,
  openCount,
  allCount,
  savedCount,
  labels = OPPORTUNITY_LABELS,
}: {
  tab: OppTab;
  onChange: (t: OppTab) => void;
  openCount?: number | null;
  allCount?: number | null;
  savedCount?: number | null;
  labels?: OppTabLabels;
}) {
  return (
    <TabBar
      active={tab}
      onChange={onChange}
      tabs={[
        { key: "for_you", label: labels.forYou, icon: FileText, count: openCount },
        { key: "all", label: labels.all, icon: Layers, count: allCount },
        // Saved sits alongside the two feeds: everything the member bookmarked,
        // from either tab.
        { key: "saved", label: labels.saved, icon: Bookmark, count: savedCount },
      ]}
    />
  );
}
