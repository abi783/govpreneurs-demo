/**
 * menuLink.ts — addressing a surface that lives outside this app. ENTITY LAYER:
 * a pure string builder, no imports at all.
 *
 * F20. Some destinations are GHL custom-menu-links, not routes of ours: the
 * warm-start wizard (F16b) and the roadmap's entity-registration step. A bare
 * `/{locationId}/…` href does not reach them — the app runs inside the GHL
 * iframe, so the link must break out of the frame (`target="_top"`) to an
 * address GHL knows.
 *
 * One builder, because the template was written three times over (the rail,
 * the LLC card, and twice inside `onboarding.ts`). It lives HERE, and not beside
 * the components that first needed it, because that is what makes it shareable:
 * `onboarding.ts` is an adapter and may not import outward into
 * `src/components`, so a builder in the component folder could only ever serve
 * half its callers. The GUIDs stay with the features that own them; only the
 * shape of the address lives here.
 */

/** The GHL address of one custom-menu-link, for `target="_top"`. */
export function menuLinkHref(locationId: string, menuLinkId: string): string {
  return `https://app.govpreneurs.com/v2/location/${locationId}/custom-menu-link/${menuLinkId}`;
}

/**
 * The member's roadmap in the GHL dashboard. Kept here, beside the builder,
 * because the task card runs in the browser and cannot import `onboarding.ts`
 * (it reads the database). `onboarding.ts` re-exports it.
 */
export const ROADMAP_MENU_LINK_ID = "4dbc012e-3002-4f37-99fb-f8ef9807fd82";
