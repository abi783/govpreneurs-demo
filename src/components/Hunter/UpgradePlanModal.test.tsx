// @vitest-environment jsdom
//
// Simulation of the Pilot → Expert → Elite upgrade modal with MOCK DATA:
// a fake Pilot session + a mocked trade-in credit response. Exercises the real
// component (coupon rendering + the checkout → confirm state machine) without a
// live GHL session or backend billing endpoints.
import { useState } from "react";
import { render, screen, waitFor, cleanup, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PILOT_PLAN_PRODUCT_ID } from "../../lib/plans";

// --- Mock the GHL session: a Pilot-plan user (drives the full plan ladder) ---
const refetch = vi.fn();
vi.mock("../../lib/ghlUser", () => ({
  useGhlUser: () => ({
    session: {
      userId: "user_mock_1",
      activeLocation: "loc_mock_1",
      locationId: "loc_mock_1",
      productId: PILOT_PLAN_PRODUCT_ID,
    },
    loading: false,
    error: null,
    refetch,
  }),
}));

// --- Mock the billing API: a $497 trade-in credit + a checkout link ---
const getCredit = vi.fn(async () => ({
  planCharges: 0,
  perDayCharge: "0",
  creditAmount: "497",
}));
const upgradePlan = vi.fn(async () => ({
  link: "https://checkout.example/pay?couponCode=TRADEIN497",
}));
// Return the *same* productId so the confirm poll doesn't auto-close the modal.
const getUserSubscription = vi.fn(async () => ({ productId: PILOT_PLAN_PRODUCT_ID }));
vi.mock("../../lib/billing", () => ({
  getCredit: (...a: unknown[]) => getCredit(...(a as [])),
  upgradePlan: (...a: unknown[]) => upgradePlan(...(a as [])),
  getUserSubscription: (...a: unknown[]) => getUserSubscription(...(a as [])),
}));

// Imported after the mocks are declared (vi.mock is hoisted, so this is safe).
import { UpgradePlanModal } from "./UpgradePlanModal";

function Harness() {
  const [open, setOpen] = useState(true);
  return (
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <UpgradePlanModal open={open} onOpenChange={setOpen} />
      <span data-testid="modal-open">{String(open)}</span>
    </QueryClientProvider>
  );
}

afterEach(cleanup);

describe("UpgradePlanModal — coupon / trade-in credit (mock data)", () => {
  it("renders the trade-in credit, 'You save', due-today and 'starts today' for each upgrade plan", async () => {
    render(<Harness />);

    // The credit query resolves → the trade-in block replaces the plain price.
    // Current plan is Pilot, so the label reads "Pilot Trade-in credit".
    await waitFor(() =>
      expect(screen.getAllByText(/Pilot Trade-in credit/i).length).toBeGreaterThan(0),
    );

    // Credit shown on both upgrade cards (Expert + Elite), not on the current Pilot card.
    expect(screen.getAllByText(/Pilot Trade-in credit/i)).toHaveLength(2);
    expect(screen.getAllByText(/-\$497/)).toHaveLength(2);
    expect(screen.getAllByText(/You save \$497/i)).toHaveLength(2);

    // Due today = price − credit:  Expert 2497-497=2000,  Elite 4997-497=4500.
    expect(screen.getByText("$2,000")).toBeTruthy();
    expect(screen.getByText("$4,500")).toBeTruthy();

    // "Your new {duration} starts today" line, per v1.
    expect(screen.getByText(/Your new 10 months program starts today/i)).toBeTruthy();
    expect(screen.getByText(/Your new 12 months program starts today/i)).toBeTruthy();

    // The Pilot (current) card shows "Current plan", never a trade-in.
    expect(screen.getByText(/Current plan/i)).toBeTruthy();
  });

  it("clicking 'Upgrade now' opens the coupon checkout link, then dismissing it shows the confirm poll WITHOUT closing the modal", async () => {
    render(<Harness />);

    await waitFor(() => expect(screen.getAllByText("Upgrade now").length).toBeGreaterThan(0));
    fireEvent.click(screen.getAllByText("Upgrade now")[0]);

    // Mutation fired with a plan product id, and the checkout iframe (coupon link) appears.
    await waitFor(() => expect(upgradePlan).toHaveBeenCalledTimes(1));
    const iframe = (await screen.findByTitle("Upgrade checkout")) as HTMLIFrameElement;
    expect(iframe.src).toContain("couponCode=TRADEIN497");

    // Dismiss the checkout (the header X). This must NOT close the modal — it
    // transitions to the "Processing your payment…" confirm poll (the bug fix).
    fireEvent.click(screen.getByLabelText("Close"));

    expect(await screen.findByText(/Processing your payment/i)).toBeTruthy();
    expect(screen.getByTestId("modal-open").textContent).toBe("true");
  });

  it("auto-closes and refreshes the session once the subscription upgrade lands", async () => {
    // This run: the poll observes an upgraded productId → refetch + close.
    getUserSubscription.mockResolvedValueOnce({ productId: "prod_upgraded_elite" });
    render(<Harness />);

    await waitFor(() => expect(screen.getAllByText("Upgrade now").length).toBeGreaterThan(0));
    fireEvent.click(screen.getAllByText("Upgrade now")[0]);
    await screen.findByTitle("Upgrade checkout");
    fireEvent.click(screen.getByLabelText("Close"));

    await waitFor(() => expect(refetch).toHaveBeenCalled(), { timeout: 15000 });
    await waitFor(() => expect(screen.getByTestId("modal-open").textContent).toBe("false"), {
      timeout: 15000,
    });
  });
});
