// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GrantCanvas } from "./GrantCanvas";
import { GRANT_FIXTURES } from "../../lib/grant/fixtures";
import { OPPORTUNITIES } from "../../lib/mock/opportunities";
import { MENTOR_DEADLINE_TOO_CLOSE_MESSAGE } from "../../lib/entitlements";

const opp = OPPORTUNITIES.find((o) => o.noticeId === "W912EE-26-R-0066")!;
const analysis = GRANT_FIXTURES["W912EE-26-R-0066"](opp);

describe("GrantCanvas — mentor CTA deadline gate", () => {
  it("dispatches onReviewWithMentor when not disabled", () => {
    const onMentor = vi.fn();
    render(<GrantCanvas analysis={analysis} onReviewWithMentor={onMentor} />);
    fireEvent.click(screen.getByRole("button", { name: /second opinion|review with mentor/i }));
    expect(onMentor).toHaveBeenCalledTimes(1);
  });

  it("renders disabled with the deadline-gate tooltip and does not fire onClick", () => {
    const onMentor = vi.fn();
    render(
      <GrantCanvas
        analysis={analysis}
        onReviewWithMentor={onMentor}
        mentorDisabledReason={MENTOR_DEADLINE_TOO_CLOSE_MESSAGE}
      />,
    );
    const btn = screen.getByRole("button", { name: /second opinion|review with mentor/i });
    expect(btn).toHaveProperty("disabled", true);
    expect(btn.closest("span")?.getAttribute("title")).toBe(MENTOR_DEADLINE_TOO_CLOSE_MESSAGE);
    fireEvent.click(btn);
    expect(onMentor).not.toHaveBeenCalled();
  });
});

describe("GrantCanvas — next-move link", () => {
  const withPrimary = (verdict: typeof analysis.verdict.value, label: string, target: string) => ({
    ...analysis,
    verdict: { ...analysis.verdict, value: verdict },
    action: { ...analysis.action, path: "sub" as const, primary: { label, target } },
  });

  it("renders no 'Find a prime' link on the sub path", () => {
    const sub = withPrimary("review", "Find a prime to team with", "/pipeline?opp=X&as=sub");
    render(<GrantCanvas analysis={sub} onReviewWithMentor={vi.fn()} />);
    expect(screen.queryByRole("link", { name: /find a prime/i })).toBeNull();
  });

  it("keeps the Partners link on a sub path, because Partners is a live page in the demo", () => {
    render(<GrantCanvas analysis={analysis} onReviewWithMentor={vi.fn()} />);
    expect(screen.getByRole("link", { name: /on partners/i }).getAttribute("href")).toBe("/partners");
  });

  it("keeps the 'Back to your matches' link on a sub-path no-bid", () => {
    const noBid = withPrimary("no-bid", "Back to your matches", "/opportunities");
    render(<GrantCanvas analysis={noBid} onReviewWithMentor={vi.fn()} />);
    expect(screen.getByRole("link", { name: /back to your matches/i }).getAttribute("href")).toBe(
      "/opportunities",
    );
  });
});
