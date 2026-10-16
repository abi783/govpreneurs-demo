import { test, expect, type Page, type Route } from "@playwright/test";

type RailBody = { oppKey: string; message: string; openQuestion?: string };

/** Intercept POST /grants-take/rail; return `reply` and capture request bodies. */
async function mockRail(
  page: Page,
  reply: { status?: number; body?: unknown },
): Promise<RailBody[]> {
  const calls: RailBody[] = [];
  await page.route("**/grants-take/rail", async (route: Route) => {
    calls.push(route.request().postDataJSON() as RailBody);
    const status = reply.status ?? 200;
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(status === 200 ? reply.body : { error: "boom" }),
    });
  });
  return calls;
}

async function openRail(page: Page, scenario = "default"): Promise<void> {
  const q = scenario === "default" ? "" : `?scenario=${scenario}`;
  await page.goto(`e2e/harness.html${q}`);
  await expect(page.getByLabel("Ask Grant")).toBeVisible(); // dock rendered
}

const CARD = "Type your answer, or ask me anything";
const QUESTION = "What's your bonding capacity?";
const answered = (page: Page) => page.evaluate(() => window.__answered);

// ─── A · chips + the open-question card (default scenario) ───────────────────

test("renders the three slot chips, in order", async ({ page }) => {
  await openRail(page);
  const chips = page.locator(".grant-chip-btn");
  await expect(chips).toHaveCount(3);
  await expect(chips.nth(0)).toHaveText("Can I win this project?");
  await expect(chips.nth(1)).toHaveText("Answer the bonding question");
  await expect(chips.nth(2)).toHaveText("What should my response say?");
});

test("shows the 'still need' indicator for a pending question", async ({ page }) => {
  await openRail(page);
  await expect(page.locator(".grant-dock__need")).toContainText("1");
});

test("the open-question card invites asking, not just answering", async ({ page }) => {
  await openRail(page);
  await expect(page.getByText(QUESTION)).toBeVisible();
  await expect(page.getByPlaceholder(CARD)).toBeVisible();
});

test("a QUESTION typed in the card is asked, not recorded as the answer", async ({ page }) => {
  await openRail(page);
  const calls = await mockRail(page, {
    body: { kind: "interrogate", reply: "The deadline is Aug 20." },
  });
  const input = page.getByPlaceholder(CARD);
  await input.fill("when is the deadline?");
  await input.press("Enter");

  await expect(page.getByText("The deadline is Aug 20.")).toBeVisible();
  expect(calls).toHaveLength(1);
  expect(calls[0].message).toBe("when is the deadline?");
  expect(calls[0].openQuestion).toBeUndefined();
  await expect(page.getByText(QUESTION)).toBeVisible(); // stays in place
  expect(await answered(page)).toBe(0);
});

test("a plain ANSWER is recorded and shows the updating state", async ({ page }) => {
  await openRail(page);
  const calls = await mockRail(page, { body: { kind: "supply", reply: "Got it." } });
  const input = page.getByPlaceholder(CARD);
  await input.fill("$2M");
  await input.press("Enter");

  await expect(page.getByText("Got it.")).toBeVisible();
  expect(calls[0].message).toBe("$2M");
  expect(calls[0].openQuestion).toBe(QUESTION);
  expect(await answered(page)).toBe(1);
  await expect(page.getByText("updating the take…")).toBeVisible();
});

test("a FAILED answer restores the question instead of skipping it", async ({ page }) => {
  await openRail(page);
  await mockRail(page, { status: 500 });
  const input = page.getByPlaceholder(CARD);
  await input.fill("$2M");
  await input.press("Enter");

  await expect(
    page.getByText("Grant is unavailable right now — try again in a moment."),
  ).toBeVisible();
  await expect(page.getByText(QUESTION)).toBeVisible();
  expect(await answered(page)).toBe(0);
  await expect(page.getByText("updating the take…")).toHaveCount(0);
});

test("an ASK chip sends the pinned query, not the reworded label", async ({ page }) => {
  await openRail(page);
  const calls = await mockRail(page, {
    body: { kind: "interrogate", reply: "Here is your shot." },
  });
  await page.locator(".grant-chip-btn", { hasText: "Can I win this project?" }).click();
  await expect(page.getByText("Here is your shot.")).toBeVisible();
  expect(calls[0].message).toBe("Can I win it?");
});

test("the IMPROVE chip focuses the answer input and never calls the rail", async ({ page }) => {
  await openRail(page);
  const calls = await mockRail(page, { body: { kind: "interrogate", reply: "x" } });
  await page.locator(".grant-chip-btn", { hasText: "Answer the bonding question" }).click();
  await expect(page.getByPlaceholder(CARD)).toBeFocused();
  await page.waitForTimeout(250);
  expect(calls).toHaveLength(0);
});

// ─── B · the composer ────────────────────────────────────────────────────────

test("the composer sends a free-form question", async ({ page }) => {
  await openRail(page);
  const calls = await mockRail(page, {
    body: { kind: "interrogate", reply: "They want a 100% performance bond." },
  });
  const composer = page.getByLabel("Ask Grant");
  await composer.fill("what bond do they want?");
  await composer.press("Enter");
  await expect(page.getByText("They want a 100% performance bond.")).toBeVisible();
  expect(calls[0].message).toBe("what bond do they want?");
  expect(calls[0].openQuestion).toBeUndefined();
});

test("the composer send button is disabled until there is text", async ({ page }) => {
  await openRail(page);
  const sendBtn = page.getByRole("button", { name: "Send" });
  await expect(sendBtn).toBeDisabled();
  await page.getByLabel("Ask Grant").fill("hello");
  await expect(sendBtn).toBeEnabled();
});

test("Shift+Enter in the composer does NOT send", async ({ page }) => {
  await openRail(page);
  const calls = await mockRail(page, { body: { kind: "interrogate", reply: "x" } });
  const composer = page.getByLabel("Ask Grant");
  await composer.fill("draft line");
  await composer.press("Shift+Enter");
  await page.waitForTimeout(200);
  expect(calls).toHaveLength(0); // not sent
  await expect(composer).toHaveValue(/draft line/); // still in the box
});

// ─── C · input kinds (yes/no, currency, date) ────────────────────────────────

test("a yes/no question renders Yes/No buttons, and No records the answer", async ({ page }) => {
  await openRail(page, "yesno");
  await expect(page.getByText("Did you attend the site visit?")).toBeVisible();
  await expect(page.getByPlaceholder(CARD)).toHaveCount(0); // no free-form field
  const calls = await mockRail(page, { body: { kind: "supply", reply: "Noted." } });
  await page.getByRole("button", { name: "No", exact: true }).click();
  await expect(page.getByText("Noted.")).toBeVisible();
  expect(calls[0].message).toBe("No");
  expect(calls[0].openQuestion).toBe("Did you attend the site visit?");
});

test("a currency question: a value is answered, a question is asked", async ({ page }) => {
  await openRail(page, "currency");
  const field = page.getByPlaceholder("$ amount, or ask me anything");
  await expect(field).toBeVisible();

  // A question phrased in the currency box is still ASKED, not recorded.
  const calls = await mockRail(page, { body: { kind: "interrogate", reply: "About $250k." } });
  await field.fill("is $2M enough?");
  await field.press("Enter");
  await expect(page.getByText("About $250k.")).toBeVisible();
  expect(calls[0].openQuestion).toBeUndefined();
  expect(await answered(page)).toBe(0);
});

test("a date question renders a date input", async ({ page }) => {
  await openRail(page, "date");
  await expect(page.getByText("When can you certify?")).toBeVisible();
  await expect(page.locator('input[type="date"]')).toBeVisible();
});

// ─── D · queue behavior (multi-question) ─────────────────────────────────────

test("answering advances to the next question and decrements the count", async ({ page }) => {
  await openRail(page, "multi");
  await expect(page.locator(".grant-dock__need")).toContainText("3");
  await mockRail(page, { body: { kind: "supply", reply: "Got it." } });
  const input = page.getByPlaceholder(CARD);
  await input.fill("$2M");
  await input.press("Enter");
  // Next question (the yes/no site-visit one) slides in.
  await expect(page.getByText("Did you attend the site visit?")).toBeVisible();
  await expect(page.locator(".grant-dock__need")).toContainText("2");
});

test("Skip advances to the next question without calling the rail", async ({ page }) => {
  await openRail(page, "multi");
  const calls = await mockRail(page, { body: { kind: "supply", reply: "x" } });
  await page.getByRole("button", { name: "Skip" }).click();
  await expect(page.getByText("Did you attend the site visit?")).toBeVisible();
  expect(calls).toHaveLength(0);
});

// ─── E · route chip, regen, opp switch ───────────────────────────────────────

test("the sub-play act chip navigates to Partners and never calls the rail", async ({ page }) => {
  await openRail(page, "route");
  const calls = await mockRail(page, { body: { kind: "interrogate", reply: "x" } });
  await page.route("**/partners", (r) =>
    r.fulfill({ status: 200, contentType: "text/html", body: "<html>partners</html>" }),
  );
  await page.locator(".grant-chip-btn", { hasText: "How do I find a partner?" }).click();
  await page.waitForURL("**/partners");
  expect(calls).toHaveLength(0);
});

test("a same-opp regen keeps the conversation and clears the updating state", async ({ page }) => {
  await openRail(page);
  await mockRail(page, { body: { kind: "supply", reply: "Got it." } });
  const input = page.getByPlaceholder(CARD);
  await input.fill("$2M");
  await input.press("Enter");
  await expect(page.getByText("Got it.")).toBeVisible();
  await expect(page.getByText("updating the take…")).toBeVisible();

  await page.evaluate(() => window.__regenSameOpp());

  await expect(page.getByText("Got it.")).toBeVisible(); // thread kept
  await expect(page.getByText("$2M")).toBeVisible();
  await expect(page.getByText("updating the take…")).toHaveCount(0); // cleared
  await expect(page.getByPlaceholder(CARD)).toHaveCount(0); // queue drained
});

test("switching to a different opportunity clears the thread", async ({ page }) => {
  await openRail(page);
  await mockRail(page, { body: { kind: "interrogate", reply: "Sure." } });
  const composer = page.getByLabel("Ask Grant");
  await composer.fill("a stale question");
  await composer.press("Enter");
  await expect(page.getByText("a stale question")).toBeVisible();

  await page.evaluate(() => window.__switchOpp());

  await expect(page.getByText("a stale question")).toHaveCount(0); // cleared
  await expect(page.getByText("I've read this one.")).toBeVisible(); // briefing remains
});
