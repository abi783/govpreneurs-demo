// DEMO API area: One opportunity.
// Owns: GET /opportunities/discover/v2/:oppKey and the document downloads under it.
//
// Path scheme (see src/demo/runtime/router.ts): paths for frontend-v2 code have no
// prefix (`/opportunities/...`). Paths for lifted Success Center code keep `/api`.
// The full list of calls, with request and response types, is in ENDPOINTS.md.
// Keep a visitor's changes in src/demo/runtime/store.ts so they survive a reload.
//
// The page data is built from the story (src/demo/grant/detail.ts). The sample
// PDFs are written on the fly (src/demo/grant/documents.ts).

import { demoResponse, type DemoRouteDef } from "../runtime/router";
import { buildDetail } from "../grant/detail";
import { renderDocument, renderGenericDocument } from "../grant/documents";

export const routes: DemoRouteDef[] = [
  {
    method: "GET",
    path: "/opportunities/discover/v2/:oppKey",
    // An id that is not in the story answers `null`. The page then shows its own
    // "Opportunity not found" card instead of an error.
    handler: ({ params }) => buildDetail(params.oppKey),
  },
  {
    method: "GET",
    path: "/opportunities/discover/v2/:oppKey/documents",
    handler: async ({ params, query }) => {
      const fileName = query.get("fileName") ?? "";
      // A key outside the story (a small order or a forecast that shares this path)
      // gets a sample document that says what it is, not an error.
      const file =
        (await renderDocument(params.oppKey, fileName)) ??
        (fileName ? await renderGenericDocument(params.oppKey, fileName) : null);
      if (!file) return demoResponse(404, { message: "File not available" });
      const body = new Blob([file.bytes as BlobPart], { type: "application/pdf" });
      return new Response(body, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${file.fileName.replace(/"/g, "")}"`,
        },
      });
    },
  },
];
