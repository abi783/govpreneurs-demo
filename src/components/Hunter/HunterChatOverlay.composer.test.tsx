// @vitest-environment jsdom
//
// PR-39 port · V1 — the dock composer and its send button carry Hunter's amber.
//
// Before this feature the dock disagreed with ITSELF: `.hunter-suggestion-chip`
// is `1px solid var(--ai-7)`, and one row below it the send button was
// `var(--blue-7)` over a grey, transparent composer.
//
// `.hunter-composer` and `.hunter-send-btn` are SHARED with `Companion.tsx`
// (Grant, live on the opportunity detail page) and with `HunterChat.tsx`, so
// the amber is scoped by a `--agent` modifier, exactly as an earlier feature
// scoped the shared `.hunter-pane-head`. The base rules keep the app's action
// blue for Grant. These tests therefore assert the amber on the DOCK's
// selectors, and assert that no dock rule carries a blue token.
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

vi.mock("../../lib/hunterChat", () => ({
  postHunterMessage: vi.fn(),
  resetHunterSession: vi.fn(),
}));
vi.mock("../../lib/ghlUser", () => ({
  useGhlUser: () => ({ session: { locationId: "LOC1" }, loading: false }),
}));
vi.mock("../../lib/businessProfile", () => ({
  useBusinessProfile: () => ({ profile: null, loading: false }),
  naicsLabel: () => null,
}));
vi.mock("./EnrichmentJourney", () => ({ EnrichmentJourney: () => null }));
vi.mock("./CapabilityConflictHint", () => ({ CapabilityConflictHint: () => null }));
vi.mock("../Companion/AgentAvatar", () => ({ AgentAvatar: () => null }));
vi.mock("./HunterMessageFeedback", () => ({ HunterMessageFeedback: () => null }));

const { HunterChatOverlay } = await import("./HunterChatOverlay");
const { postHunterMessage } = await import("../../lib/hunterChat");

const css = readFileSync(resolve(process.cwd(), "src/styles.css"), "utf8");

/** The body of the first rule whose selector matches, or "" when there is none. */
function ruleBody(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`^${escaped}\\s*\\{([^}]*)\\}`, "m").exec(css);
  return match ? match[1] : "";
}

const COMPOSER_FIELD = ".hunter-composer.hunter-composer--agent textarea";
const SEND_BUTTON = ".hunter-composer--agent .hunter-send-btn";

/** Every rule this feature scopes to the dock with the `--agent` modifier. */
function dockRules(): string[] {
  return css.match(/^\.hunter-(composer|send-btn)[^{]*--agent[^{]*\{[^}]*\}/gm) ?? [];
}

describe("V1(a) the dock composer is on Hunter's amber, at the prototype's measurements", () => {
  it("gives the textarea an --ai-7 border, a 10px radius and a solid surface ground", () => {
    const body = ruleBody(COMPOSER_FIELD);
    expect(body).toMatch(/border:\s*1px solid var\(--ai-7\)/);
    // `--r-md` IS 10px — the prototype's radius, as a token rather than a literal.
    expect(body).toMatch(/border-radius:\s*var\(--r-md\)/);
    expect(body).toMatch(/background:\s*var\(--surface\)/);
    expect(body).toMatch(/padding:\s*8px 10px/);
  });

  it("keeps the amber on focus, so the field never returns to blue", () => {
    expect(ruleBody(`${COMPOSER_FIELD}:focus`)).toMatch(/border-color:\s*var\(--ai-7\)/);
  });

  it("gives the send button --ai-7 at 32x32 with an 8px radius", () => {
    const body = ruleBody(SEND_BUTTON);
    expect(body).toMatch(/width:\s*32px/);
    expect(body).toMatch(/height:\s*32px/);
    // The radius scale has no 8 (`--r-sm` is 6, `--r-md` is 10). Colour is
    // always a token; this one measurement is not a colour.
    expect(body).toMatch(/border-radius:\s*8px/);
    expect(body).toMatch(/background:\s*var\(--ai-7\)/);
  });

  it("uses tokens only — no literal amber in any dock composer rule", () => {
    // Scoped to this feature's own rules. Two PRE-EXISTING lines outside these
    // families carry a translucent `rgba(195,119,40,…)` for which no token
    // exists (`.mode-badge--partner`, `.awarded-card:hover`); this feature does
    // not touch them.
    for (const rule of dockRules()) expect(rule).not.toMatch(/195,\s*119,\s*40|#c37728/i);
  });
});

describe("V1(b) no dock rule sets a blue token on the composer or the send button", () => {
  it("carries no blue token in any --agent-scoped composer rule", () => {
    const rules = dockRules();
    expect(rules.length).toBeGreaterThan(0);
    for (const rule of rules) expect(rule).not.toMatch(/var\(--blue-/);
  });

  it("orders the amber send rule AFTER the shared blue base, so the dock wins", () => {
    // Grant's rail shares `.hunter-send-btn` and keeps the action blue, so the
    // base rule survives. Specificity (two classes vs one) already decides
    // this; source order is asserted so a later re-order cannot silently
    // return the dock to blue.
    const base = css.indexOf(".hunter-send-btn {");
    const dock = css.indexOf(`${SEND_BUTTON} {`);
    expect(base).toBeGreaterThan(-1);
    expect(dock).toBeGreaterThan(base);
  });
});

describe("V1(c) the two decisions this feature must not undo", () => {
  it("keeps the placeholder free of any shortcut this app does not answer", () => {
    render(<HunterChatOverlay open onOpenChange={vi.fn()} tab="for_you" />);
    // The `⌘K` hint was removed deliberately: `CommandBarProvider`'s handler
    // and modal are commented out, so advertising it would promise nothing.
    const box = screen.getByPlaceholderText("Ask Hunter — try 'what's out there for me?'");
    expect(box.tagName).toBe("TEXTAREA");
    // The in-source comment that RECORDS the removal stays, so this asserts the
    // rendered placeholder rather than scanning the module.
    expect(box.getAttribute("placeholder")).not.toMatch(/⌘K/);
  });

  it("keeps rows={2} — the placeholder wraps at this dock's width", () => {
    render(<HunterChatOverlay open onOpenChange={vi.fn()} tab="for_you" />);
    const box = screen.getByPlaceholderText("Ask Hunter — try 'what's out there for me?'");
    expect(box.getAttribute("rows")).toBe("2");
  });
});

describe("the overlay tells the backend which page the member talks from", () => {
  const PLACEHOLDER = "Ask Hunter — try 'what's out there for me?'";

  /** Types one question into the rail and sends it with the Send button. */
  function ask(text: string): void {
    fireEvent.change(screen.getByPlaceholderText(PLACEHOLDER), { target: { value: text } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
  }

  it("forwards surface 'forecasts' on the turn", async () => {
    vi.mocked(postHunterMessage).mockReset();
    vi.mocked(postHunterMessage).mockResolvedValue({ reply: "ok" } as never);
    render(<HunterChatOverlay open onOpenChange={vi.fn()} tab="all" surface="forecasts" />);

    ask("what should I get ready for?");

    await waitFor(() => expect(postHunterMessage).toHaveBeenCalledTimes(1));
    expect(vi.mocked(postHunterMessage).mock.calls[0][3]).toBe("forecasts");
  });

  it("forwards surface 'feed' when the caller gives none", async () => {
    vi.mocked(postHunterMessage).mockReset();
    vi.mocked(postHunterMessage).mockResolvedValue({ reply: "ok" } as never);
    render(<HunterChatOverlay open onOpenChange={vi.fn()} tab="for_you" />);

    ask("what's out there for me?");

    await waitFor(() => expect(postHunterMessage).toHaveBeenCalledTimes(1));
    expect(vi.mocked(postHunterMessage).mock.calls[0][3]).toBe("feed");
  });
});
