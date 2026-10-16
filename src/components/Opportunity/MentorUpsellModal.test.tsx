// @vitest-environment jsdom
//
// Covers the non-Elite "Send to Mentor" upsell: the ported v1 pitch copy, plus
// the two deliberate fixes vs v1 — a working primary CTA (v1's was decorative)
// and the real Elite price (v1's fine print quoted a stale $299/mo).
import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { MentorUpsellModal } from "./MentorUpsellModal";

// The upgrade journey (UpgradePlanModal) pulls in the GHL session + billing
// API; this suite only covers the upsell surface, so stub it out and assert on
// the `open` prop it receives.
const upgradeModalSpy = vi.fn();
vi.mock("../Hunter/UpgradePlanModal", () => ({
  UpgradePlanModal: (props: { open: boolean }) => {
    upgradeModalSpy(props.open);
    return props.open ? <div data-testid="upgrade-modal" /> : null;
  },
}));

afterEach(() => {
  cleanup();
  upgradeModalSpy.mockClear();
});

describe("MentorUpsellModal — non-Elite Send to Mentor upsell", () => {
  it("renders the mentor-review pitch and preview rows", () => {
    render(
      <MentorUpsellModal open onOpenChange={() => {}} onContinueSelfQualification={() => {}} />,
    );

    expect(
      screen.getByText(/Confirm these are winnable before you write\./),
    ).toBeTruthy();
    expect(screen.getByText("Mentor Review Preview")).toBeTruthy();
    expect(screen.getByText("IT Support Services - DoD")).toBeTruthy();
    expect(screen.getByText("Cloud Migration - GSA")).toBeTruthy();
    expect(screen.getByText("Cybersecurity Assessment")).toBeTruthy();
  });

  it("pluralises the shortlisted count", () => {
    const { rerender } = render(
      <MentorUpsellModal open onOpenChange={() => {}} onContinueSelfQualification={() => {}} />,
    );
    expect(screen.getByText("1 opportunity")).toBeTruthy();

    rerender(
      <MentorUpsellModal
        open
        selectedCount={3}
        onOpenChange={() => {}}
        onContinueSelfQualification={() => {}}
      />,
    );
    expect(screen.getByText("3 opportunities")).toBeTruthy();
  });

  it("quotes the real Elite price, not v1's stale $299/mo", () => {
    render(
      <MentorUpsellModal open onOpenChange={() => {}} onContinueSelfQualification={() => {}} />,
    );
    expect(screen.getByText(/Elite plan — \$4997 one time payment\./)).toBeTruthy();
    expect(screen.queryByText(/\$299/)).toBeNull();
  });

  it("opens the real upgrade journey from the primary CTA (v1's was decorative)", () => {
    const onOpenChange = vi.fn();
    render(
      <MentorUpsellModal open onOpenChange={onOpenChange} onContinueSelfQualification={() => {}} />,
    );

    expect(screen.queryByTestId("upgrade-modal")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /Upgrade to Unlock Mentor Review/ }));

    expect(screen.getByTestId("upgrade-modal")).toBeTruthy();
    // Upsell closes so the two modals never stack.
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("dismisses via Continue with Self-Qualification without upgrading", () => {
    const onContinue = vi.fn();
    const onOpenChange = vi.fn();
    render(
      <MentorUpsellModal
        open
        onOpenChange={onOpenChange}
        onContinueSelfQualification={onContinue}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Continue with Self-Qualification/ }));

    expect(onContinue).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.queryByTestId("upgrade-modal")).toBeNull();
  });
});
