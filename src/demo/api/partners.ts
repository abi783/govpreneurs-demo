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
  rankedPartners,
} from "../explore/partnersData";
import { awardsWonBy } from "../explore/awardsData";
import {
  PIPELINE_STAGES,
  type PartnerJourneyData,
  type PipelineEntry,
  type PipelineStage,
  type PrimeCandidate,
} from "@/lib/partnersApi";
import { matchPartner } from "@/lib/search/match";
import { plainNaics } from "@/lib/vocab/plainCodes";
import { naicsDescription } from "../hunter/naicsData";

const PIPELINE_KEY = "explore.partners.pipeline";
const SUPPRESSED_KEY = "explore.partners.suppressed";

const pipeline = (): PipelineEntry[] => readDemoState<PipelineEntry[]>(PIPELINE_KEY, initialPartnerPipeline);
const suppressed = (): number[] => readDemoState<number[]>(SUPPRESSED_KEY, []);

function keyOf(raw: string): number {
  return Number(raw);
}

/**
 * DEMO: the newer company window lists recent jobs, the kinds of work and the buyers.
 * They come from the awards this company won in the sample market, so nothing new is made up.
 */
function withJobs(p: PrimeCandidate): PrimeCandidate {
  const awards = awardsWonBy(p.awardeeKey).sort((a, b) =>
    (b.recency.awardedAt ?? "").localeCompare(a.recency.awardedAt ?? ""),
  );
  if (awards.length === 0) return p;
  const kinds = new Map<string, string>();
  const buyers = new Map<string, number>();
  for (const a of awards) {
    // The sample award keeps a job description in `workType`, so the kind of work is the NAICS title.
    if (a.naicsCode && !kinds.has(a.naicsCode))
      kinds.set(a.naicsCode, plainNaics(a.naicsCode, naicsDescription(a.naicsCode) ?? a.workType));
    buyers.set(a.agency.name, (buyers.get(a.agency.name) ?? 0) + 1);
  }
  return {
    ...p,
    economics: { ...p.economics, lastAwardAt: awards[0].recency.awardedAt ?? null },
    workTypes: p.workTypes ?? [...kinds].map(([naics, name]) => ({ naics, name })),
    buyers: p.buyers ?? [...buyers].sort((a, b) => b[1] - a[1]).map(([name, jobs]) => ({ name, jobs })),
    buyerKinds:
      p.buyerKinds ??
      ([...new Set(awards.map((a) => (a.agency.isDefense ? "defense" : "civilian")))] as ("defense" | "civilian")[]),
    recentJobs:
      p.recentJobs ??
      awards.slice(0, 10).map((a) => ({
        awardId: a.awardId,
        title: a.title,
        description: a.description ?? null,
        workType: a.workType,
        buyer: a.agency.name,
        office: a.office ?? null,
        city: a.location.city,
        state: a.location.state,
        value: a.obligated,
        awardedAt: a.recency.awardedAt ?? null,
        endsAt: a.workEndsAt ?? a.recency.recompeteAt ?? null,
        contractNumber: a.contractNumber ?? null,
        solicitationId: a.solicitationId,
        naicsCode: a.naicsCode,
        pscCode: a.pscCode,
      })),
  };
}

export const routes: DemoRouteDef[] = [
  {
    method: "GET",
    path: "/partners",
    handler: ({ query }) => {
      const gone = new Set(suppressed());
      const partners = feedWithout([...gone]).map(withJobs);
      // The companies she marked "Not right for me", for the "Show them again" filter.
      const hidden = rankedPartners()
        .filter((c) => gone.has(c.awardeeKey))
        .map(withJobs);
      const q = (query.get("q") ?? "").trim();
      const base = {
        computedAt: isoDaysFromNow(-1, 6),
        pending: false,
        stale: false,
        needsProfile: false,
        hidden,
      };
      if (!q) return { ...base, partners };
      // The search: production also reads primes outside her lane. The sample market
      // is her lane, so the demo searches it and says why each company matched.
      const matchedBecause: Record<string, string> = {};
      const found = partners.filter((p) => {
        const why = matchPartner(p, q);
        if (why === null) return false;
        matchedBecause[p.awardeeKey] = why;
        return true;
      });
      return { ...base, partners: found, matchedBecause };
    },
  },
  {
    method: "GET",
    path: "/partners/company/:awardeeKey",
    handler: ({ params }) => {
      const key = keyOf(params.awardeeKey);
      const found = Number.isFinite(key) ? companyByKey(key) : null;
      return found
        ? { ...found, company: withJobs(found.company) }
        : demoResponse(404, { message: "No company on file for that award winner." });
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
    method: "PUT",
    path: "/partners/pipeline/:awardeeKey/journey",
    handler: ({ params, body }) => {
      const key = keyOf(params.awardeeKey);
      const journey = (body?.journey ?? {}) as PartnerJourneyData;
      updateDemoState<PipelineEntry[]>(PIPELINE_KEY, initialPartnerPipeline, (prev) =>
        prev.map((e) => (e.awardeeKey === key ? { ...e, journey, updatedAt: new Date().toISOString() } : e)),
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
