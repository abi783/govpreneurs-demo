// @vitest-environment jsdom
//
// DH-22 — WHAT SHE SEES WHEN HER RECORD DOES NOT SAVE.
//
// This is the criterion in the ledger's own words: "a member whose write is
// refused sees an error rather than a silent no-op". The store's half is pinned
// in `lib/state/microPurchases.saveFailure.test.ts`; this file is the half she
// reads.
//
// THE MUTATION CHECK FOR THIS FEATURE is the first case below. Restore
// `void saveMemberState(state)` in `schedulePersist()` and it fails: the store
// never learns the write was refused, nothing publishes, and the screen stays
// exactly as silent as it was.
//
// The notice is driven through the real store on purpose. A component handed a
// prop would prove that a string renders; the defect was that the string never
// arrived, so every case here starts where the defect started — with an answer
// she gave.
//
// Layer: FRAMEWORKS & DRIVERS.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen } from "@testing-library/react";

/** The wire, doubled. Hoisted because `vi.mock` is. */
const api = vi.hoisted(() => ({
  saveMemberState: vi.fn(),
  fetchMemberState: vi.fn(),
}));

vi.mock("../../lib/microPurchases/api", () => api);

import { SaveFailureNotice } from "./SaveFailureNotice";
import { markSeen } from "../../lib/state/microPurchases";

/** Mirrors `PERSIST_DEBOUNCE_MS` in the store, which is module-private. */
const DEBOUNCE_MS = 400;

/**
 * One answer from her, and the write it schedules, answered with `outcome`.
 *
 * The store is a module singleton and this file does not reset it, so each case
 * passes an order id of its own — `markSeen` records each id once.
 */
async function sheAnswers(outcome: unknown, orderId: string): Promise<void> {
  api.saveMemberState.mockResolvedValue(outcome);
  await act(async () => {
    markSeen(orderId);
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  api.saveMemberState.mockReset();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("the notice after a refused write", () => {
  it("tells her the answers did not save, and what she can do", async () => {
    render(<SaveFailureNotice />);

    await sheAnswers({ saved: false, reason: "refused" }, "refused-order");

    const said = screen.getByRole("alert").textContent ?? "";
    expect(said).toContain("Your answers did not save.");
    // Where the record is, so she knows what closing the tab costs her.
    expect(said).toContain("on this page only");
    // And the two things she can act on.
    expect(said).toContain("still signed in");
    expect(said).toContain("Copy anything you need to keep");
  });

  it("does not tell her to wait, because the same write gets the same answer", async () => {
    render(<SaveFailureNotice />);

    await sheAnswers({ saved: false, reason: "refused" }, "refused-no-waiting");

    expect(screen.getByRole("alert").textContent ?? "").not.toContain("We try again");
  });

  it("says no status code, no field name and nothing else she cannot use", async () => {
    render(<SaveFailureNotice />);

    await sheAnswers({ saved: false, reason: "refused" }, "refused-no-jargon");

    const said = screen.getByRole("alert").textContent ?? "";
    for (const jargon of ["400", "401", "error", "Error", "failed", "PUT", "server error"]) {
      expect(said).not.toContain(jargon);
    }
  });
});

describe("the notice after a write with no verdict", () => {
  it("says we cannot tell, and never that the record was lost", async () => {
    render(<SaveFailureNotice />);

    await sheAnswers({ saved: false, reason: "unconfirmed" }, "unconfirmed-order");

    const said = screen.getByRole("alert").textContent ?? "";
    expect(said).toContain("We cannot confirm that your answers saved.");
    expect(said).toContain("still on this page");
    // Waiting IS the action here: the store PUTs the whole document again on
    // her next answer, so a later write carries this one.
    expect(said).toContain("We try again every time you answer something here");
    expect(said).not.toContain("refused");
  });

  it("is a different sentence from a refusal, not the same one twice", async () => {
    render(<SaveFailureNotice />);
    await sheAnswers({ saved: false, reason: "unconfirmed" }, "unconfirmed-compare");
    const unconfirmed = screen.getByRole("alert").textContent;

    await sheAnswers({ saved: false, reason: "refused" }, "refused-compare");

    expect(screen.getByRole("alert").textContent).not.toBe(unconfirmed);
  });
});

describe("the notice when the writes are landing", () => {
  it("renders nothing at all", async () => {
    render(<SaveFailureNotice />);

    await sheAnswers({ saved: true }, "landed-order");

    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("goes when a later write lands, with no tap from her", async () => {
    // It has no close button on purpose. The condition is her record not
    // reaching the server, and the only thing that ends it is a write that does.
    render(<SaveFailureNotice />);
    await sheAnswers({ saved: false, reason: "unconfirmed" }, "recovers-first");
    expect(screen.getByRole("alert")).toBeTruthy();

    await sheAnswers({ saved: true }, "recovers-second");

    expect(screen.queryByRole("alert")).toBeNull();
  });
});
