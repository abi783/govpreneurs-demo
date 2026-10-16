// Timeline (v5 box 3): every date about the job on one line, with today marked. The
// time to prepare sits under Today, and a band runs from today to the likely bid
// request, so nobody has to count months. Past marks are grey, today is ringed, and a
// date we worked out carries "Our read", with the reason in its tooltip.

import type { CSSProperties } from "react";
import { OurRead } from "./OurRead";
import type { TimelineMark } from "../../lib/forecasts/grant";
import { TIMELINE } from "../../lib/forecasts/grantCopy";

export function ForecastTimeline({ marks }: { marks: TimelineMark[] }) {
  if (marks.length < 2) return null;
  const today = marks.findIndex((m) => m.kind === "today");
  const target = marks.findIndex((m, i) => i > today && m.kind === "window");
  const band = today >= 0 && target > today && marks[today].label !== "";
  const style = {
    "--fc-tl-n": marks.length,
    "--fc-tl-from": today,
    "--fc-tl-to": target,
  } as CSSProperties;
  return (
    <section className="ui-card fc-tl" aria-labelledby="fc-tl-title">
      <h2 id="fc-tl-title" className="gt-kicker fc-tl__title">
        {TIMELINE.title}
      </h2>
      <ol className={`fc-tl__track${band ? " has-band" : ""}`} style={style}>
        {marks.map((m) => (
          <li
            key={`${m.on}-${m.kind}`}
            className={`fc-tl__mark fc-tl__mark--${m.kind}`}
            aria-current={m.kind === "today" ? "date" : undefined}
          >
            <span className="fc-tl__dot" aria-hidden />
            <span className="fc-tl__date">{m.date}</span>
            {m.label && <span className="fc-tl__label">{m.label}</span>}
            {m.ourRead && <OurRead why={m.why} />}
          </li>
        ))}
      </ol>
    </section>
  );
}
