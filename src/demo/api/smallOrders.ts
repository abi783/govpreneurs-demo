// DEMO API area: Small Orders (DLA product buys).
// Owns: /small-orders*.
//
// The orders are made-up DLA buys (src/demo/explore/orders/data.ts): 20 food-service
// buys for the caterer, 10 parts and supplies orders for the agency.
// The member's answers on the board live in the demo store under `explore.smallOrders.state`.
// A saved order is a saved opportunity: the shared saved list (src/demo/state/workspace.ts)
// holds the key, and the resolver below tells the Pipeline how to draw the card.

import { MEMBER } from "../member";
import type { DemoRouteDef } from "../runtime/router";
import { demoResponse } from "../runtime/router";
import { readDemoState, writeDemoState } from "../runtime/store";
import { registerSavedResolver, setSaved } from "../state/workspace";
import { dayToIso } from "../explore/dates";
import { acquisitionCodeDocuments } from "../explore/orders/acquisitionCodes";
import { ORDERS, findOrder } from "../explore/orders/data";
import { categoryCounts, codeCensus, decodeCursor, feedPage, fitScores } from "../explore/orders/feed";
import { readMemberState, writeMemberState } from "../explore/orders/memberState";
import { orderPaperPdf } from "../explore/orders/paper";
import { supplierNames } from "../explore/orders/suppliers";
import { badRequest, notFound } from "./util";

// A saved small order shows on the Pipeline as a product-buy card.
registerSavedResolver((oppKey) => {
  const order = findOrder(oppKey);
  if (!order) return null;
  return {
    oppKey: order.id,
    title: order.plainName,
    agency: order.buyer,
    dueDate: order.closesOn ? dayToIso(order.closesOn) : null,
    sourceType: "dibbs",
  };
});

// Amira already sent a price on the pasta order (memberState.ts), so she has kept it.
// Seed it once per demo session: the flag stops it coming back after she un-saves it.
// DEMO: the caterer only. No order fits the agency, so she has saved none.
const SEEDED = "explore.smallOrders.seeded";
if (MEMBER === "caterer" && typeof window !== "undefined" && !readDemoState<boolean>(SEEDED, false)) {
  setSaved("mp-109", true);
  writeDemoState(SEEDED, true);
}

function list(value: string | null): string[] {
  return value ? value.split(",").map((v) => v.trim()).filter(Boolean) : [];
}

export const routes: DemoRouteDef[] = [
  {
    method: "GET",
    path: "/small-orders/feed",
    handler: ({ query }) => {
      const after = query.get("after");
      if (after) {
        const cursor = decodeCursor(after);
        // A token that is not ours is a 400, as in production.
        if (!cursor) return badRequest("That page cursor is not valid.");
        return feedPage(cursor, cursor.served);
      }
      return feedPage({
        view: query.get("view") === "for-you" ? "for-you" : "all",
        categories: list(query.get("categories")),
        codes: list(query.get("codes")),
        bidCodes: query.has("bidCodes") ? list(query.get("bidCodes")) : null,
      });
    },
  },
  {
    method: "GET",
    path: "/small-orders/orders/:orderId",
    handler: ({ params }) => findOrder(params.orderId) ?? notFound("That order is not here any more."),
  },
  {
    method: "GET",
    path: "/small-orders/orders",
    handler: ({ query }) => {
      const ids = list(query.get("ids"));
      return { orders: ids.map((id) => findOrder(id)).filter((o) => o !== undefined) };
    },
  },
  {
    method: "GET",
    path: "/small-orders/orders/:orderId/suppliers",
    handler: ({ params }) => {
      const order = findOrder(params.orderId);
      if (!order) return notFound("That order is not here any more.");
      return supplierNames([...order.awards.map((a) => a.cage), ...order.approvedSources.map((s) => s.cage)]);
    },
  },
  {
    // The sample order paper: a real one-page PDF.
    method: "GET",
    path: "/small-orders/orders/:orderId/documents",
    handler: ({ params }) => {
      const bytes = orderPaperPdf(params.orderId);
      const order = findOrder(params.orderId);
      if (!bytes || !order) return notFound("No order paper for this one.");
      return new Response(bytes as BlobPart, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${order.solicitation}.pdf"`,
        },
      });
    },
  },
  { method: "GET", path: "/small-orders/state", handler: () => readMemberState() },
  {
    method: "PUT",
    path: "/small-orders/state",
    handler: ({ body }) => {
      if (body === null || typeof body !== "object" || Array.isArray(body)) {
        return demoResponse(400, { message: "The state must be an object." });
      }
      writeMemberState(body);
      return { ok: true };
    },
  },
  {
    method: "GET",
    path: "/small-orders/acquisition-codes",
    handler: () => acquisitionCodeDocuments(),
  },
  { method: "GET", path: "/small-orders/code-census", handler: () => codeCensus() },
  {
    method: "GET",
    path: "/small-orders/naics-categories",
    handler: ({ query }) => {
      const naics = list(query.get("naics"));
      if (naics.length === 0) return badRequest("The naics query value is required.");
      return categoryCounts(naics);
    },
  },
  {
    method: "GET",
    path: "/small-orders/fit",
    handler: ({ query }) => ({ scores: fitScores(list(query.get("ids"))) }),
  },
];

// Orders are read by id above; this keeps the list in one place for tests.
export const SMALL_ORDER_COUNT = ORDERS.length;
