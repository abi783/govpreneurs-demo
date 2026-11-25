// @vitest-environment jsdom
// ST-04: an API failure shows friendly copy, never the raw "Failed to fetch".
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("../../lib/partnersApi", async (orig) => ({
  ...(await orig<typeof import("../../lib/partnersApi")>()),
  fetchPipeline: vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
  fetchPartners: vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
}));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: unknown }) => <a>{children as never}</a>,
  useNavigate: () => vi.fn(),
}));

import { MyPartnersView } from "./MyPartnersView";

afterEach(cleanup);

describe("My partners load failure", () => {
  it("shows friendly copy, not the raw error", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    render(<MyPartnersView onSwitchToFind={() => undefined} profileReady />);
    await screen.findByText("Could not load your list.");
    expect(screen.queryByText("Failed to fetch")).toBeNull();
  });
});
