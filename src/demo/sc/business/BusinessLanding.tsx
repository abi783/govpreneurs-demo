// DEMO: Basic Info, the first screen of My Business. It is the client version of
// `src/app/[locationId]/business/page.tsx` in the Success Center. Same blocks, same
// order: the deadline note, who the record is about, the three score tiles, the
// handoff (check your answers, or the receipt), the LLC card and the next question.

import type { ReactElement } from "react";
import { PERSONA } from "../../story/persona";
import { menuLinkPath } from "./nav-links";
import { AskCard } from "@sc/components/business/mybusiness/AskCard";
import { DeadlineNote } from "@sc/components/business/mybusiness/DeadlineNote";
import { HandoffPanel } from "@sc/components/business/mybusiness/HandoffPanel";
import { IdentityCard } from "@sc/components/business/mybusiness/IdentityCard";
import { LlcCard } from "@sc/components/business/mybusiness/LlcCard";
import { ReadinessHeader } from "@sc/components/business/mybusiness/ReadinessHeader";
import { TellLauncher } from "@sc/components/business/mybusiness/TellLauncher";

export function BusinessLanding(): ReactElement {
  const locationId = PERSONA.locationId;
  return (
    <>
      <DeadlineNote />
      <IdentityCard
        editHref={`/${locationId}/business/business`}
        action={<TellLauncher locationId={locationId} />}
      />
      <ReadinessHeader />
      <HandoffPanel locationId={locationId} />
      <LlcCard locationId={locationId} roadmapHref={menuLinkPath("roadmap")} />
      <AskCard locationId={locationId} />
    </>
  );
}
