// DEMO (Hunter): story opportunity → the rows that the feed's endpoints return.
//
// `toDiscoverDto` fills every field of `DiscoverV2OpportunityDto`, because the
// card mapper reads them without a check. `toPreviewDto` is the shape of the
// All and Saved tabs, which carry no score.

import type { DiscoverV2OpportunityDto } from "../../lib/discoverMapper";
import type { PreviewOpportunityDto } from "../../lib/preview";
import { PERSONA } from "../story/persona";
import type { FeedRow } from "./data";
import { MEMBER_CODES, holdsSetAside, reasonList } from "./facts";

/** The fields that the Discover and the preview rows share. */
function shared(row: FeedRow) {
  const o = row.o;
  return {
    id: o.id,
    title: o.title,
    scope: o.scope,
    // Production sends this on the scored feed only. The demo sends it on every
    // feed, so a card has the same name on every tab.
    geminiPlainEnglishTitle: o.plainTitle,
    agency: { name: o.agency, office: o.office },
    noticeType: o.noticeType,
    responseDeadline: row.closesAt,
    postedDate: row.postedAt,
    setAside: row.setAside,
    naicsCode: o.naics,
    valEstLow: row.low,
    valEstHigh: row.high,
    placeOfPerformance: { city: row.city, state: row.state, ...(row.zip ? { zip: row.zip } : {}) },
    quickSummary: o.summary,
  };
}

/** One row of `POST /opportunities/discover/v2` (the For You tab). */
export function toDiscoverDto(
  row: FeedRow,
): DiscoverV2OpportunityDto & { agency: { name: string; office: string } } {
  const o = row.o;
  const inCodes = MEMBER_CODES.includes(o.naics);
  const eligible = holdsSetAside(row) && !o.clearanceRequired;
  return {
    ...shared(row),
    geminiPlainEnglishTitle: o.plainTitle,
    status: "active",
    relevanceScore: o.hunter.score,
    tier: o.hunter.tier,
    matchReasons: reasonList(row),
    matchBreakdown: {
      eligible,
      certifiable: false,
      fitPoints: o.hunter.score,
      setAsidePoints: row.setAside ? 100 : 50,
    },
    scoreBreakdown: {
      businessCategoryMatch: o.naics === PERSONA.primaryNaics ? 100 : inCodes ? 85 : 40,
      certificationMatch: row.setAside ? (holdsSetAside(row) ? 100 : 0) : 60,
      locationMatch: Math.max(0, Math.round(100 - (row.miles / PERSONA.serviceRadiusMiles) * 60)),
    },
  };
}

/** One row of `POST /opportunities/all`, `/saved` and `/preview`. */
export function toPreviewDto(row: FeedRow): PreviewOpportunityDto & { solNumber: string } {
  return {
    ...shared(row),
    solNumber: row.o.id,
    classificationCode: row.psc,
  };
}
