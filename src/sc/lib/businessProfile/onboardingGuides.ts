/**
 * Screenshots that walk a member through a getting-started step.
 *
 * Its own module because both the server-side onboarding state and the client
 * task card need it, and importing it from `onboarding.ts` would drag Prisma —
 * and with it `node:module` — into the browser bundle.
 */

/**
 * Where the Audit lives on the roadmap. Shown on the open compliance task.
 *
 * SERVED FROM `public/`, NOT A CDN. It was a `filesafe.space` URL — GHL's
 * media library — which put a screenshot of OUR roadmap somewhere this repo
 * cannot see. The picture documents a page that changes with the code, so a
 * redesign here left a guide out there still showing the old screen, and
 * nothing in a review would notice. Versioned with the thing it describes, it
 * changes in the same commit or not at all.
 *
 * The Dockerfile copies `public/` into the runtime image (`COPY --from=builder
 * /app/public ./public`), which `output: standalone` does not do by itself.
 */
export const COMPLIANCE_GUIDE_IMG = "/guides/compliance-audit.png";
