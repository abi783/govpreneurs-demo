// E2E for the UAT #46 rail fixes, on the real GrantRail in a real browser:
//
//   1 · Source chips under a reply are the CITED set — a reply that arrives
//       with sources renders them; one with none renders no chip row at all
//       (the old behavior put the same six chips under every bubble).
//   2 · A draft_request reply renders the approved Ava copy plus a
//       "Schedule a mentor call" button that dispatches to the OWNER (the
//       route decides modal vs upsell — the rail never does), and does not
//       consume the open question.
//   3 · Start over is Hunter's format: a text button by the composer, only
//       once a thread exists, clearing it through POST /rail/reset — and the
//       header carries no start-over icon any more.
import { test, expect, type Page, type Route } from "@playwright/test";

async function mockRail(page: Page, body: unknown): Promise<void> {
  await page.route("**/grants-take/rail", (route: Route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(body),
    }),
  );
}

async function mockReset(page: Page): Promise<{ count: () => number }> {
  let n = 0;
  await page.route("**/grants-take/rail/reset", (route: Route) => {
    n += 1;
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });
  return { count: () => n };
}

async function openRail(page: Page): Promise<void> {
  await page.goto("e2e/harness.html");
  await expect(page.getByLabel("Ask Grant")).toBeVisible();
}

async function send(page: Page, text: string): Promise<void> {
  const composer = page.getByLabel("Ask Grant");
  await composer.fill(text);
  await composer.press("Enter");
}

const APPROVED =
  "Ava AI - our Proposal Drafter is still under construction. I'd recommend " +
  "saving the opportunities that interest you and scheduling a mentor call " +
  "for a review and possible next steps.";

const CARD = "Type your answer, or ask me anything";

// ─── 1 · cited sources ───────────────────────────────────────────────────────

test("a reply's cited pins render as chips under the bubble", async ({ page }) => {
  await openRail(page);
  await mockRail(page, {
    kind: "interrogate",
    reply: "148 firms hold comparable awards.",
    sources: [
      {
        label: "148 firms have won work like this",
        provenance: {
          type: "public",
          ref: "tally:market-winners",
          tally: {
            kind: "market-winners",
            figure: 148,
            basis: { matchedOn: "NAICS 238160", count: 148 },
          },
        },
      },
    ],
  });
  await send(page, "who else does this work?");
  await expect(page.getByText("148 firms hold comparable awards.")).toBeVisible();
  await expect(page.locator(".grant-msg__sources")).toBeVisible();
  await expect(page.getByText("Grant read")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /148 firms have won work like this/ }),
  ).toBeVisible();
});

test("a reply with NO citations renders no chip row — never the whole desk", async ({
  page,
}) => {
  await openRail(page);
  await mockRail(page, { kind: "interrogate", reply: "Ready when you are.", sources: [] });
  await send(page, "are you ready?");
  await expect(page.getByText("Ready when you are.")).toBeVisible();
  await expect(page.locator(".grant-msg__sources")).toHaveCount(0);
});

// ─── 2 · the drafting deflection ─────────────────────────────────────────────

test("a draft_request renders the approved copy and the mentor button dispatches", async ({
  page,
}) => {
  await openRail(page);
  await mockRail(page, { kind: "draft_request", reply: APPROVED, cta: "mentor", sources: [] });
  await send(page, "draft my proposal");

  await expect(page.getByText(APPROVED)).toBeVisible();
  const btn = page.getByRole("button", { name: "Schedule a mentor call" });
  await expect(btn).toBeVisible();
  await btn.click();
  expect(await page.evaluate(() => window.__mentor)).toBe(1);
});

test("a draft_request does not consume the open question", async ({ page }) => {
  await openRail(page);
  await mockRail(page, { kind: "draft_request", reply: APPROVED, cta: "mentor" });
  const input = page.getByPlaceholder(CARD);
  await input.fill("just draft it for me");
  await input.press("Enter");
  await expect(page.getByText(APPROVED)).toBeVisible();
  // Not landed: the question is restored, no regen fires.
  await expect(page.getByText("What's your bonding capacity?")).toBeVisible();
  expect(await page.evaluate(() => window.__answered)).toBe(0);
});

test("an ordinary reply carries no mentor button", async ({ page }) => {
  await openRail(page);
  await mockRail(page, { kind: "interrogate", reply: "The incumbent holds it." });
  await send(page, "who holds it?");
  await expect(page.getByText("The incumbent holds it.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Schedule a mentor call" })).toHaveCount(0);
});

// ─── 3 · Start over ──────────────────────────────────────────────────────────

test("Start over is a text button by the composer, shown only with a thread, and clears it", async ({
  page,
}) => {
  await openRail(page);
  const reset = await mockReset(page);
  await mockRail(page, { kind: "interrogate", reply: "hello there" });

  // No thread yet → no control anywhere, and no icon in the header.
  await expect(page.getByRole("button", { name: /start over/i })).toHaveCount(0);

  await send(page, "hi");
  await expect(page.getByText("hello there")).toBeVisible();

  const btn = page.getByRole("button", { name: "Start over — clear this conversation" });
  await expect(btn).toBeVisible();
  await expect(btn).toHaveText("Start over"); // Hunter's format: text, not an icon
  await expect(btn).toHaveClass(/chip-inline-link/);
  // Placement: inside the row above the composer, NOT the dock header.
  await expect(page.locator(".grant-dock__startover .chip-inline-link")).toBeVisible();
  await expect(page.locator(".grant-dock__head button", { hasText: "Start over" })).toHaveCount(0);

  await btn.click();
  await expect(page.getByText("hello there")).toHaveCount(0); // thread gone
  await expect(page.getByRole("button", { name: /start over/i })).toHaveCount(0); // control gone with it
  expect(reset.count()).toBe(1);
});

test("a failed reset keeps the thread and says so, instead of faking the wipe", async ({
  page,
}) => {
  await openRail(page);
  await page.route("**/grants-take/rail/reset", (route: Route) =>
    route.fulfill({ status: 500, contentType: "application/json", body: "{}" }),
  );
  await mockRail(page, { kind: "interrogate", reply: "hello there" });
  await send(page, "hi");
  await expect(page.getByText("hello there")).toBeVisible();

  await page.getByRole("button", { name: "Start over — clear this conversation" }).click();
  await expect(
    page.getByText("Couldn't start over just now — try again in a moment."),
  ).toBeVisible();
  await expect(page.getByText("hello there")).toBeVisible(); // thread kept
});
