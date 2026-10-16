// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { OrganicOfferChips } from "./OrganicOfferChips";
import type { OrganicOffer } from "../../lib/enrichment";

afterEach(cleanup);

const offer: OrganicOffer = {
  id: "service states:confirm",
  field: "service states",
  label: "Where you work",
  askType: "confirm",
  question: "Should I add Texas to the states you serve?",
  proposal: {
    value: "TX",
    provenance: {
      source: "signal",
      signal: "your search for work in Texas",
      observedAt: "2026-07-24T00:00:00Z",
    },
    confidence_tag: "inferred",
  },
  allowNotSure: false,
};

describe("OrganicOfferChips", () => {
  it("renders nothing when there is no offer", () => {
    const { container } = render(
      <OrganicOfferChips offer={null} onConfirm={vi.fn()} onDismiss={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders the single offer as a light confirm-before-write chip with its provenance", () => {
    render(<OrganicOfferChips offer={offer} onConfirm={vi.fn()} onDismiss={vi.fn()} />);
    expect(screen.getByText("Should I add Texas to the states you serve?")).toBeTruthy();
    // The search that implied the fact is shown — it's an offer, never an assumption.
    expect(screen.getByText(/your search for work in Texas/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /add it/i })).toBeTruthy();
  });

  it("sits in the same turn row as every other card in the column", () => {
    const { container } = render(
      <OrganicOfferChips offer={offer} onConfirm={vi.fn()} onDismiss={vi.fn()} />,
    );
    expect((container.firstChild as HTMLElement).className).toBe("hunter-msg-row from-hunter");
  });

  it("keeps the prototype's subtle AI surface — a light offer, not a full card", () => {
    render(<OrganicOfferChips offer={offer} onConfirm={vi.fn()} onDismiss={vi.fn()} />);
    const card = screen.getByRole("group", { name: "Hunter noticed something" });
    expect(card.className.split(/\s+/)).toContain("ai-surface-subtle");
  });

  it("uses the column's own button, not the page's 36px .btn", () => {
    // `.btn` is the app's page-scale button (36px tall, 14px text). Every other
    // card in this ~327px dock column uses `.hunter-learn__btn` (29.4px, 12px),
    // and the offer was ported carrying `.btn`.
    render(<OrganicOfferChips offer={offer} onConfirm={vi.fn()} onDismiss={vi.fn()} />);
    for (const name of [/add it/i, /just exploring/i]) {
      const cls = screen.getByRole("button", { name }).className;
      expect(cls).toContain("hunter-learn__btn");
      expect(cls.split(/\s+/)).not.toContain("btn");
    }
  });

  it("confirm calls onConfirm with the offer (writes via the client)", () => {
    const onConfirm = vi.fn();
    const onDismiss = vi.fn();
    render(<OrganicOfferChips offer={offer} onConfirm={onConfirm} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole("button", { name: /add it/i }));
    expect(onConfirm).toHaveBeenCalledWith(offer);
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it("dismiss calls onDismiss and never onConfirm (writes nothing)", () => {
    const onConfirm = vi.fn();
    const onDismiss = vi.fn();
    render(<OrganicOfferChips offer={offer} onConfirm={onConfirm} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole("button", { name: /just exploring/i }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
