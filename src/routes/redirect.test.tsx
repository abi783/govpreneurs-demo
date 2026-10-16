// @vitest-environment jsdom
//
// The notification landing hop. A small-order link (`kind=small-order`) must
// store a small-order deep-link and ask for the Small Orders menu link; an
// opportunity link must store and ask exactly what it did before.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, waitFor } from "@testing-library/react";
import type { ComponentType } from "react";
import { OPP_DEEPLINK_KEY } from "../lib/ghlNav";

let search: Record<string, unknown> = {};

vi.mock("@tanstack/react-router", () => ({
  createFileRoute:
    () =>
    (opts: {
      validateSearch: (s: Record<string, unknown>) => unknown;
      component: ComponentType;
    }) => ({
      ...opts,
      useSearch: () => opts.validateSearch(search),
    }),
}));
vi.mock("../lib/api", () => ({ API_BASE_URL: "https://api.test" }));

const { Route } = await import("./redirect");
const RedirectPage = (Route as unknown as { component: ComponentType }).component;

const fetchMock = vi.fn();

beforeEach(() => {
  window.localStorage.clear();
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ json: () => Promise.resolve({ link: "#ghl" }) });
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function land(params: Record<string, unknown>) {
  search = params;
  render(<RedirectPage />);
  await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  return {
    stored: JSON.parse(window.localStorage.getItem(OPP_DEEPLINK_KEY) ?? "null"),
    url: fetchMock.mock.calls[0][0] as string,
  };
}

describe("/redirect", () => {
  it("stores an opportunity deep-link and asks for the default menu link", async () => {
    const { stored, url } = await land({ locationId: "loc-1", opportunityId: "opp-1" });
    expect(stored).toMatchObject({ v: 1, opportunityId: "opp-1" });
    expect(stored).not.toHaveProperty("kind");
    expect(url).toBe("https://api.test/opportunities/redirect/v2?locationId=loc-1");
  });

  it("stores a small-order deep-link and asks for the small-orders menu link", async () => {
    const { stored, url } = await land({
      locationId: "loc-1",
      opportunityId: "ord-1",
      kind: "small-order",
    });
    expect(stored).toMatchObject({ v: 1, opportunityId: "ord-1", kind: "small-order" });
    expect(url).toBe(
      "https://api.test/opportunities/redirect/v2?locationId=loc-1&target=small-orders",
    );
  });

  it("treats an unknown kind as an opportunity", async () => {
    const { stored, url } = await land({
      locationId: "loc-1",
      opportunityId: "opp-2",
      kind: "award",
    });
    expect(stored).not.toHaveProperty("kind");
    expect(url).toBe("https://api.test/opportunities/redirect/v2?locationId=loc-1");
  });
});
