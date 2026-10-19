// DEMO API area: Partners.
// Owns: /partners*.
//
// The ranked feed, the company files and the market strip come from
// src/demo/explore/partnersData.ts. What the visitor changes (the partner pipeline and
// the companies marked "not right for me") lives in the demo store, so it stays after a
// reload and on every page that reads it.

import { demoResponse, type DemoRouteDef } from "../runtime/router";
import { readDemoState, updateDemoState } from "../runtime/store";
import { isoDaysFromNow } from "../story/clock";
import {
  companyByKey,
  feedWithout,
  initialPartnerPipeline,
  marketSummary,
} from "../explore/partnersData";
import { PIPELINE_STAGES, type PipelineEntry, type PipelineStage } from "@/lib/partnersApi";

const PIPELINE_KEY = "explore.partners.pipeline";
const SUPPRESSED_KEY = "explore.partners.suppressed";

const pipeline = (): PipelineEntry[] => readDemoState<PipelineEntry[]>(PIPELINE_KEY, initialPartnerPipeline);
const suppressed = (): number[] => readDemoState<number[]>(SUPPRESSED_KEY, []);

function keyOf(raw: string): number {
  return Number(raw);
}

export const routes: DemoRouteDef[] = [
  {
    method: "GET",
    path: "/partners",
    handler: () => ({
      partners: feedWithout(suppressed()),
      computedAt: isoDaysFromNow(-1, 6),
      pending: false,
      stale: false,
      needsProfile: false,
    }),
  },
  {
    method: "GET",
    path: "/partners/company/:awardeeKey",
    handler: ({ params }) => {
      const key = keyOf(params.awardeeKey);
      const found = Number.isFinite(key) ? companyByKey(key) : null;
      return found ?? demoResponse(404, { message: "No company on file for that award winner." });
    },
  },
  {
    method: "GET",
    path: "/partners/market",
    handler: () => marketSummary(),
  },
  {
    method: "GET",
    path: "/partners/pipeline",
    handler: () => ({ entries: pipeline() }),
  },
  {
    method: "POST",
    path: "/partners/pipeline",
    handler: ({ body }) => {
      const awardeeKey = Number(body?.awardeeKey);
      if (!Number.isFinite(awardeeKey)) return demoResponse(400, { message: "Missing company" });
      const now = new Date().toISOString();
      updateDemoState<PipelineEntry[]>(PIPELINE_KEY, initialPartnerPipeline, (prev) =>
        prev.some((e) => e.awardeeKey === awardeeKey)
          ? prev
          : [
              ...prev,
              {
                awardeeKey,
                companyName: String(body?.companyName ?? "Company"),
                stage: "saved",
                sourceTag: String(body?.sourceTag ?? "from Find partners"),
                savedAt: now,
                updatedAt: now,
              },
            ],
      );
      return { ok: true };
    },
  },
  {
    method: "PATCH",
    path: "/partners/pipeline/:awardeeKey",
    handler: ({ params, body }) => {
      const key = keyOf(params.awardeeKey);
      const stage = String(body?.stage ?? "") as PipelineStage;
      if (!PIPELINE_STAGES.includes(stage)) return demoResponse(400, { message: "Unknown stage" });
      updateDemoState<PipelineEntry[]>(PIPELINE_KEY, initialPartnerPipeline, (prev) =>
        prev.map((e) => (e.awardeeKey === key ? { ...e, stage, updatedAt: new Date().toISOString() } : e)),
      );
      return { ok: true };
    },
  },
  {
    method: "DELETE",
    path: "/partners/pipeline/:awardeeKey",
    handler: ({ params }) => {
      const key = keyOf(params.awardeeKey);
      updateDemoState<PipelineEntry[]>(PIPELINE_KEY, initialPartnerPipeline, (prev) =>
        prev.filter((e) => e.awardeeKey !== key),
      );
      return { ok: true };
    },
  },
  {
    method: "POST",
    path: "/partners/suppress",
    handler: ({ body }) => {
      const key = Number(body?.awardeeKey);
      if (!Number.isFinite(key)) return demoResponse(400, { message: "Missing company" });
      updateDemoState<number[]>(SUPPRESSED_KEY, [], (prev) => (prev.includes(key) ? prev : [...prev, key]));
      return { ok: true };
    },
  },
  {
    method: "DELETE",
    path: "/partners/suppress/:awardeeKey",
    handler: ({ params }) => {
      const key = keyOf(params.awardeeKey);
      updateDemoState<number[]>(SUPPRESSED_KEY, [], (prev) => prev.filter((k) => k !== key));
      return { ok: true };
    },
  },
];
