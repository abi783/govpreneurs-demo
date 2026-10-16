import { afterEach, describe, expect, it, vi } from "vitest";

const apiFetch = vi.fn();
vi.mock("../api", () => ({ apiFetch, API_BASE_URL: "http://api.test" }));

const {
  confirmProfileUpdate,
  rejectProfileUpdate,
  readProfileUpdateAnswer,
  PROFILE_UPDATE_NOT_SENT,
} = await import("./profileUpdate");

function respond(status: number, body: unknown) {
  apiFetch.mockResolvedValueOnce({ ok: status < 400, status, json: async () => body });
}

afterEach(() => {
  apiFetch.mockReset();
  vi.restoreAllMocks();
});

describe("readProfileUpdateAnswer", () => {
  it("counts a change as saved only when the answer names the saved row", () => {
    expect(readProfileUpdateAnswer({ status: "confirmed", label: "Website" })).toEqual({
      status: "confirmed",
      label: "Website",
    });
    expect(readProfileUpdateAnswer({ status: "confirmed" })).toEqual({
      status: "unavailable",
      message: PROFILE_UPDATE_NOT_SENT,
    });
  });

  it("keeps the server's sentence for a refusal, a gone card and an outage", () => {
    for (const status of ["refused", "gone", "unavailable"] as const) {
      expect(readProfileUpdateAnswer({ status, message: "Why." })).toEqual({
        status,
        message: "Why.",
      });
    }
  });

  it("reads an unknown or empty shape as not sent, never as saved", () => {
    for (const body of [null, "saved", {}, { status: "ok" }, { status: "gone", message: "" }]) {
      expect(readProfileUpdateAnswer(body).status).toBe("unavailable");
    }
  });
});

describe("confirmProfileUpdate / rejectProfileUpdate", () => {
  it("posts her pick to the confirm route, with the id encoded", async () => {
    respond(200, { status: "confirmed", label: "Services" });

    const answer = await confirmProfileUpdate("a/b", ["Janitorial"]);

    expect(answer).toEqual({ status: "confirmed", label: "Services" });
    const [url, init] = apiFetch.mock.calls[0];
    expect(url).toBe("http://api.test/hunter-chat/profile-update/a%2Fb/confirm");
    expect(JSON.parse(init.body)).toEqual({ items: ["Janitorial"] });
  });

  it("sends no pick when the card asked for none", async () => {
    respond(200, { status: "confirmed", label: "Website" });

    await confirmProfileUpdate("p1");

    expect(JSON.parse(apiFetch.mock.calls[0][1].body)).toEqual({});
  });

  it("posts to the reject route", async () => {
    respond(200, { status: "rejected" });

    expect(await rejectProfileUpdate("p1")).toEqual({ status: "rejected" });
    expect(apiFetch.mock.calls[0][0]).toBe("http://api.test/hunter-chat/profile-update/p1/reject");
  });

  it("answers not sent on an HTTP error and on a network error", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    respond(500, {});
    expect(await confirmProfileUpdate("p1")).toEqual({
      status: "unavailable",
      message: PROFILE_UPDATE_NOT_SENT,
    });

    apiFetch.mockRejectedValueOnce(new Error("offline"));
    expect(await rejectProfileUpdate("p1")).toEqual({
      status: "unavailable",
      message: PROFILE_UPDATE_NOT_SENT,
    });
  });
});
