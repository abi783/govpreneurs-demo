// The shapes of a forecast record and of the public records a forecast can carry.
// Types only: this file holds no data. `GET /forecasts` sends the record
// (`ForecastRecordDto` in `lib/forecastsApi.ts`). It sends no source document, prior
// award or buyer page, so those reach the engine as `NO_PUBLIC_RECORDS` (`engine.ts`).
//
// Nullability follows the API (D-B1): a null is a field the source did not return, and
// each one has its own "not shared" reading downstream (D-B8).

export type ForecastLane = "federal" | "sled";

/** Where a direct source link goes. The page's label says which, so a link that opens a
 *  meetings calendar is never called "the forecast". */
export interface SourceLink {
  url: string;
  /** "forecast": the forecast record itself. "meetings": the buyer's agendas and minutes
   *  page, not one file. "purchase": the state's purchase record. */
  opens: "forecast" | "meetings" | "purchase";
}

/** A department's own procurement-forecast page, from the backend's checked table
 *  (`backend/src/forecasts/agency-forecast-sites.ts`). Never built from an id. */
export interface PublisherSite {
  /** The department's name, e.g. "Department of Homeland Security". */
  name: string;
  url: string;
}

export interface HigherGovForecast {
  id: string;
  lane: ForecastLane;
  oppKey: string;
  /** HigherGov's title. On SLED records this is written by HigherGov, not the buyer. */
  hgTitle: string | null;
  /** description_text. Agency-written on federal records, machine-written on SLED. */
  hgText: string | null;
  sourceId: string | null;
  postedOn: string | null;
  /** due_date as returned. On a forecast this is an expected date, not a deadline. */
  dueOn: string | null;
  agencyName: string;
  agencyAbbr: string | null;
  naicsCode: string | null;
  pscCode: string | null;
  /** New · Recompete · Unknown on federal records; the source type on SLED records. */
  oppType: string | null;
  /** Raw set-aside code: "TBD", "8A", "8AN", "SBA", or null when the field is absent. */
  setAsideCode: string | null;
  valLow: number | null;
  valHigh: number | null;
  popState: string | null;
  popCity: string | null;
  contactName: string | null;
  contactRole: string | null;
  contactEmail: string | null;
  /** The name HigherGov shows as the forecast's source, e.g. "Department of Homeland
   *  Security". Null when it shows none, and always null on SLED records. */
  sourceName: string | null;
  /** A direct link to the government's own page. The page never links to HigherGov
   *  itself. */
  sourceLink: SourceLink | null;
  /** Key for HigherGov's documents endpoint. SLED only; federal forecasts carry none. */
  docKey: string | null;
  /** The files held for the forecast. Null or absent when they were not read: the list
   *  does not read them. */
  files?: SourceFile[] | null;
  /** YYYY-MM-DD: the day the record was last read. */
  checkedOn?: string | null;
  /** The forecast page of the buyer's department. Federal only. Null when the department
   *  has no checked page; absent on the list, which does not read it. */
  publisherSite?: PublisherSite | null;
}

/** The source document behind a SLED forecast. Quotes are copied from the document text,
 *  verbatim. */
export interface SourceDocument {
  fileName: string;
  /** The public body that met. */
  body: string;
  meetingOn: string | null;
  postedOn: string;
  /** Agenda item number, where the document gives one. */
  item: string | null;
  quotes: string[];
  /** A public meeting the document says is still to come. */
  upcoming: { on: string; body: string; quote: string } | null;
}

/** A file held for a forecast: its name and size. The download link expires within the
 *  hour, so the page lists the file without one. */
export interface SourceFile {
  fileName: string;
  /** Null when the size is not stored. */
  sizeBytes: number | null;
}

/** A prior award matched to a federal recompete, read from HigherGov contract data. */
export interface PriorAward {
  awardId: string;
  awardee: string;
  awardingOffice: string;
  description: string;
  value: number;
  startOn: string;
  endOn: string;
  /** period_of_performance_current_end_date. Null where it was not read. */
  currentEndOn: string | null;
  offers: number | null;
  setAsideText: string | null;
  naicsCode: string | null;
  pscCode: string | null;
  placeCity: string | null;
  placeState: string | null;
  /** The award notice on SAM.gov. Null when there is no notice for the contract. */
  noticeUrl: string | null;
}

/** What the buyer's own forecast page says about competition (for example a DHS
 *  Acquisition Planning Forecast System record). The forecast API leaves these out. */
export interface BuyerRecord {
  /** A named contract that only its holders can order under. Null for a definitive
   *  contract or a single indefinite-delivery contract, which any company can bid. */
  vehicle: string | null;
  /** "Competition: YES" or "NO". */
  competed: boolean;
  /** "Small Business Program" as shown: "None", "TBD", "SB", "8(a)". */
  program: string;
  /** "Small Business Set-Aside": "Full", "Partial" or "N/A". */
  setAside: "full" | "partial" | "none";
  status: "new" | "follow_on";
  incumbent: string | null;
  /** "Estimated Solicitation Release". */
  solicitationOn: string;
  specialist: string | null;
}
