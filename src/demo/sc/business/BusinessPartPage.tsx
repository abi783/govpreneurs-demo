// DEMO: one part of the record, on its own screen. It is the client version of
// `src/app/[locationId]/business/[part]/page.tsx` in the Success Center.
//
//   /my-business/sell | jobs | papers | capacity | business    the record's catalog rows
//   /my-business/digital                                       the Digital Compliance audit form
//   /my-business/tell                                          "Tell Hunter everything"
//
// An unknown part is a 404, never an empty part. A part is locked until Basic Info is
// done (the demo member has sent hers, so none is locked).

import type { ReactElement } from "react";
import { notFound } from "next/navigation";
import { PERSONA } from "../../story/persona";
import { PartLocked } from "@sc/components/business/mybusiness/PartLocked";
import { PartRecord } from "@sc/components/business/mybusiness/PartRecord";
import { useRecord } from "@sc/components/business/mybusiness/RecordStore";
import { TellLauncher } from "@sc/components/business/mybusiness/TellLauncher";
import { TellPanel } from "@sc/components/business/mybusiness/TellPanel";
import { basicInfoDone } from "@sc/lib/businessProfile/handoff";
import { PARTS, isPartId } from "@sc/lib/businessProfile/parts";
import { DigitalIdentityPart } from "./DigitalIdentityPart";

const TELL_LEDE =
  "I will write down what I understand. Nothing goes on your record here — I will put each thing to you one at a time, and you decide.";

export function BusinessTellPage(): ReactElement {
  return (
    <>
      <h2 className="mb-sec__h">Tell Hunter everything</h2>
      <p className="mb-sub">{TELL_LEDE}</p>
      <TellPanel locationId={PERSONA.locationId} />
    </>
  );
}

export function BusinessPartPage({ part }: { part: string }): ReactElement {
  const { payload } = useRecord();
  if (part === "tell") return <BusinessTellPage />;
  if (!isPartId(part)) notFound();

  const meta = PARTS.find((p) => p.id === part);
  if (!meta) notFound();

  const locationId = PERSONA.locationId;
  if (!basicInfoDone(payload.handoff.mode)) {
    return <PartLocked locationId={locationId} title={meta.title} />;
  }

  return (
    <>
      {/* An h2, not an h1: the page is "My business" and this is the part now open. */}
      <header className="mb-pane__head">
        <div className="mb-pane__text">
          <h2 className="mb-sec__h">{meta.title}</h2>
          <p className="mb-sub">{meta.note}</p>
        </div>
        <TellLauncher locationId={locationId} />
      </header>

      {part === "digital" ? (
        <DigitalIdentityPart locationId={locationId} />
      ) : (
        <PartRecord locationId={locationId} part={part} />
      )}
    </>
  );
}
