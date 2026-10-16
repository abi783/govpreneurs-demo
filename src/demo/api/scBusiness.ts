// DEMO API area: Success Center: My Business.
// Owns: Lifted Success Center code. Paths start with /api/.
//
// Path scheme (see src/demo/runtime/router.ts): paths for frontend-v2 code have no
// prefix (`/opportunities/...`). Paths for lifted Success Center code keep `/api`.
// The full list of calls, with request and response types, is in ENDPOINTS.md.
// Keep a visitor's changes in src/demo/runtime/store.ts so they survive a reload.
//
// What lives here: one handler per fetch in the lifted My Business code. The work is
// in `src/demo/sc/business/ops.ts`. Every save answers with the whole record, like the
// real routes, so the rail, the score and the rows move together.
//
//   PUT  /api/portal/:loc/business-profile/:fieldKey            save one answer
//   POST /api/portal/:loc/business-profile/:fieldKey            confirm a value
//   POST /api/portal/:loc/business-profile/:fieldKey/decline    "do not ask again"
//   POST /api/portal/:loc/business-profile/proposals/:id/confirm|reject
//   POST /api/portal/:loc/business-profile/handoff              send the fourteen
//   POST /api/portal/:loc/business-profile/tell[/transcribe]    Tell Hunter everything
//   POST /api/portal/:loc/business-documents                    a document (any file)
//   POST /api/portal/:loc/upload                                photo or logo
//   POST /api/portal/:loc/verify                                LLC confirm, audit form
//   GET  /api/hunter/{naics,psc}-*, /api/hunter/cities          code pickers
//   GET  /api/places/autocomplete, /api/places/details          address lookup
//
// Overlap to know about: the Roadmap and Tasks pages also call POST .../verify. This
// file answers every validation key with a pass, so those calls end well too.

import type { DemoRouteDef } from "../runtime/router";
import { registerSearchEntries } from "../nav/searchIndex";
import {
  confirmField,
  confirmProposal,
  declineField,
  rejectProposal,
  saveField,
  sendHandoff,
  storeDocument,
  storeMedia,
  tellHunter,
  transcribe,
  verify,
} from "../sc/business/ops";
import { PSC_GROUPS, pscDescriptions, pscGroupCodes, searchPsc } from "../sc/business/data/psc";
import { addressForPlace, citiesFor, suggestAddresses } from "../sc/business/data/geo";

// The command palette can open every part of My Business.
registerSearchEntries([
  { label: "My Business: What you sell", hint: "My Business", to: "/my-business/sell", keywords: ["services", "trade", "naics", "capability statement", "differentiators", "menus"] },
  { label: "My Business: Work you have done", hint: "My Business", to: "/my-business/jobs", keywords: ["past performance", "references", "jobs", "customers"] },
  { label: "My Business: Your papers", hint: "My Business", to: "/my-business/papers", keywords: ["insurance", "permits", "licenses", "food handler", "haccp", "w-9", "certificates"] },
  { label: "My Business: What you can take on", hint: "My Business", to: "/my-business/capacity", keywords: ["capacity", "bonding", "service area", "equipment", "payment terms"] },
  { label: "My Business: Your legal details", hint: "My Business", to: "/my-business/business", keywords: ["sam", "uei", "cage", "ein", "address", "owners", "certifications", "wosb"] },
  { label: "My Business: Digital identity", hint: "My Business", to: "/my-business/digital", keywords: ["website", "email", "phone", "a2p", "audit"] },
  { label: "Tell Hunter everything", hint: "My Business", to: "/my-business/tell", keywords: ["dictate", "voice", "write down", "profile"] },
]);

const BP = "/api/portal/:locationId/business-profile";

function listParam(value: string | null): string[] {
  return (value ?? "").split(",").map((c) => c.trim()).filter(Boolean);
}

async function naicsTitles(): Promise<Record<string, string>> {
  const mod = await import("../sc/business/data/naics");
  return mod.NAICS_TITLES;
}

export const routes: DemoRouteDef[] = [
  { method: "PUT", path: `${BP}/:fieldKey`, handler: (ctx) => saveField(ctx.params.fieldKey, ctx.body) },
  { method: "POST", path: `${BP}/:fieldKey`, handler: (ctx) => confirmField(ctx.params.fieldKey) },
  { method: "POST", path: `${BP}/:fieldKey/decline`, handler: (ctx) => declineField(ctx.params.fieldKey) },
  {
    method: "POST",
    path: `${BP}/proposals/:proposalId/confirm`,
    handler: (ctx) => confirmProposal(ctx.params.proposalId, ctx.body),
  },
  {
    method: "POST",
    path: `${BP}/proposals/:proposalId/reject`,
    handler: (ctx) => rejectProposal(ctx.params.proposalId),
  },
  { method: "POST", path: `${BP}/handoff`, handler: () => sendHandoff() },
  { method: "POST", path: `${BP}/tell`, handler: (ctx) => tellHunter(ctx.body) },
  { method: "POST", path: `${BP}/tell/transcribe`, handler: () => transcribe() },

  { method: "POST", path: "/api/portal/:locationId/business-documents", handler: (ctx) => storeDocument(ctx.body) },
  { method: "POST", path: "/api/portal/:locationId/upload", handler: (ctx) => storeMedia(ctx.body) },
  { method: "POST", path: "/api/portal/:locationId/verify", handler: (ctx) => verify(ctx.body) },

  // ── code pickers (Hunter's data in production) ──
  {
    method: "GET",
    path: "/api/hunter/naics-descriptions",
    handler: async (ctx) => {
      const titles = await naicsTitles();
      return listParam(ctx.query.get("codes"))
        .filter((code) => titles[code])
        .map((code) => ({ code, description: titles[code]! }));
    },
  },
  {
    method: "GET",
    path: "/api/hunter/naics-search",
    handler: async (ctx) => {
      const q = (ctx.query.get("q") ?? "").trim().toLowerCase();
      if (!q) return [];
      const words = q.split(/\s+/);
      const titles = await naicsTitles();
      const hits = Object.entries(titles).flatMap(([code, description]) => {
        const hay = `${code} ${description}`.toLowerCase();
        if (!words.every((w) => hay.includes(w))) return [];
        const rank = code === q ? 0 : code.startsWith(q) ? 1 : description.toLowerCase().startsWith(q) ? 2 : 3;
        return [{ code, description, rank }];
      });
      hits.sort((a, b) => a.rank - b.rank || a.code.localeCompare(b.code));
      return hits.slice(0, 20).map(({ code, description }) => ({ code, description }));
    },
  },
  { method: "GET", path: "/api/hunter/psc-search", handler: (ctx) => searchPsc(ctx.query.get("q") ?? "") },
  {
    method: "GET",
    path: "/api/hunter/psc-descriptions",
    handler: (ctx) => pscDescriptions(listParam(ctx.query.get("codes"))),
  },
  { method: "GET", path: "/api/hunter/psc-groups", handler: () => PSC_GROUPS },
  { method: "GET", path: "/api/hunter/psc-group", handler: (ctx) => pscGroupCodes(ctx.query.get("code") ?? "") },
  { method: "GET", path: "/api/hunter/cities", handler: (ctx) => citiesFor(ctx.query.get("state") ?? "") },

  // ── address lookup (Google Places in production) ──
  {
    method: "GET",
    path: "/api/places/autocomplete",
    handler: (ctx) => suggestAddresses(ctx.query.get("q") ?? ""),
  },
  {
    method: "GET",
    path: "/api/places/details",
    handler: (ctx) => addressForPlace(ctx.query.get("placeId") ?? ""),
  },
];
