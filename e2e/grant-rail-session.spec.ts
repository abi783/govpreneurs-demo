// E2E for the DURABLE rail session: a member who talks to Grant about an
// opportunity must find the same conversation when they come back — a refresh,
// or days later — with the questions they skipped still skipped.
// (Doc 145 TC-245 session continuity, TC-209 skip parks it.)
//
// The session endpoint is intercepted, so these tests prove the FE contract:
// what it asks for, what it renders, and what it writes back.
import { test, expect, type Page, type Route } from "@playwright/test";

type SessionBody = { oppKey: string };
type SkipBody = { oppKey: string; questionId: string };

/** Intercept POST /grants-take/rail/session and serve a stored conversation. */
async function mockSession(
  page: Page,
  session: { messages?: unknown[]; skipped?: Record<string, number> } | { status: number },
): Promise<SessionBody[]> {
  const calls: SessionBody[] = [];
  await page.route("**/grants-take/rail/session", async (route: Route) => {
    calls.push(route.request().postDataJSON() as SessionBody);
    const failed = "status" in session;
    await route.fulfill({
      status: failed ? session.status : 200,
      contentType: "application/json",
      body: JSON.stringify(
        failed ? { error: "boom" } : { messages: session.messages ?? [], skipped: session.skipped ?? {} },
      ),
    });
  });
  return calls;
}

async function mockSkip(page: Page): Promise<SkipBody[]> {
  const calls: SkipBody[] = [];
  await page.route("**/grants-take/rail/skip", async (route: Route) => {
    calls.push(route.request().postDataJSON() as SkipBody);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });
  return calls;
}

async function mockRail(page: Page, reply: unknown): Promise<void> {
  await page.route("**/grants-take/rail", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(reply),
    });
  });
}

const at = "2026-07-27T10:00:00.000Z"; // three days before "today"
const CARD = "Type your answer, or ask me anything";

async function open(page: Page, scenario = "flood"): Promise<void> {
  await page.goto(`e2e/harness-hostile.html?scenario=${scenario}`);
}

test("a returning member sees the conversation they had days ago", async ({ page }) => {
  const calls = await mockSession(page, {
    messages: [
      { role: "user", text: "why not as the main company?", at },
      { role: "grant", text: "Your capacity is the constraint.", at },
    ],
  });
  await open(page);
  await expect(page.getByText("why not as the main company?")).toBeVisible();
  await expect(page.getByText("Your capacity is the constraint.")).toBeVisible();
  // asked for THIS opportunity's session, once
  expect(calls).toHaveLength(1);
  expect(calls[0].oppKey).toBe("OPP-TEST");
});

test("the restored thread keeps the briefing above it, in order", async ({ page }) => {
  await mockSession(page, {
    messages: [{ role: "user", text: "an older question", at }],
  });
  await open(page);
  await expect(page.locator(".grant-dock__thread")).toContainText("I've read this one");
  const texts = await page.locator(".grant-msg p").allInnerTexts();
  expect(texts[0]).toContain("I've read this one");
  expect(texts.join(" ")).toContain("an older question");
});

test("questions skipped in an earlier visit are still skipped", async ({ page }) => {
  await mockSession(page, { skipped: { q_0: 1, q_1: 1 } });
  await open(page); // `flood` raises Question 1…40, ids q_0…q_39
  await expect(page.locator(".grant-oq__q")).toContainText("Question 3?");
  await expect(page.locator(".grant-dock__need")).toContainText("38");
});

test("a skip is written back to the server", async ({ page }) => {
  await mockSession(page, {});
  const skips = await mockSkip(page);
  await open(page);
  await page.getByRole("button", { name: "Skip" }).click();
  await expect(page.locator(".grant-oq__q")).toContainText("Question 2?");
  await expect.poll(() => skips.length).toBe(1);
  expect(skips[0]).toEqual({ oppKey: "OPP-TEST", questionId: "q_0" });
});

test("a new turn appends to the restored thread without dropping it", async ({ page }) => {
  await mockSession(page, {
    messages: [{ role: "user", text: "an older question", at }],
  });
  await mockRail(page, { kind: "interrogate", reply: "A fresh answer." });
  await open(page);
  await expect(page.getByText("an older question")).toBeVisible();
  const composer = page.getByLabel("Ask Grant");
  await composer.fill("a new question");
  await composer.press("Enter");
  await expect(page.getByText("A fresh answer.")).toBeVisible();
  await expect(page.getByText("an older question")).toBeVisible(); // history kept
});

test("a failed session load opens a usable empty rail, not a broken one", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await mockSession(page, { status: 500 });
  await open(page);
  await expect(page.getByLabel("Ask Grant")).toBeVisible();
  await expect(page.locator(".grant-oq__q")).toContainText("Question 1?");
  expect(errors).toEqual([]);
});

test("a malformed session payload is ignored rather than rendered", async ({ page }) => {
  await page.route("**/grants-take/rail/session", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ messages: "not-an-array", skipped: "nope" }),
    }),
  );
  await open(page);
  await expect(page.getByLabel("Ask Grant")).toBeVisible();
  await expect(page.locator(".grant-dock__thread")).not.toContainText("not-an-array");
});

test("switching opportunity loads THAT opportunity's session, not the old one", async ({
  page,
}) => {
  const calls: SessionBody[] = [];
  await page.route("**/grants-take/rail/session", async (route: Route) => {
    const body = route.request().postDataJSON() as SessionBody;
    calls.push(body);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        messages: [{ role: "user", text: `history for ${body.oppKey}`, at }],
        skipped: {},
      }),
    });
  });
  await open(page);
  await expect(page.getByText("history for OPP-TEST")).toBeVisible();

  await page.evaluate(() => window.__switchOpp());
  await expect(page.getByText("history for OPP-OTHER")).toBeVisible();
  await expect(page.getByText("history for OPP-TEST")).toHaveCount(0);
  expect(calls.map((c) => c.oppKey)).toEqual(["OPP-TEST", "OPP-OTHER"]);
});

test("an answer still works on a restored session", async ({ page }) => {
  await mockSession(page, { messages: [{ role: "user", text: "older", at }] });
  await mockRail(page, { kind: "supply", reply: "Got it." });
  await open(page);
  const input = page.getByPlaceholder(CARD);
  await input.fill("$2M");
  await input.press("Enter");
  await expect(page.getByText("Got it.")).toBeVisible();
  await expect(page.getByText("updating the take…")).toBeVisible();
});
