// DEMO API area: The member workspace.
// Owns: /workspace, /workspace/saved-opps*, /workspace/saved-searches*.
// State lives in src/demo/state/workspace.ts (shared with every page that saves).

import type { DemoRouteDef } from "../runtime/router";
import {
  addSavedSearch,
  describeSaved,
  getSavedOpps,
  getSavedSearches,
  removeSavedSearch,
  setSaved,
} from "../state/workspace";
import { newId } from "./util";

export const routes: DemoRouteDef[] = [
  {
    method: "GET",
    path: "/workspace",
    handler: () => ({ savedOpps: getSavedOpps(), savedSearches: getSavedSearches() }),
  },
  {
    method: "GET",
    path: "/workspace/saved-opps/details",
    handler: () => getSavedOpps().map(describeSaved).filter((d) => d !== null),
  },
  {
    method: "POST",
    path: "/workspace/saved-opps",
    handler: ({ body }) => {
      if (body?.oppKey) setSaved(String(body.oppKey), true);
      return { ok: true };
    },
  },
  {
    method: "DELETE",
    path: "/workspace/saved-opps/:oppKey",
    handler: ({ params }) => {
      setSaved(decodeURIComponent(params.oppKey), false);
      return { ok: true };
    },
  },
  {
    method: "POST",
    path: "/workspace/saved-searches",
    handler: ({ body }) => {
      const s = { id: newId("search"), name: String(body?.name ?? "Saved search"), filters: body?.filters ?? {}, createdAt: new Date().toISOString() };
      addSavedSearch(s);
      return s;
    },
  },
  {
    method: "DELETE",
    path: "/workspace/saved-searches/:id",
    handler: ({ params }) => {
      removeSavedSearch(params.id);
      return { ok: true };
    },
  },
];
