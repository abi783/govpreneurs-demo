// @vitest-environment jsdom
//
// Covers the balance-polling wiring added to the insufficient-balance state:
// while the modal is open and short, it polls `fetchWalletBalance` every 1s
// and re-renders into the sendable state the moment the recharge lands,
// without the member closing/reopening. The polling MECHANICS (interval
// timing, overlap-skip, unmount cleanup) are covered in depth by
// useWalletBalancePolling.test.ts — this suite only proves the modal wires
// that hook's result into its render branches correctly.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, cleanup, act, fireEvent } from "@testing-library/react";
import { SendToMentorModal } from "./SendToMentorModal";
import * as walletApi from "../../lib/walletApi";
import type { Opportunity } from "../../lib/mock/opportunities";
import type { GrantVerdict } from "../../lib/mock/grantAnalysis";

const opp: Opportunity = {
  noticeId: "N001",
  title: "Test Opportunity",
  agency: "Test Agency",
  workType: "Services",
  valueLow: 0,
  valueHigh: 0,
  location: "Remote",
  closesAt: new Date().toISOString(),
  postedAt: null,
  matchTier: "good",
  matchScore: 80,
  hunterReasoning: "",
  eligibility: null,
  mode: "prime",
  scope: "fed",
};

const verdict: GrantVerdict = {
  call: "Bid",
  rationale: "Strong fit.",
  winTier: "Open",
  winTierReason: "",
  fitMatrix: [],
  nextStep: "",
  seedMessage: "",
  suggestions: [],
  authored: false,
};

/** Fill the required form so only the wallet decides the confirm button. */
function completeForm() {
  fireEvent.click(screen.getByLabelText(/I've read the scope of work/));
  fireEvent.click(screen.getByLabelText(/Should I bid on this\?/));
  fireEvent.change(screen.getByLabelText(/Your question for the mentor/), {
    target: { value: "Is my roofing past performance enough for this water plant job?" },
  });
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("SendToMentorModal — recharge polling", () => {
  it("polls while short and flips to the sendable state once the recharge lands", async () => {
    vi.useFakeTimers();
    const fetchSpy = vi
      .spyOn(walletApi, "fetchWalletBalance")
      .mockResolvedValueOnce({ balance: 120, chargeAmount: 97 });

    render(
      <SendToMentorModal
        opp={opp}
        verdict={verdict}
        open
        onOpenChange={() => {}}
        onConfirm={() => {}}
        balance={10}
        chargeAmount={97}
        locationId="loc1"
      />,
    );

    completeForm();
    // Insufficient-balance state shown up front, from the prop.
    expect(screen.getByText(/Your wallet has \$10\.00/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Send for \$97\.00/ })).toHaveProperty(
      "disabled",
      true,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(fetchSpy).toHaveBeenCalledWith("loc1");
    // Recharge landed — shortfall copy gone, confirm button enabled.
    expect(screen.queryByText(/Your wallet has/)).toBeNull();
    expect(screen.getByRole("button", { name: /Send for \$97\.00/ })).toHaveProperty(
      "disabled",
      false,
    );
  });

  it("does not poll when the balance is already sufficient", async () => {
    vi.useFakeTimers();
    const fetchSpy = vi.spyOn(walletApi, "fetchWalletBalance");

    render(
      <SendToMentorModal
        opp={opp}
        verdict={verdict}
        open
        onOpenChange={() => {}}
        onConfirm={() => {}}
        balance={200}
        chargeAmount={97}
        locationId="loc1"
      />,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(6000);
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("stops polling once the modal closes", async () => {
    vi.useFakeTimers();
    const fetchSpy = vi.spyOn(walletApi, "fetchWalletBalance").mockResolvedValue({
      balance: 10,
      chargeAmount: 97,
    });

    const { rerender } = render(
      <SendToMentorModal
        opp={opp}
        verdict={verdict}
        open
        onOpenChange={() => {}}
        onConfirm={() => {}}
        balance={10}
        chargeAmount={97}
        locationId="loc1"
      />,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    rerender(
      <SendToMentorModal
        opp={opp}
        verdict={verdict}
        open={false}
        onOpenChange={() => {}}
        onConfirm={() => {}}
        balance={10}
        chargeAmount={97}
        locationId="loc1"
      />,
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
