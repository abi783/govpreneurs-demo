import { test, expect, type Page, type Request } from "@playwright/test";
import { LIVE_MAPPED_ORDERS } from "../src/lib/microPurchases/liveMapperOutput.fixture";
import {
  OpportunityMentorPage,
  SmallOrderMentorPage,
  type MentorSendDialog,
} from "./pages/mentor-send.page";

/**
 * The "Send to a mentor" dialog, end to end in a real browser, on BOTH pages
 * that open it. Every control is driven: the read tick, each topic, the
 * question, Choose file, Remove file, Cancel, the close X and Send. Every send
 * asserts the request the backend receives, not only what the page shows:
 *
 *   POST /opportunities/send-for-review   JSON, the composed note
 *   GET  /mentor-reviews                  finds the review the send opened
 *   POST /mentor-reviews/:id/reply        multipart, the file
 *
 * The real SPA routes boot; only the API origin is stubbed.
 */

// Only the API origin is intercepted: a global glob also catches Vite's dev
// modules (`src/lib/workspace.ts` …) and the page then renders nothing.
const API = "http://localhost:3000";
const LOCATION = "mentorSendLoc01";
const OPP = "opp-mentor-1";
const REVIEW_ID = "rev-mentor-1";
const QUESTION = "I do roofing but haven't done a water plant. Does my past work count?";

const ORDER = {
  ...LIVE_MAPPED_ORDERS[0],
  // Far enough out that the 3-day mentor deadline gate stays open.
  closesOn: "2026-12-01",
  postedOn: "2026-09-28",
};

const OPPORTUNITY = {
  id: OPP,
  title: "Fort Bragg HVAC Maintenance",
  agency: { name: "Department of the Army" },
  responseDeadline: "2026-12-01T00:00:00.000Z",
  placeOfPerformance: { city: "Fayetteville", state: "NC" },
  tier: "high",
  score: 72,
  scoreBreakdown: {},
  matchReasons: [],
  matchBreakdown: {},
  description: "Routine HVAC maintenance.",
  keyDates: [],
};

const json = (body: unknown, status = 200) => ({
  status,
  contentType: "application/json",
  body: JSON.stringify(body),
});

/** `MentorReviewSummary` in `src/lib/mentorReviewsApi.ts`. */
function review(oppKey: string, sourceType: string | null) {
  return {
    id: REVIEW_ID,
    oppKey,
    oppResolved: true,
    sourceType,
    solNumber: null,
    title: "Sent item",
    status: "pending",
    recommendation: null,
    mentorName: null,
    createdAt: "2026-09-29T12:00:00.000Z",
    lastMessageAt: "2026-09-29T12:00:00.000Z",
    lastMessageAuthor: "member",
    lastMessagePreview: "",
    unread: false,
  };
}

interface Calls {
  sends: Record<string, unknown>[];
  replies: Request[];
}

/**
 * Every call both pages make, stubbed. The Mentors list is empty until a send
 * lands and then holds that send's review, which is what the real backend does
 * and what the file attach looks the review up by.
 */
async function stub(
  page: Page,
  oppKey: string,
  opts: { sendStatus?: number; replyStatus?: number; sourceType?: string | null } = {},
): Promise<Calls> {
  const calls: Calls = { sends: [], replies: [] };
  let sent = false;

  // Catch-all FIRST: handlers match in REVERSE registration order.
  await page.route(`${API}/**`, (r) => r.fulfill(json({})));
  await page.route(`${API}/users/from-highlevel`, (r) =>
    r.fulfill(
      json({
        userId: "u1",
        companyId: "c1",
        activeLocation: LOCATION,
        locationId: LOCATION,
        contactId: "ct1",
        userName: "Test Member",
        email: "member@example.com",
        role: "admin",
        type: "location",
        isAgencyOwner: false,
        appStatus: "active",
        productId: null,
        priceId: null,
        planId: null,
        subscriptionId: null,
        isMentor: false,
        isLocationExist: true,
        saasMode: null,
        grantV2: true,
      }),
    ),
  );
  await page.route(`${API}/wallet/balance**`, (r) =>
    r.fulfill(json({ balance: 500, chargeAmount: 97 })),
  );
  await page.route(`${API}/workspace**`, (r) =>
    r.fulfill(json({ savedOpps: [], savedSearches: [] })),
  );
  await page.route(`${API}/mentor-reviews`, (r) =>
    r.fulfill(json({ reviews: sent ? [review(oppKey, opts.sourceType ?? null)] : [] })),
  );
  await page.route(`${API}/opportunities/send-for-review`, (r) => {
    calls.sends.push(r.request().postDataJSON() as Record<string, unknown>);
    if (opts.sendStatus && opts.sendStatus >= 400) {
      return r.fulfill(
        json(
          { message: "Your wallet charge was declined. Please check your wallet balance and try again." },
          opts.sendStatus,
        ),
      );
    }
    sent = true;
    return r.fulfill(json({ success: true, status: 200, updatedCount: 1, message: "ok" }));
  });
  await page.route(`${API}/mentor-reviews/*/reply`, (r) => {
    calls.replies.push(r.request());
    if (opts.replyStatus && opts.replyStatus >= 400) {
      return r.fulfill(json({ message: "upload failed" }, opts.replyStatus));
    }
    return r.fulfill(
      json({
        message: {
          id: "m1",
          author: "member",
          authorName: "Test Member",
          bodyHtml: "",
          at: "2026-09-29T12:00:00.000Z",
          attachments: [{ name: "file", url: null }],
        },
      }),
    );
  });

  // The opportunity page.
  await page.route(`${API}/opportunities/discover/v2/${OPP}*`, (r) => r.fulfill(json(OPPORTUNITY)));
  await page.route(`${API}/grants-take/analysis`, (r) => r.fulfill(json({ analysis: null })));

  // The small-order page reads its order off the board's feed.
  await page.route(`${API}/small-orders/feed**`, (r) =>
    r.fulfill(
      json({
        orders: [ORDER],
        asOf: "2026-09-29T12:00:00.000Z",
        postedOnLabel: "Sep 29",
        count: 1,
        total: 1,
        boardTotal: 1,
        more: null,
      }),
    ),
  );
  await page.route(`${API}/small-orders/acquisition-codes`, (r) => r.fulfill(json([])));
  await page.route(`${API}/small-orders/orders/${ORDER.id}`, (r) => r.fulfill(json(ORDER)));
  return calls;
}

/** Fill every required answer, ticking the given topics. */
async function complete(d: MentorSendDialog, readLabel: RegExp, topics: (RegExp | string)[]) {
  await d.checkbox(readLabel).check();
  for (const t of topics) await d.checkbox(t).check();
  await d.question.fill(QUESTION);
}

/** The multipart body of a reply, as text, for the part headers. */
function multipartText(req: Request): string {
  return req.postDataBuffer()?.toString("latin1") ?? "";
}

test.describe("opportunity page — Send to a mentor", () => {
  test("shows the opportunity's form: Grant's take, the read tick and the six bid topics", async ({
    page,
  }) => {
    await stub(page, OPP);
    const opp = new OpportunityMentorPage(page);
    await opp.open(OPP);
    await opp.openDialog();
    const d = opp.dialog;

    await expect(d.title).toBeVisible();
    await expect(d.snapshot).toContainText("Fort Bragg HVAC Maintenance");
    await expect(d.snapshot).toContainText("Grant's take:");
    await expect(d.checkbox(/I've read the scope of work/)).not.toBeChecked();
    await expect(d.topics()).toHaveText([
      "Should I bid on this?",
      "Am I eligible? (set-aside, licences, bonding, experience)",
      "Pricing",
      "Writing the proposal",
      "Teaming or subcontracting",
      "Something else",
    ]);
    await expect(d.question).toHaveAttribute("placeholder", /I do roofing/);
    await expect(d.fileName).toHaveText("No file chosen");
    await expect(d.send).toHaveText(/Send for \$97\.00/);
  });

  test("Send stays locked until the tick, a topic and a 30-character question are all in", async ({
    page,
  }) => {
    await stub(page, OPP);
    const opp = new OpportunityMentorPage(page);
    await opp.open(OPP);
    await opp.openDialog();
    const d = opp.dialog;

    await expect(d.send).toBeDisabled();
    await d.checkbox(/I've read the scope of work/).check();
    await expect(d.send).toBeDisabled();
    await d.checkbox("Pricing").check();
    await expect(d.send).toBeDisabled();
    await d.question.fill("Too short to send.");
    await expect(d.send).toBeDisabled();
    await d.question.fill(QUESTION);
    await expect(d.send).toBeEnabled();

    // Every answer is required: taking one back locks it again.
    await d.checkbox("Pricing").uncheck();
    await expect(d.send).toBeDisabled();
    await d.checkbox("Pricing").check();
    await d.checkbox(/I've read the scope of work/).uncheck();
    await expect(d.send).toBeDisabled();
  });

  test("every topic box ticks and unticks", async ({ page }) => {
    await stub(page, OPP);
    const opp = new OpportunityMentorPage(page);
    await opp.open(OPP);
    await opp.openDialog();
    const boxes = opp.dialog.root.locator(".mentor-modal__topic input");

    await expect(boxes).toHaveCount(6);
    for (let i = 0; i < 6; i++) {
      await boxes.nth(i).check();
      await expect(boxes.nth(i)).toBeChecked();
      await boxes.nth(i).uncheck();
      await expect(boxes.nth(i)).not.toBeChecked();
    }
  });

  test("the close X and Cancel both shut the dialog, send nothing, and clear the form", async ({
    page,
  }) => {
    const calls = await stub(page, OPP);
    const opp = new OpportunityMentorPage(page);
    await opp.open(OPP);
    const d = opp.dialog;

    await opp.openDialog();
    await complete(d, /I've read the scope of work/, [/Should I bid on this\?/]);
    await d.closeX.click();
    await expect(d.root).toBeHidden();

    await opp.openDialog();
    await expect(d.checkbox(/I've read the scope of work/)).not.toBeChecked();
    await expect(d.checkbox(/Should I bid on this\?/)).not.toBeChecked();
    await expect(d.question).toHaveValue("");
    await complete(d, /I've read the scope of work/, ["Pricing"]);
    await d.cancel.click();
    await expect(d.root).toBeHidden();

    await opp.openDialog();
    await expect(d.question).toHaveValue("");
    expect(calls.sends).toEqual([]);
  });

  test("Send posts the topics and question as the note, and attaches no file when none was chosen", async ({
    page,
  }) => {
    const calls = await stub(page, OPP);
    const opp = new OpportunityMentorPage(page);
    await opp.open(OPP);
    await opp.openDialog();
    const d = opp.dialog;

    await complete(d, /I've read the scope of work/, [
      "Writing the proposal",
      /Should I bid on this\?/,
    ]);
    await d.send.click();

    await expect(d.root).toBeHidden();
    expect(calls.sends).toEqual([
      {
        userId: "u1",
        locationId: LOCATION,
        solNumbers: [OPP],
        opportunityIds: [OPP],
        message:
          "Confirmed: I've read the scope of work.\n" +
          `Help with: Should I bid on this?; Writing the proposal.\nQuestion: ${QUESTION}`,
      },
    ]);
    expect(calls.replies).toEqual([]);
    await expect(opp.alerts).toHaveCount(0);
  });

  test("Choose file opens the file picker, and the file follows the send onto the new review", async ({
    page,
  }) => {
    const calls = await stub(page, OPP);
    const opp = new OpportunityMentorPage(page);
    await opp.open(OPP);
    await opp.openDialog();
    const d = opp.dialog;

    await d.chooseThroughButton("scope-notes.pdf", "application/pdf");
    await expect(d.fileName).toHaveText("scope-notes.pdf");
    await complete(d, /I've read the scope of work/, [/Am I eligible\?/]);
    await d.send.click();

    await expect(d.root).toBeHidden();
    expect(calls.sends).toHaveLength(1);
    expect(calls.sends[0].message).toBe(
      "Confirmed: I've read the scope of work.\n" +
        `Help with: Am I eligible? (set-aside, licences, bonding, experience).\nQuestion: ${QUESTION}`,
    );
    expect(calls.replies).toHaveLength(1);
    const reply = calls.replies[0];
    expect(reply.url()).toBe(`${API}/mentor-reviews/${REVIEW_ID}/reply`);
    expect(reply.headers()["content-type"]).toMatch(/^multipart\/form-data; boundary=/);
    const body = multipartText(reply);
    expect(body).toContain('name="attachments"; filename="scope-notes.pdf"');
    // A real message rides with the file: an empty one would make the backend
    // post its `&nbsp;` placeholder to Intercom.
    expect(body).toContain('name="body"\r\n\r\nHere is a supporting file for my question.\r\n');
    expect(body).toContain("%PDF-1.4");
    await expect(opp.alerts).toHaveCount(0);
  });

  test("Remove file takes the file back, and a wrong type is refused before it is kept", async ({
    page,
  }) => {
    const calls = await stub(page, OPP);
    const opp = new OpportunityMentorPage(page);
    await opp.open(OPP);
    await opp.openDialog();
    const d = opp.dialog;

    await d.attach("installer.exe", "application/octet-stream");
    await expect(d.fileError).toHaveText(/can't be attached/);
    await expect(d.fileName).toHaveText("No file chosen");

    await d.attach("bond-letter.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    await expect(d.fileError).toHaveCount(0);
    await expect(d.fileName).toHaveText("bond-letter.docx");
    await d.removeFile.click();
    await expect(d.fileName).toHaveText("No file chosen");
    await expect(d.removeFile).toHaveCount(0);

    await complete(d, /I've read the scope of work/, ["Something else"]);
    await d.send.click();
    await expect(d.root).toBeHidden();
    expect(calls.sends).toHaveLength(1);
    expect(calls.replies).toEqual([]);
  });

  test("a file over 10 MB is refused", async ({ page }) => {
    await stub(page, OPP);
    const opp = new OpportunityMentorPage(page);
    await opp.open(OPP);
    await opp.openDialog();

    await opp.dialog.attach("huge.pdf", "application/pdf", 10 * 1024 * 1024 + 1);
    await expect(opp.dialog.fileError).toHaveText("That file is over 10 MB.");
    await expect(opp.dialog.fileName).toHaveText("No file chosen");
  });

  test("a failed send says why and keeps her answers in the open dialog", async ({ page }) => {
    const calls = await stub(page, OPP, { sendStatus: 402 });
    const opp = new OpportunityMentorPage(page);
    await opp.open(OPP);
    await opp.openDialog();
    const d = opp.dialog;

    await complete(d, /I've read the scope of work/, ["Pricing"]);
    await d.send.click();

    // The open dialog hides the page behind it from the accessibility tree.
    await expect(opp.alertsBehindDialog).toHaveText(
      "Your wallet charge was declined. Please check your wallet balance and try again.",
    );
    await expect(d.root).toBeVisible();
    await expect(d.question).toHaveValue(QUESTION);
    await expect(d.checkbox("Pricing")).toBeChecked();
    expect(calls.sends).toHaveLength(1);
    expect(calls.replies).toEqual([]);
  });

  test("a file that fails to attach is reported, and the send is not undone", async ({ page }) => {
    const calls = await stub(page, OPP, { replyStatus: 500 });
    const opp = new OpportunityMentorPage(page);
    await opp.open(OPP);
    await opp.openDialog();
    const d = opp.dialog;

    await d.attach("quote.xlsx", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    await complete(d, /I've read the scope of work/, ["Pricing"]);
    await d.send.click();

    await expect(d.root).toBeHidden();
    await expect(opp.alerts).toHaveText(
      "Sent to a mentor, but the file didn't attach. Add it to the conversation in Mentors.",
    );
    expect(calls.sends).toHaveLength(1);
    expect(calls.replies).toHaveLength(1);
  });
});

test.describe("small-order page — Send to a mentor", () => {
  test("shows the order's form: the order and its price line, the read tick and the seven quote topics", async ({
    page,
  }) => {
    await stub(page, ORDER.id, { sourceType: "dibbs" });
    const so = new SmallOrderMentorPage(page);
    await so.open(ORDER.id);
    await so.openDialog();
    const d = so.dialog;

    await expect(d.snapshot).toContainText(ORDER.plainName);
    await expect(d.snapshot).not.toContainText("Grant's take");
    await expect(d.checkbox(/I've read the order and the part details/)).not.toBeChecked();
    await expect(d.topics()).toHaveText([
      "Should I quote on this?",
      "Can I supply this part? (approved sources, qualified list, acquisition code)",
      "Pricing my quote",
      "Quantity and unit of issue",
      "Delivery and shipping",
      "Filling in the quote on DIBBS",
      "Something else",
    ]);
    await expect(d.question).toHaveAttribute("placeholder", /distributor/);
    await expect(d.root).toContainText("Supplier quote, spec sheet, or other supporting file.");
  });

  test("Send stays locked until the form is complete, and X and Cancel shut it without sending", async ({
    page,
  }) => {
    const calls = await stub(page, ORDER.id, { sourceType: "dibbs" });
    const so = new SmallOrderMentorPage(page);
    await so.open(ORDER.id);
    const d = so.dialog;

    await so.openDialog();
    await expect(d.send).toBeDisabled();
    await d.checkbox(/I've read the order/).check();
    await d.checkbox("Quantity and unit of issue").check();
    await expect(d.send).toBeDisabled();
    await d.question.fill(QUESTION);
    await expect(d.send).toBeEnabled();
    await d.closeX.click();
    await expect(d.root).toBeHidden();

    await so.openDialog();
    await expect(d.send).toBeDisabled();
    await d.cancel.click();
    await expect(d.root).toBeHidden();
    expect(calls.sends).toEqual([]);
  });

  test("Send posts the order, the note and the file, and the page then says it was sent", async ({
    page,
  }) => {
    const calls = await stub(page, ORDER.id, { sourceType: "dibbs" });
    const so = new SmallOrderMentorPage(page);
    await so.open(ORDER.id);
    await so.openDialog();
    const d = so.dialog;

    await d.chooseThroughButton("supplier-quote.pdf", "application/pdf");
    await complete(d, /I've read the order/, [
      "Delivery and shipping",
      /Can I supply this part\?/,
      "Filling in the quote on DIBBS",
    ]);
    await d.send.click();

    await expect(d.root).toBeHidden();
    expect(calls.sends).toEqual([
      {
        userId: "u1",
        locationId: LOCATION,
        solNumbers: [ORDER.solicitation || ORDER.id],
        opportunityIds: [ORDER.id],
        message:
          "Confirmed: I've read the order and the part details.\n" +
          "Help with: Can I supply this part? (approved sources, qualified list, acquisition code); " +
          `Delivery and shipping; Filling in the quote on DIBBS.\nQuestion: ${QUESTION}`,
      },
    ]);
    expect(calls.replies).toHaveLength(1);
    expect(calls.replies[0].url()).toBe(`${API}/mentor-reviews/${REVIEW_ID}/reply`);
    expect(multipartText(calls.replies[0])).toContain('filename="supplier-quote.pdf"');
    await expect(so.sentLine.first()).toBeVisible();
    await expect(so.sendToMentor).toHaveCount(0);
  });

  test("a file that fails to attach is still reported after the order counts as sent", async ({
    page,
  }) => {
    await stub(page, ORDER.id, { sourceType: "dibbs", replyStatus: 500 });
    const so = new SmallOrderMentorPage(page);
    await so.open(ORDER.id);
    await so.openDialog();
    const d = so.dialog;

    await d.attach("spec.png", "image/png");
    await complete(d, /I've read the order/, ["Pricing my quote"]);
    await d.send.click();

    await expect(d.root).toBeHidden();
    await expect(so.alerts).toHaveText(
      "Sent to a mentor, but the file didn't attach. Add it to the conversation in Mentors.",
    );
    await expect(so.sentLine.first()).toBeVisible();
  });
});
