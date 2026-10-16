// Forecast source (above Get ready): who published this forecast, and one link to open
// it on the government's own site. The link shows only when HigherGov shows a direct
// one. Without it, the box still names the publisher, the number and the date, and says
// plainly that there is no public link (Shyam, 17 September 2026). The page never links
// to HigherGov.
//
// A federal publisher's name links to its department's own procurement-forecast site
// when the backend holds a checked one (GSA's list at acquisition.gov). With no direct
// link, the search hint then names that site and links it. Defense has no such link.
//
// Colour rules held here (D-E5): these are the government's facts, so never amber.

import type { ReactNode } from "react";
import { ExternalLink, Landmark } from "lucide-react";
import { DETAIL_MORE } from "../../lib/forecasts/copy";
import { longDate, type ScoredForecast } from "../../lib/forecasts/engine";
import { ORIGIN, type SearchWhat } from "../../lib/forecasts/grantCopy";
import { publisherSiteLink } from "../../lib/forecasts/publisherSite";
import type { PublisherSite } from "../../lib/forecasts/records";

/** A link to a department forecast site, opened in a new tab. */
function SiteLink({ site, children }: { site: PublisherSite; children: ReactNode }) {
  return (
    <a
      className="fc-origin__site"
      href={site.url}
      target="_blank"
      rel="noopener noreferrer"
      title={ORIGIN.siteTitle(site.name)}
    >
      {children} <ExternalLink size={12} aria-hidden />
    </a>
  );
}

/** "There is no public link…", then where to search: the department site, or the publisher. */
function NoLinkNote({
  what,
  site,
  publisher,
}: {
  what: SearchWhat | null;
  site: PublisherSite | null;
  publisher: string;
}) {
  if (!what) return <>{ORIGIN.noLink}</>;
  if (!site) return <>{`${ORIGIN.noLink} ${ORIGIN.searchHint(what, publisher)}`}</>;
  return (
    <>
      {`${ORIGIN.noLink} ${ORIGIN.searchSiteBefore}`}
      <SiteLink site={site}>{ORIGIN.siteName(site.name)}</SiteLink>
      {ORIGIN.searchSiteAfter(what)}
    </>
  );
}

export function ForecastSource({ f }: { f: ScoredForecast }) {
  const r = f.record;
  const local = f.lane === "sled";
  const doc = f.document;
  const publisher = local ? (doc?.body ?? r.agencyName) : (r.sourceName ?? r.agencyName);
  // A local record's id is a file name, not the buyer's number, so only federal ones show.
  // Some federal numbers carry a leading asterisk that the buyer's own site does not use.
  const number = !local && r.sourceId ? r.sourceId.replace(/^\*/, "") : null;
  const facts = [
    local ? f.foundIn : null,
    number ? ORIGIN.number(number) : null,
    doc?.meetingOn ? DETAIL_MORE.meetingOf(longDate(doc.meetingOn)) : null,
    doc?.item ? DETAIL_MORE.item(doc.item) : null,
    // A federal posted_date is the latest version's date.
    r.postedOn ? (local ? ORIGIN.posted : ORIGIN.updated)(longDate(r.postedOn)) : null,
  ]
    .filter(Boolean)
    .join(" · ");
  // The buyer's own title helps find the forecast on their site, most of all with no link.
  // A local record's title is written by the data provider, not the buyer, so it is not shown.
  const their = !local && r.hgTitle ? ORIGIN.their(r.hgTitle) : null;
  const link = r.sourceLink;
  // Federal only: a local publisher is not a federal department.
  const site = local ? null : publisherSiteLink(r.publisherSite);
  const what: SearchWhat | null =
    their && number ? "both" : their ? "title" : number ? "number" : null;
  const linkNote =
    link?.opens === "meetings"
      ? ORIGIN.meetingsNote(doc?.meetingOn ? longDate(doc.meetingOn) : null)
      : link?.opens === "purchase"
        ? ORIGIN.purchaseNote
        : null;
  const note = link ? linkNote : <NoLinkNote what={what} site={site} publisher={publisher} />;

  return (
    <section className="ui-card fc-origin" aria-labelledby="fc-origin-title" id="forecast-source">
      <div className="fc-origin__main">
        <h2 id="fc-origin-title" className="fc-origin__title">
          <Landmark size={16} aria-hidden /> {ORIGIN.title}
        </h2>
        <p className="fc-origin__who">
          {site ? (
            <>
              {ORIGIN.publishedBy("")}
              <SiteLink site={site}>{publisher}</SiteLink>
            </>
          ) : (
            ORIGIN.publishedBy(publisher)
          )}
        </p>
        {their && <p className="fc-origin__facts">{their}</p>}
        {facts && <p className="fc-origin__facts">{facts}</p>}
        {note && <p className="fc-origin__note">{note}</p>}
      </div>
      {link && (
        <a
          className="btn btn-secondary btn-sm fc-origin__open"
          href={link.url}
          target="_blank"
          rel="noreferrer"
        >
          {ORIGIN.open[link.opens]} <ExternalLink size={13} aria-hidden />
        </a>
      )}
    </section>
  );
}
