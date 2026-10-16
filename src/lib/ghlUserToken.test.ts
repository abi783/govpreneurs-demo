import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getGhlUserToken } from "./ghlUserToken";

/**
 * The vitest environment for this package is `node` (see vitest.config.ts),
 * so there is no ambient `window`. We build a minimal `window` stub backed by
 * a real EventTarget so `addEventListener`/`removeEventListener`/`dispatchEvent`
 * behave like the browser, plus a spy on `window.parent.postMessage` so we can
 * read back the `requestId` the module generates.
 */
type PostMessageSpy = ReturnType<typeof vi.fn>;

function makeWindow(hostname: string): { win: EventTarget & {
  location: { hostname: string };
  parent: { postMessage: PostMessageSpy };
} } {
  const bus = new EventTarget();
  const postMessage: PostMessageSpy = vi.fn();
  const win = Object.assign(bus, {
    location: { hostname },
    parent: { postMessage },
  });
  return { win: win as never };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.useRealTimers();
});

// ─── Local dev path ───────────────────────────────────────────────────────────
// Staging is no longer mocked (isMockEnv() is local-only — see ./env.ts), so
// the mock branch is now forced via DEV=true (genuine local-dev signal)
// rather than VITE_ENVIRONMENT=staging.

describe("getGhlUserToken — mock env", () => {
  beforeEach(() => {
    // Non-local hostname; force the mock branch via DEV=true.
    const { win } = makeWindow("app.example.com");
    vi.stubGlobal("window", win);
    vi.stubEnv("DEV", true as never);
  });

  it("returns VITE_LOCAL_AUTH_TOKEN when set", async () => {
    vi.stubEnv("VITE_LOCAL_AUTH_TOKEN", "test-local-token");
    await expect(getGhlUserToken()).resolves.toBe("test-local-token");
  });

  it('falls back to "local" when VITE_LOCAL_AUTH_TOKEN is unset', async () => {
    vi.stubEnv("VITE_LOCAL_AUTH_TOKEN", "");
    await expect(getGhlUserToken()).resolves.toBe("local");
  });
});

// ─── Production handshake path ────────────────────────────────────────────────
// Staging now takes this same real-handshake branch as production (it is no
// longer mocked), so VITE_ENVIRONMENT=staging is asserted here too — see the
// "staging" test in this describe block below.

describe("getGhlUserToken — prod handshake", () => {
  let win: EventTarget & {
    location: { hostname: string };
    parent: { postMessage: PostMessageSpy };
  };

  beforeEach(() => {
    // Non-local hostname + DEV=false → real handshake branch.
    const made = makeWindow("app.govpreneurs.com");
    win = made.win as never;
    vi.stubGlobal("window", win);
    vi.stubEnv("DEV", false as never);
    vi.stubEnv("VITE_ENVIRONMENT", "production");
    vi.stubEnv("VITE_LOCAL_AUTH_TOKEN", "");
  });

  it("posts REQUEST_AUTH_TOKEN and resolves with the token from the response", async () => {
    const promise = getGhlUserToken();

    // Read back the requestId the module generated.
    expect(win.parent.postMessage).toHaveBeenCalledTimes(1);
    const [payload, targetOrigin] = win.parent.postMessage.mock.calls[0] as [
      { message: string; requestId: string; forceRefresh: boolean },
      string,
    ];
    expect(payload.message).toBe("REQUEST_AUTH_TOKEN");
    expect(payload.forceRefresh).toBe(true);
    expect(targetOrigin).toBe("*");
    const { requestId } = payload;

    // Simulate the GHL frame replying.
    win.dispatchEvent(
      new MessageEvent("message", {
        data: {
          message: "REQUEST_AUTH_TOKEN_RESPONSE",
          requestId,
          payload: "user-token-abc",
        },
      }),
    );

    await expect(promise).resolves.toBe("user-token-abc");
  });

  it("ignores responses with a mismatched requestId", async () => {
    vi.useFakeTimers();
    const promise = getGhlUserToken();
    const rejection = expect(promise).rejects.toThrow(/Timeout/);

    // Wrong requestId → should NOT resolve.
    win.dispatchEvent(
      new MessageEvent("message", {
        data: {
          message: "REQUEST_AUTH_TOKEN_RESPONSE",
          requestId: "not-the-right-id",
          payload: "should-be-ignored",
        },
      }),
    );

    await vi.advanceTimersByTimeAsync(10_000);
    await rejection;
  });

  it("rejects after the 10s timeout when no response arrives", async () => {
    vi.useFakeTimers();
    const promise = getGhlUserToken();
    const rejection = expect(promise).rejects.toThrow(
      "Timeout waiting for auth token from parent window",
    );
    await vi.advanceTimersByTimeAsync(10_000);
    await rejection;
  });

  it("passes forceRefresh=false through to the postMessage payload", async () => {
    getGhlUserToken(false).catch(() => {
      /* ignore — we only assert the outbound message here */
    });
    const [payload] = win.parent.postMessage.mock.calls[0] as [
      { forceRefresh: boolean },
    ];
    expect(payload.forceRefresh).toBe(false);
  });
});

// ─── Staging now behaves like production (real handshake, not mock) ──────────

describe("getGhlUserToken — staging is real, not mock", () => {
  it("performs the real postMessage handshake on VITE_ENVIRONMENT=staging instead of returning a mock token", async () => {
    const { win } = makeWindow("staging.govpreneurs.com");
    vi.stubGlobal("window", win);
    vi.stubEnv("DEV", false as never);
    vi.stubEnv("VITE_ENVIRONMENT", "staging");
    vi.stubEnv("VITE_LOCAL_AUTH_TOKEN", "");

    const promise = getGhlUserToken();

    // If staging were still mocked, no postMessage would be sent and the
    // promise would resolve immediately with "local". Instead it must post
    // the real handshake request and wait for a response.
    expect(win.parent.postMessage).toHaveBeenCalledTimes(1);
    const [payload] = win.parent.postMessage.mock.calls[0] as [
      { message: string; requestId: string },
    ];
    expect(payload.message).toBe("REQUEST_AUTH_TOKEN");

    win.dispatchEvent(
      new MessageEvent("message", {
        data: {
          message: "REQUEST_AUTH_TOKEN_RESPONSE",
          requestId: payload.requestId,
          payload: "staging-real-token",
        },
      }),
    );

    await expect(promise).resolves.toBe("staging-real-token");
  });
});
