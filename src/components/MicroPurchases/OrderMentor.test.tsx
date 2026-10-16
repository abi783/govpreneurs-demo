// @vitest-environment jsdom
//
// "Send to mentor" on a small order runs the opportunity page's wiring: the
// plan gate, the 3-day deadline gate, the live wallet, and a real send to
// POST /opportunities/send-for-review. It used to write to a retired mock store
// in the browser, charged nothing and reached no mentor, while telling her
// "Sent to a mentor". These cases hold the real path.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LIVE_MAPPED_ORDERS } from "../../lib/microPurchases/liveMapperOutput.fixture";
import type { MicroOrder } from "../../lib/microPurchases/order";

const mocks = vi.hoisted(() => ({
  sendForReview: vi.fn(),
  refreshMentorReviews: vi.fn(),
  attachFileToSentReview: vi.fn(),
  fetchWalletBalance: vi.fn(),
  allowSendToMentor: vi.fn(),
  reviews: [] as { oppKey: string | null }[],
  listeners: new Set<() => void>(),
}));

vi.mock("../../lib/mentorApi", () => ({ sendForReview: mocks.sendForReview }));
vi.mock("../../lib/mentorReviewsApi", () => ({
  refreshMentorReviews: mocks.refreshMentorReviews,
  attachFileToSentReview: mocks.attachFileToSentReview,
  MENTOR_ATTACH_FAILED: "Sent, but the file didn't attach.",
  getMentorReviewsSnapshot: () => mocks.reviews,
  hasMentorReviewsLoaded: () => true,
  subscribeMentorReviews: (fn: () => void) => {
    mocks.listeners.add(fn);
    return () => mocks.listeners.delete(fn);
  },
}));
vi.mock("../../lib/walletApi", async (actual) => ({
  ...(await actual<typeof import("../../lib/walletApi")>()),
  fetchWalletBalance: mocks.fetchWalletBalance,
}));
vi.mock("../../lib/entitlements", async (actual) => ({
  ...(await actual<typeof import("../../lib/entitlements")>()),
  allowSendToMentor: mocks.allowSendToMentor,
}));
vi.mock("../../lib/ghlUser", () => ({
  useGhlUser: () => ({ session: { userId: "user-1", locationId: "loc-1", productId: null } }),
}));
vi.mock("../Opportunity/MentorUpsellModal", () => ({
  MentorUpsellModal: ({ open }: { open: boolean }) => (open ? <p>Upgrade to send</p> : null),
}));

const { OrderMentor } = await import("./OrderMentor");

/** A day this many days from now, as the order's closing day. */
function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString().slice(0, 10);
}

/** A new id per order: an order sent in one case stays sent for this visit. */
let nextId = 0;

function order(overrides: Partial<MicroOrder> = {}): MicroOrder {
  nextId += 1;
  return {
    ...LIVE_MAPPED_ORDERS[0],
    id: `dibbs-order-${nextId}`,
    solicitation: "SPE7M126T1234",
    closesOn: daysFromNow(10),
    ...overrides,
  };
}

function renderControl(o: MicroOrder, hideWhenTooLate = false) {
  return render(
    <OrderMentor
      order={o}
      whatSheIsSending="Quote less than $4.80 for each piece."
      label="Send to mentor"
      className="btn"
      hideWhenTooLate={hideWhenTooLate}
    />,
  );
}

const QUESTION = "I can get this part from a distributor. Can I still quote?";

/** Fill the dialog's required answers. */
function completeForm() {
  fireEvent.click(screen.getByLabelText(/I've read the order and the part details/));
  fireEvent.click(screen.getByLabelText(/Pricing my quote/));
  fireEvent.change(screen.getByLabelText(/Your question for the mentor/), {
    target: { value: QUESTION },
  });
}

beforeEach(() => {
  mocks.attachFileToSentReview.mockReset().mockResolvedValue(undefined);
  mocks.sendForReview.mockReset().mockResolvedValue({ success: true });
  mocks.refreshMentorReviews.mockReset().mockResolvedValue([]);
  mocks.fetchWalletBalance.mockReset().mockResolvedValue({ balance: 500, chargeAmount: 97 });
  mocks.allowSendToMentor.mockReset().mockReturnValue(true);
  mocks.reviews = [];
});

afterEach(() => {
  cleanup();
});

describe("sending a small order to a mentor", () => {
  it("sends it through send-for-review with its solicitation and order id, then refreshes Mentors", async () => {
    const o = order();
    renderControl(o);

    fireEvent.click(screen.getByRole("button", { name: /Send to mentor/ }));
    const send = await screen.findByRole("button", { name: /Send for \$97\.00/ });
    completeForm();
    await waitFor(() => expect((send as HTMLButtonElement).disabled).toBe(false));
    await act(async () => {
      fireEvent.click(send);
    });

    expect(mocks.sendForReview).toHaveBeenCalledWith({
      userId: "user-1",
      locationId: "loc-1",
      solNumbers: ["SPE7M126T1234"],
      opportunityIds: [o.id],
      message:
        "Confirmed: I've read the order and the part details.\n" +
        `Help with: Pricing my quote.\nQuestion: ${QUESTION}`,
    });
    expect(mocks.attachFileToSentReview).not.toHaveBeenCalled();
    expect(mocks.refreshMentorReviews).toHaveBeenCalled();
    // Sent: the control stands down, and each caller shows its own sent line.
    expect(screen.queryByRole("button", { name: /Send to mentor/ })).toBeNull();
  });

  it("attaches her file to the review the send opened", async () => {
    const o = order();
    renderControl(o);

    fireEvent.click(screen.getByRole("button", { name: /Send to mentor/ }));
    const send = await screen.findByRole("button", { name: /Send for \$97\.00/ });
    completeForm();
    const pdf = new File(["%PDF"], "supplier-quote.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByLabelText(/Attach a file/), { target: { files: [pdf] } });
    await waitFor(() => expect((send as HTMLButtonElement).disabled).toBe(false));
    await act(async () => {
      fireEvent.click(send);
    });

    expect(mocks.attachFileToSentReview).toHaveBeenCalledWith(o.id, pdf);
    expect(screen.queryByRole("button", { name: /Send to mentor/ })).toBeNull();
  });

  it("says the file did not attach, without calling the send a failure", async () => {
    mocks.attachFileToSentReview.mockRejectedValue(new Error("upload failed"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    renderControl(order());

    fireEvent.click(screen.getByRole("button", { name: /Send to mentor/ }));
    const send = await screen.findByRole("button", { name: /Send for \$97\.00/ });
    completeForm();
    fireEvent.change(screen.getByLabelText(/Attach a file/), {
      target: { files: [new File(["x"], "spec.png")] },
    });
    await waitFor(() => expect((send as HTMLButtonElement).disabled).toBe(false));
    await act(async () => {
      fireEvent.click(send);
    });

    expect((await screen.findByRole("alert")).textContent).toBe(
      "Sent, but the file didn't attach.",
    );
    expect(screen.queryByRole("button", { name: /Send to mentor/ })).toBeNull();
  });

  it("reads the real wallet, not a stored one", async () => {
    mocks.fetchWalletBalance.mockResolvedValue({ balance: 20, chargeAmount: 97 });
    renderControl(order());

    fireEvent.click(screen.getByRole("button", { name: /Send to mentor/ }));

    expect(mocks.fetchWalletBalance).toHaveBeenCalledWith("loc-1");
    expect(await screen.findByText(/Your wallet has \$20\.00/)).toBeTruthy();
  });

  it("says why when the send fails, and keeps the control", async () => {
    mocks.sendForReview.mockRejectedValue(new Error("Insufficient wallet balance"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    renderControl(order());

    fireEvent.click(screen.getByRole("button", { name: /Send to mentor/ }));
    const send = await screen.findByRole("button", { name: /Send for \$97\.00/ });
    completeForm();
    await waitFor(() => expect((send as HTMLButtonElement).disabled).toBe(false));
    await act(async () => {
      fireEvent.click(send);
    });

    // The dialog stays open on a failure, so the page behind it is hidden from
    // the accessibility tree while it is; `hidden: true` reads it anyway.
    const alert = await screen.findByRole("alert", { hidden: true });
    expect(alert.textContent).toBe("Insufficient wallet balance");
    expect(screen.getByRole("button", { name: /Send to mentor/, hidden: true })).toBeTruthy();
  });
});

describe("the gates the opportunity page applies", () => {
  it("opens the upgrade offer for a plan without mentor reviews, and sends nothing", () => {
    mocks.allowSendToMentor.mockReturnValue(false);
    renderControl(order());

    fireEvent.click(screen.getByRole("button", { name: /Send to mentor/ }));

    expect(screen.getByText("Upgrade to send")).toBeTruthy();
    expect(mocks.sendForReview).not.toHaveBeenCalled();
  });

  it("disables the control inside 3 days of the closing day, and says why", () => {
    renderControl(order({ closesOn: daysFromNow(2) }));

    const button = screen.getByRole("button", { name: /Send to mentor/ }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.parentElement?.getAttribute("title")).toMatch(/not enough time to prepare/);
  });

  it("hides the control there instead, where the caller asks it to", () => {
    const { container } = renderControl(order({ closesOn: daysFromNow(-30) }), true);

    expect(container.textContent).toBe("");
  });

  it("shows no control for an order the Mentors list already holds", () => {
    const o = order();
    mocks.reviews = [{ oppKey: o.id }];
    const { container } = renderControl(o);

    expect(container.textContent).toBe("");
  });
});
