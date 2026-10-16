// DEMO: the My Business page frame. It is the client version of
// `src/app/[locationId]/business/layout.tsx` in the Success Center.
//
// The real layout loads the record on the server and hands it to `RecordProvider`.
// The demo builds the same payload from the store (`payload.ts`) when the page opens.
// After that, every save answers with the whole record and the provider holds it,
// exactly as in production. The rail (score card and section list) and the page both
// read that one copy, so they cannot disagree.

import { useMemo, type ReactElement, type ReactNode } from "react";
import { PERSONA } from "../../story/persona";
import { RecordProvider } from "@sc/components/business/mybusiness/RecordStore";
import { ScoreCard } from "@sc/components/business/mybusiness/ScoreCard";
import { SectionNav } from "@sc/components/business/mybusiness/SectionNav";
import "@sc/components/business/ds.css";
import "@sc/components/business/mybusiness/mybusiness.css";
import { buildPayload } from "./payload";
import { readBusiness } from "./state";

export function BusinessShell({ children }: { children: ReactNode }): ReactElement {
  // One load per visit to the page, like the server layout. A new visit loads again.
  const { payload, nowIso } = useMemo(() => {
    const now = new Date();
    return { payload: buildPayload(readBusiness(), now), nowIso: now.toISOString() };
  }, []);

  return (
    <RecordProvider payload={payload} nowIso={nowIso} locationId={PERSONA.locationId}>
      <div className="gpds w-full">
        <div className="gpds-stripe" />
        <div className="mb-page">
          <div className="mb-shell">
            <div className="mb-rail-col">
              <ScoreCard locationId={PERSONA.locationId} />
              <SectionNav locationId={PERSONA.locationId} />
            </div>
            <main className="mb-main">{children}</main>
          </div>
        </div>
      </div>
    </RecordProvider>
  );
}
