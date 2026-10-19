/**
 * ReadinessHeader — the 2026-09 redesign's replacement for `RecordLede`'s
 * single "we know n things" line. Three stat tiles, deliberately never one
 * combined figure:
 *
 *   - Questions answered — core (non-extra) questions settled, over the
 *     trade-filtered total. The headline.
 *   - Parts done — how many of the five parts are fully settled, as pips
 *     rather than a bar: five is small and fixed, so a pip per part reads
 *     faster than a bar that only ever lands on a fifth.
 *   - Extras added — the tier-3, non-intake questions, counted on their own
 *     so they never inflate the headline and their absence never reads as
 *     missing work.
 *
 * Sits in the layout's header, above the rail and the page, and reads the
 * same client-held record the rail does — same reasoning `RecordLede`
 * carried: a client component so it moves the moment she answers something,
 * without a second server render.
 */

"use client";

import type { ReactElement } from "react";
import { CheckIcon, ClipboardIcon, SparkIcon } from "@sc/components/portal/tasks/Icon";
import { CATALOG_PART_IDS } from "@sc/lib/businessProfile/parts";
import { partState, readyScore } from "@sc/lib/businessProfile/score";
import { StatTile } from "./StatTile";
import { useRecord } from "./RecordStore";
import "./mybusiness.css";

export function ReadinessHeader(): ReactElement {
  const { payload } = useRecord();
  const score = readyScore(payload.fields, undefined, payload.media);
  const partsDone = CATALOG_PART_IDS.filter(
    (part) => partState(part, payload.fields, payload.media) === "settled",
  ).length;

  return (
    <dl className="mb-stats">
      <StatTile
        label="Questions answered"
        settled={score.settled}
        total={score.total}
        tone="answered"
        icon={<ClipboardIcon />}
      />
      <StatTile
        label="Parts done"
        settled={partsDone}
        total={CATALOG_PART_IDS.length}
        kind="pips"
        tone="parts"
        icon={<CheckIcon />}
      />
      <StatTile
        label="Extras added"
        settled={score.extra}
        total={score.extraTotal}
        tone="extras"
        icon={<SparkIcon />}
      />
    </dl>
  );
}
