// The opportunity (v5 box 2): what the job is, before any advice. What the buyer
// wants, who is buying, where, and how big it is. Only facts about the job: no dates
// (Timeline), nothing about the member (Grant's read), and no current holder (How to
// win it). Hunter's fit stays on the list; on this page Grant's call is the answer.
//
// Colour (D-E5): the facts are the buyer's, so they are never amber. Where a value is
// our reading, it carries an "Our read" tag, with the reason in its tooltip.

import type { CSSProperties } from "react";
import { MoneyText } from "./ForecastChips";
import { OurRead } from "./OurRead";
import { DETAIL_MORE } from "../../lib/forecasts/copy";
import type { ScoredForecast } from "../../lib/forecasts/engine";
import type { ForecastRead } from "../../lib/forecasts/grant";

export function ForecastJobCard({ f, read }: { f: ScoredForecast; read: ForecastRead }) {
  const { facts } = read.job;

  return (
    <section className="ui-card fc-job" aria-labelledby="fc-job-title">
      <h2 id="fc-job-title" className="fc-job__title">
        {f.facts.title}
      </h2>
      <p className="fc-job__their">{f.record.agencyName}</p>
      {!read.job.summary && f.record.hgText && f.record.hgText !== f.record.hgTitle && (
        <p className="fc-job__summary">
          <a className="fc-textlink" href="#fc-ev-source">
            {DETAIL_MORE.readRecord}
          </a>
        </p>
      )}
      {read.job.summary && (
        <p className="fc-job__summary">
          <MoneyText text={read.job.summary} />
          {read.job.summaryOurRead && <OurRead why={read.job.summaryOurRead} />}
        </p>
      )}

      {facts.length > 0 && (
        <dl className="fc-job__facts" style={{ "--fc-facts": facts.length } as CSSProperties}>
          {facts.map((fact) => (
            <div key={fact.label} className="fc-job__fact">
              <dt>{fact.label}</dt>
              <dd>
                {fact.href ? (
                  <a className="fc-textlink" href={fact.href}>
                    {fact.value}
                  </a>
                ) : (
                  <MoneyText text={fact.value} />
                )}
                {fact.ourRead && <OurRead why={fact.why} />}
                {fact.sub && <small>{fact.sub}</small>}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
