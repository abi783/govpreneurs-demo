import { describe, expect, it } from "vitest";
import { AGENCY_USER_TYPE, posthogIdentity, sessionSuperProperties } from "./analyticsSession";

describe("sessionSuperProperties", () => {
  it("marks an agency (team) user as an admin session", () => {
    expect(sessionSuperProperties({ type: AGENCY_USER_TYPE })).toEqual({
      is_admin_session: true,
      ghl_user_type: "agency",
    });
  });

  it("does not mark a sub-account user", () => {
    expect(sessionSuperProperties({ type: "account" })).toEqual({
      is_admin_session: false,
      ghl_user_type: "account",
    });
  });

  it("leaves the flag unknown when the session carries no type", () => {
    // An absent type is not evidence of a member, so it is not collapsed to false.
    expect(sessionSuperProperties({ type: "" })).toEqual({
      is_admin_session: null,
      ghl_user_type: null,
    });
    expect(sessionSuperProperties({ type: undefined })).toEqual({
      is_admin_session: null,
      ghl_user_type: null,
    });
  });
});

describe("posthogIdentity", () => {
  // buildSession puts the location owner's id and email in userId and email.
  const session = {
    userId: "owner-user-id",
    email: "owner@member.example",
    userName: "Logged In Person",
    locationId: "loc123",
    role: "admin",
    planId: "plan_1",
    saasMode: "activated",
    viewerUserId: "ghlUser42",
    viewerEmail: "staff@govpreneurs.example",
  };

  it("identifies a team member as themselves, never as the member", () => {
    expect(posthogIdentity({ ...session, type: AGENCY_USER_TYPE })).toEqual({
      distinctId: "team:ghlUser42",
      properties: {
        is_team_member: true,
        name: "Logged In Person",
        email: "staff@govpreneurs.example",
      },
    });
  });

  it("identifies a member with the member's facts", () => {
    expect(posthogIdentity({ ...session, type: "account" })).toEqual({
      distinctId: "owner-user-id",
      properties: {
        is_team_member: false,
        email: "owner@member.example",
        name: "Logged In Person",
        location_id: "loc123",
        role: "admin",
        plan_id: "plan_1",
        saas_mode: "activated",
      },
    });
  });

  it("does not identify a team session that has no viewer id", () => {
    // A session cached before the backend sent viewerUserId.
    expect(
      posthogIdentity({ ...session, type: AGENCY_USER_TYPE, viewerUserId: undefined }),
    ).toBeNull();
  });

  it("does not identify a session with no type", () => {
    expect(posthogIdentity({ ...session, type: "" })).toBeNull();
  });
});
