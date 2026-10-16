// PostHog super properties that say who is really behind a session.
//
// `identify` in __root.tsx cannot tell a GovPreneurs team member from the
// member whose account they are in: GhlSessionService.buildSession replaces the
// GHL token's userId and email with the LOCATION owner's. A team member who
// switches into a member's sub-account is therefore identified as that member,
// and everything they click is counted as the member's own use of the app.
//
// GoHighLevel's `type` is not replaced — it reaches the session through the
// `...hlData` spread. It is "agency" for an agency (GovPreneurs team) user and
// "account" for a sub-account user, so it is the field that separates the two.
import type { GhlUserSession } from "./ghlUser";

/** GoHighLevel's user `type` for an agency-level (team) user. */
export const AGENCY_USER_TYPE = "agency";

export interface SessionSuperProperties {
  /** True for an agency (team) user, false for a sub-account user, and null
   *  when the session carries no type — an absent type is not a member. */
  is_admin_session: boolean | null;
  /** GoHighLevel's raw user type, kept so the rule above can be checked. */
  ghl_user_type: string | null;
}

export function sessionSuperProperties(
  session: Partial<Pick<GhlUserSession, "type">>,
): SessionSuperProperties {
  const type = typeof session.type === "string" && session.type !== "" ? session.type : null;
  return {
    is_admin_session: type === null ? null : type === AGENCY_USER_TYPE,
    ghl_user_type: type,
  };
}

/** The distinct id prefix of a team member. The Success Center portal uses the
 *  same prefix, so one team member is one PostHog person in both apps. */
export const TEAM_DISTINCT_ID_PREFIX = "team:";

export interface PosthogIdentity {
  distinctId: string;
  properties: Record<string, unknown>;
}

type IdentitySession = Pick<
  GhlUserSession,
  "type" | "userId" | "email" | "userName" | "locationId" | "role" | "planId" | "saasMode"
> &
  Pick<Partial<GhlUserSession>, "viewerUserId" | "viewerEmail">;

/**
 * Who PostHog must identify for this session, or null to not identify.
 *
 * A team member is their own person, `team:<GHL user id>`, never the member
 * whose account they opened. `userName` and `role` belong to the logged-in
 * user, so they go only on that user's own person.
 *
 * No identify when the session has no type (we cannot tell a team member from
 * a member), or when a team session has no `viewerUserId` (a session that the
 * backend cached before it sent the field).
 */
export function posthogIdentity(session: IdentitySession): PosthogIdentity | null {
  const { is_admin_session: isTeam } = sessionSuperProperties(session);
  if (isTeam === null) return null;
  if (isTeam) {
    if (!session.viewerUserId) return null;
    return {
      distinctId: `${TEAM_DISTINCT_ID_PREFIX}${session.viewerUserId}`,
      properties: { is_team_member: true, name: session.userName, email: session.viewerEmail },
    };
  }
  return {
    distinctId: session.userId,
    properties: {
      is_team_member: false,
      email: session.email,
      name: session.userName,
      location_id: session.locationId,
      role: session.role,
      plan_id: session.planId,
      saas_mode: session.saasMode,
    },
  };
}
