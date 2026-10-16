import type { Locator, Page } from "@playwright/test";

/**
 * One forecast at `/forecasts/$forecastId`, Grant's read on it
 * (`components/Forecast/ForecastGrantTake.tsx`) and Grant's dock
 * (`components/Forecast/ForecastGrantRail.tsx`).
 *
 * The dock's thread and its messages carry no role, so they are matched by class.
 * The strings are the rail's own copy (`RAIL`, `RAIL_CHAT` in
 * `lib/forecasts/grantCopy.ts`).
 */
export class ForecastDetailPage {
  readonly openGrantButton: Locator;
  readonly dock: Locator;
  readonly composer: Locator;
  readonly send: Locator;
  readonly thread: Locator;
  readonly errorLine: Locator;
  /** Grant's read on the page (`components/Forecast/ForecastGrantTake.tsx`). */
  readonly take: Locator;
  /** Grant's call word, the first thing the read box states. */
  readonly callWord: Locator;
  /** Any alert on the page. */
  readonly alerts: Locator;
  /** The Track control in the page header ("Track this" / "Tracked"). */
  readonly trackButton: Locator;
  /** "What changed since you tracked it" (`components/Forecast/ForecastWatchChanges.tsx`). */
  readonly watchBox: Locator;
  /** One list item per change in the box. */
  readonly watchItems: Locator;
  /** The box's "Mark as seen" button. */
  readonly markSeenButton: Locator;
  /** The route chips under Still unknown ("Watched", "Ask the office", …). */
  readonly unknownChips: Locator;
  /** The line under Still unknown that points to Track this. */
  readonly trackLine: Locator;
  /** Grant's bounds in the Meet Grant box. */
  readonly meetBounds: Locator;

  constructor(private readonly page: Page) {
    this.openGrantButton = page.getByRole("button", { name: "Open Grant" });
    this.dock = page.locator(".fc-grant-dock");
    this.composer = this.dock.getByRole("textbox", { name: "Ask Grant about this forecast" });
    this.send = this.dock.getByRole("button", { name: "Send to Grant" });
    this.thread = this.dock.locator(".grant-dock__thread");
    this.errorLine = this.dock.getByRole("status").filter({
      hasText: "Grant could not answer — try again",
    });
    this.take = page.locator("#grant-take");
    this.callWord = this.take.locator(".gt-call__word");
    this.alerts = page.getByRole("alert");
    this.trackButton = page.locator(".fc-trackbtn");
    this.watchBox = page.getByRole("region", { name: "What changed since you tracked it" });
    this.watchItems = this.watchBox.getByRole("listitem");
    this.markSeenButton = this.watchBox.getByRole("button", { name: "Mark as seen" });
    this.unknownChips = page.locator(".fc-unknown .fc-how");
    this.trackLine = page.locator(".fc-unknown__track");
    this.meetBounds = page.locator(".meet__bounds");
  }

  /** The New / Seen tag on each change in the box, in list order. */
  watchTags(): Locator {
    return this.watchItems.locator(".fc-watch__tag");
  }

  /** The change in the box whose text holds `text`. */
  watchItem(text: string): Locator {
    return this.watchItems.filter({ hasText: text });
  }

  /** The New / Seen tag on one change in the box. A suggestion has none. */
  watchItemTag(text: string): Locator {
    return this.watchItem(text).locator(".fc-watch__tag");
  }

  /** The basis sentences under one notice line in the box. */
  watchItemBasis(text: string): Locator {
    return this.watchItem(text).locator(".fc-watch__basis");
  }

  /** Every link in the box. A notice links only to our own page, and only while we hold it. */
  watchLinks(): Locator {
    return this.watchBox.getByRole("link");
  }

  /** One link in the box, by its words ("Open the bid request", "Check the notice", …). */
  watchLink(name: string): Locator {
    return this.watchBox.getByRole("link", { name });
  }

  /** Every element on the page whose own text holds `text`, in the box or out of it. */
  textOnPage(text: string): Locator {
    return this.page.getByText(text);
  }

  /** Markup that an event value must never become inside the box. */
  markupInWatch(): Locator {
    return this.watchBox.locator("script, img, iframe");
  }

  /** Tracks the forecast from the page header, and waits until the control says so. */
  async track(): Promise<void> {
    await this.trackButton.click();
    await this.page.locator('.fc-trackbtn[aria-pressed="true"]').waitFor();
  }

  /** Goes back one step in the SPA's history, without a reload. */
  async back(): Promise<void> {
    await this.page.goBack();
  }

  /** One row of How to win it, by its title (`WIN.rows` in `lib/forecasts/grantCopy.ts`). */
  winRow(title: string): Locator {
    return this.take.locator(".fc-win__row").filter({
      has: this.page.locator("dt").getByText(title, { exact: true }),
    });
  }

  /** The basis lines ("N counted. Matched on: …") under a How to win it row. */
  basisLines(title: string): Locator {
    return this.winRow(title).locator(".fc-take-basis__count");
  }

  /** The source lines ("Source: …") under a How to win it row. */
  sourceLines(title: string): Locator {
    return this.winRow(title).locator(".fc-take-basis__src");
  }

  /** Markup that a register value must never become inside a row. */
  markupIn(title: string): Locator {
    return this.winRow(title).locator("dd").locator("script, img, iframe");
  }

  /** Bold spans inside a row's text. */
  boldIn(title: string): Locator {
    return this.winRow(title).locator("dd b");
  }

  /** The Forecast source box (`components/Forecast/ForecastSource.tsx`). */
  sourceBox(): Locator {
    return this.page.locator("#forecast-source");
  }

  /** Every link in the Forecast source box. */
  sourceLinks(): Locator {
    return this.sourceBox().getByRole("link");
  }

  /** One link in the Forecast source box, by its words. */
  sourceLink(name: string): Locator {
    return this.sourceBox().getByRole("link", { name, exact: true });
  }

  /** Opens the forecast. The path is relative, because the SPA is served under `/v2/ui/`. */
  async open(oppKey: string): Promise<void> {
    await this.page.goto(`./forecasts/${encodeURIComponent(oppKey)}`);
  }

  /** Opens Grant's dock from the slim rail, and waits for the composer. */
  async openGrant(): Promise<void> {
    await this.openGrantButton.click();
    await this.composer.waitFor({ state: "visible" });
  }

  /** Types a message into the composer and sends it. */
  async ask(text: string): Promise<void> {
    await this.composer.fill(text);
    await this.send.click();
  }

  /** One message in the thread, by its exact text. */
  message(text: string): Locator {
    return this.thread.locator(".grant-msg").filter({
      has: this.page.getByText(text, { exact: true }),
    });
  }

  /** A starter chip under the thread. */
  starter(name: string): Locator {
    return this.dock.locator(".grant-dock__chips").getByRole("button", { name });
  }
}
