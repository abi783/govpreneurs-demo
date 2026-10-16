// Adversarial E2E for Grant's rail — drives the REAL components with hostile
// server payloads (harness-hostile.tsx) and hostile network conditions. Each
// test asserts the behavior we WANT; a failure here is a real defect, not a
// flaky selector. Grouped by attack surface.
import { test, expect, type Page, type Route } from "@playwright/test";

type RailBody = { oppKey: string; message: string; openQuestion?: string };

async function mockRail(
  page: Page,
  reply: { status?: number; body?: unknown; raw?: string; delayMs?: number },
): Promise<RailBody[]> {
  const calls: RailBody[] = [];
  await page.route("**/grants-take/rail", async (route: Route) => {
    calls.push(route.request().postDataJSON() as RailBody);
    if (reply.delayMs) await new Promise((r) => setTimeout(r, reply.delayMs));
    const status = reply.status ?? 200;
    await route.fulfill({
      status,
      contentType: "application/json",
      body: reply.raw ?? JSON.stringify(status === 200 ? reply.body : { error: "boom" }),
    });
  });
  return calls;
}

async function open(page: Page, scenario: string): Promise<void> {
  await page.goto(`e2e/harness-hostile.html?scenario=${scenario}`);
}

const CARD = "Type your answer, or ask me anything";
const xssFired = (page: Page) => page.evaluate(() => window.__xss ?? 0);

// ─── 1 · injection through server-supplied strings ───────────────────────────

test("markup in briefing / question / chip text is rendered as text, never executed", async ({
  page,
}) => {
  await open(page, "xss");
  await expect(page.locator(".grant-dock")).toBeVisible();
  await page.waitForTimeout(300);
  expect(await xssFired(page)).toBe(0);
  // and it is visible as literal text, not stripped silently
  await expect(page.locator(".grant-oq__q")).toContainText("onerror");
  expect(await page.locator('img[src="x"]').count()).toBe(0); // avatar imgs are fine
});

test("a rail REPLY containing markup is escaped", async ({ page }) => {
  await open(page, "xss");
  await mockRail(page, {
    body: { kind: "interrogate", reply: `<img src=x onerror="window.__xss=1">ok` },
  });
  const composer = page.getByLabel("Ask Grant");
  await composer.fill("hello");
  await composer.press("Enter");
  await expect(page.locator(".grant-msg--agent").last()).toContainText("onerror");
  expect(await xssFired(page)).toBe(0);
});

test("a javascript: route-chip target must not execute", async ({ page }) => {
  await open(page, "chip-js");
  await page.locator(".grant-chip-btn").first().click();
  await page.waitForTimeout(500);
  expect(await xssFired(page)).toBe(0);
});

test("an off-origin route-chip target must not navigate the member off the app", async ({
  page,
}) => {
  await open(page, "chip-offsite");
  await page.route("https://evil.example.com/**", (r) =>
    r.fulfill({ status: 200, contentType: "text/html", body: "<html>owned</html>" }),
  );
  await page.locator(".grant-chip-btn").first().click();
  await page.waitForTimeout(600);
  expect(new URL(page.url()).hostname).not.toBe("evil.example.com");
});

test("a javascript: provenance ref must not be opened", async ({ page }) => {
  await open(page, "pin");
  await page.addInitScript(() => {});
  await page.evaluate(() => {
    window.open = ((u: string) => {
      (window as unknown as { __opened: string[] }).__opened = [
        ...((window as unknown as { __opened?: string[] }).__opened ?? []),
        u,
      ];
      return null;
    }) as unknown as typeof window.open;
  });
  await page.getByRole("button").first().click();
  const opened = await page.evaluate(
    () => (window as unknown as { __opened?: string[] }).__opened ?? [],
  );
  expect(opened.filter((u) => u.startsWith("javascript:"))).toHaveLength(0);
});

// ─── 2 · malformed contract payloads ─────────────────────────────────────────

test("duplicate chip slots all render and each sends its own query", async ({ page }) => {
  await open(page, "chip-dupe-slot");
  const chips = page.locator(".grant-chip-btn");
  await expect(chips).toHaveCount(3);
  const calls = await mockRail(page, { body: { kind: "interrogate", reply: "ok" } });
  await chips.nth(2).click();
  await expect(page.locator(".grant-msg--agent").last()).toContainText("ok");
  expect(calls[0].message).toBe("three");
});

test("a route chip with no target does not navigate or blank the page", async ({ page }) => {
  await open(page, "chip-notarget");
  const url = page.url();
  await page.locator(".grant-chip-btn").first().click();
  await page.waitForTimeout(400);
  expect(page.url()).toBe(url);
  await expect(page.locator(".grant-dock")).toBeVisible();
});

test("an elicit chip pointing at a missing question keeps the card usable", async ({ page }) => {
  await open(page, "chip-badtarget");
  await page.locator(".grant-chip-btn").first().click();
  await page.waitForTimeout(300);
  await expect(page.getByPlaceholder(CARD)).toBeVisible();
});

// Documents current behavior: an unrecognised kind falls through to send(label).
// Benign today (the label is the displayed text), but it means any future chip
// kind ships as a chat turn until the FE learns it.
test("an unknown chip kind falls through to a chat turn with the label", async ({ page }) => {
  await open(page, "chip-unknown-kind");
  const calls = await mockRail(page, { body: { kind: "interrogate", reply: "ok" } });
  await page.locator(".grant-chip-btn").first().click();
  await page.waitForTimeout(400);
  expect(calls.map((c) => c.message)).toEqual(["Do something"]);
});

test("a missing openQuestions array does not crash the rail", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await open(page, "no-queue");
  await expect(page.locator(".grant-dock")).toBeVisible();
  expect(errors).toEqual([]);
});

test("an unknown input.kind still gives the member a way to answer", async ({ page }) => {
  await open(page, "bad-kind");
  await expect(page.locator(".grant-oq")).toBeVisible();
  await expect(page.locator(".grant-oq__field, .grant-oq__toggle")).toBeVisible();
});

test("non-numeric meta renders without NaN or [object Object]", async ({ page }) => {
  await open(page, "unicode");
  const summary = page.locator(".grant-dock__summary");
  await expect(summary).toBeVisible();
  await expect(summary).not.toContainText("NaN");
  await expect(summary).not.toContainText("object Object");
});

test("two questions sharing an id both get asked", async ({ page }) => {
  await open(page, "dupe-qid");
  await expect(page.locator(".grant-oq__q")).toContainText("First question?");
  await page.getByRole("button", { name: "Skip" }).click();
  await expect(page.locator(".grant-oq__q")).toContainText("Second question?");
});

// ─── 3 · layout under hostile content ────────────────────────────────────────

test("a 20k-char question does not blow the dock out of the viewport", async ({ page }) => {
  await open(page, "giant");
  const box = await page.locator(".grant-dock").boundingBox();
  const vw = page.viewportSize()!.width;
  expect(box!.width).toBeLessThanOrEqual(vw);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test("a 4000-char unbreakable chip label stays inside the dock", async ({ page }) => {
  await open(page, "giant");
  const chip = await page.locator(".grant-chip-btn").first().boundingBox();
  const dock = await page.locator(".grant-dock").boundingBox();
  expect(chip!.x + chip!.width).toBeLessThanOrEqual(dock!.x + dock!.width + 1);
});

test("bidi + combining marks do not break the layout", async ({ page }) => {
  await open(page, "unicode");
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test("mobile viewport: the dock and composer stay reachable", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await open(page, "flood");
  await expect(page.getByLabel("Ask Grant")).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test("an empty analysis (no chips, no briefing, empty question) renders a usable rail", async ({
  page,
}) => {
  await open(page, "empty");
  await expect(page.locator(".grant-dock")).toBeVisible();
  await expect(page.getByLabel("Ask Grant")).toBeVisible();
});

// ─── 4 · hostile network / race conditions ───────────────────────────────────

test("a 200 with a NON-JSON body is handled as unavailable, not a crash", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await open(page, "flood");
  await mockRail(page, { raw: "<html>gateway</html>" });
  const composer = page.getByLabel("Ask Grant");
  await composer.fill("hello there");
  await composer.press("Enter");
  await expect(page.locator(".grant-msg--agent").last()).toContainText(/unavailable|moment/i);
  expect(errors).toEqual([]);
});

test("a 200 with the WRONG shape does not render 'undefined' or falsely advance", async ({
  page,
}) => {
  await open(page, "flood");
  await mockRail(page, { body: { ok: true } }); // no kind, no reply
  const input = page.getByPlaceholder(CARD);
  await input.fill("2000000");
  await input.press("Enter");
  await page.waitForTimeout(400);
  await expect(page.locator(".grant-dock__thread")).not.toContainText("undefined");
});

// fetchRailReply aborts at RAIL_TIMEOUT_MS (60s) and degrades to "unavailable";
// this asserts the composer comes back rather than locking for the session.
test("a reply that never arrives leaves the composer usable (no permanent lock)", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await open(page, "flood");
  await page.route("**/grants-take/rail", () => {}); // hang forever
  const composer = page.getByLabel("Ask Grant");
  await composer.fill("will this hang?");
  await composer.press("Enter");
  await expect(page.locator(".grant-msg--typing")).toBeVisible();
  await expect(composer).toBeEnabled({ timeout: 75_000 });
  await expect(page.locator(".grant-msg--agent").last()).toContainText(/unavailable|moment/i);
});

test("an in-flight reply must not land in the NEXT opportunity's thread", async ({ page }) => {
  await open(page, "flood");
  await mockRail(page, { body: { kind: "interrogate", reply: "STALE-ANSWER" }, delayMs: 1500 });
  const composer = page.getByLabel("Ask Grant");
  await composer.fill("about the old opp");
  await composer.press("Enter");
  await page.waitForTimeout(200);
  await page.evaluate(() => window.__switchOpp());
  await page.waitForTimeout(2500);
  await expect(page.locator(".grant-dock__thread")).not.toContainText("STALE-ANSWER");
});

// Regression: the in-flight-reply guard must not leave `sending` set on the
// opportunity the member switched TO — that would lock the new composer.
test("switching opportunity mid-flight leaves the NEW composer usable", async ({ page }) => {
  await open(page, "flood");
  await mockRail(page, { body: { kind: "interrogate", reply: "STALE" }, delayMs: 1200 });
  const composer = page.getByLabel("Ask Grant");
  await composer.fill("about the old opp");
  await composer.press("Enter");
  await page.waitForTimeout(150);
  await page.evaluate(() => window.__switchOpp());
  await expect(composer).toBeEnabled({ timeout: 8_000 });
  await expect(page.locator(".grant-dock__status")).toContainText("ready");
});

// Regression: the length guard must not eat what the member typed.
test("an over-long answer keeps the member's text in the box", async ({ page }) => {
  await open(page, "flood");
  const calls = await mockRail(page, { body: { kind: "supply", reply: "ok" } });
  const input = page.getByPlaceholder(CARD);
  await input.fill("Q".repeat(3_000));
  await input.press("Enter");
  await page.waitForTimeout(400);
  expect(calls).toHaveLength(0);
  await expect(page.locator(".grant-dock__notice")).toContainText("trim");
  expect((await input.inputValue()).length).toBe(3_000); // not discarded
  await expect(page.locator(".grant-oq__q")).toContainText("Question 1?"); // not consumed
});

// Regression: skipping the LAST remaining question must empty the card cleanly
// rather than resurrecting one the member already answered.
test("answer-then-skip drains the queue without re-showing the answered one", async ({ page }) => {
  await open(page, "dupe-qid");
  await mockRail(page, { body: { kind: "supply", reply: "Got it." } });
  const input = page.getByPlaceholder(CARD);
  await input.fill("$2M");
  await input.press("Enter");
  await expect(page.locator(".grant-oq__q")).toContainText("Second question?");
  await page.getByRole("button", { name: "Skip" }).click();
  await expect(page.locator(".grant-oq")).toHaveCount(0);
  await expect(page.locator(".grant-dock__thread")).not.toContainText("First question?");
});

test("rapid-fire Enter never double-sends the same turn", async ({ page }) => {
  await open(page, "flood");
  const calls = await mockRail(page, {
    body: { kind: "interrogate", reply: "ok" },
    delayMs: 800,
  });
  const composer = page.getByLabel("Ask Grant");
  await composer.fill("double me");
  await composer.press("Enter");
  await composer.press("Enter");
  await composer.press("Enter");
  await page.waitForTimeout(2000);
  expect(calls).toHaveLength(1);
});

test("skipping every question empties the queue and the 'I still need' count", async ({ page }) => {
  await open(page, "flood");
  await expect(page.locator(".grant-dock__need")).toContainText("40");
  for (let i = 0; i < 40; i++) await page.getByRole("button", { name: "Skip" }).click();
  await expect(page.locator(".grant-oq")).toHaveCount(0);
  await expect(page.locator(".grant-dock__need")).toHaveCount(0);
});

test("skipped questions do not come back on the next regen", async ({ page }) => {
  await open(page, "flood");
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Skip" }).click();
  await expect(page.locator(".grant-oq__q")).toContainText("Question 4?");
  // a same-opp regen hands back an analysis whose queue still holds the skips
  await page.evaluate(() => window.__setAnalysis({ meta: { checksRun: 15, sourcesConsulted: 5 } }));
  await expect(page.locator(".grant-dock__summary")).toContainText("15"); // regen landed
  await expect(page.locator(".grant-oq__q")).not.toContainText("Question 1?");
});

// An `offscope` reply means Grant did NOT accept the answer (the backend still
// records it, but the member was told the message was out of scope). The FE
// treats every kind except unavailable/pending as "landed", so the question is
// consumed and never comes back.
test("an offscope reply must not silently consume the open question", async ({ page }) => {
  await open(page, "flood");
  await mockRail(page, {
    body: { kind: "offscope", reply: "That's outside the context of this opportunity." },
  });
  const input = page.getByPlaceholder(CARD);
  await input.fill("the moon");
  await input.press("Enter");
  await expect(page.locator(".grant-msg--agent").last()).toContainText("outside the context");
  await expect(page.locator(".grant-oq__q")).toContainText("Question 1?");
});

test("whitespace-only input is never sent", async ({ page }) => {
  await open(page, "flood");
  const calls = await mockRail(page, { body: { kind: "interrogate", reply: "ok" } });
  const composer = page.getByLabel("Ask Grant");
  await composer.fill("     ");
  await composer.press("Enter");
  const input = page.getByPlaceholder(CARD);
  await input.fill("   ");
  await input.press("Enter");
  await page.waitForTimeout(400);
  expect(calls).toHaveLength(0);
});

// The backend DTO caps `message` at 2000 chars (grants-take.dto.ts). The FE has
// no cap, so a longer paste is sent, 400s, and surfaces as the generic
// "Grant is unavailable" — the member is never told their message was too long.
test("a message longer than the backend's 2000-char cap is refused BEFORE sending", async ({
  page,
}) => {
  await open(page, "flood");
  const calls = await mockRail(page, { status: 400 });
  const composer = page.getByLabel("Ask Grant");
  await composer.fill("Q".repeat(20_000));
  await composer.press("Enter");
  await page.waitForTimeout(600);
  expect(calls[0]?.message.length ?? 0).toBeLessThanOrEqual(2_000);
});
