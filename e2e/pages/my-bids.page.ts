import type { Locator, Page } from "@playwright/test";
import { WATCH_MARKER_NAME } from "./forecasts-list.page";

/** One row on My Bids (`components/Bids/BidCard.tsx`), scoped to its own card. */
export class BidRow {
  readonly root: Locator;
  /** The change marker on a tracked forecast's row. */
  readonly watchMarker: Locator;

  constructor(page: Page, title: string) {
    this.root = page.locator(".bid-card").filter({
      has: page.locator(".bid-card__title").getByText(title, { exact: true }),
    });
    this.watchMarker = this.root.getByRole("img", { name: WATCH_MARKER_NAME });
  }
}

/** My Bids at `/pipeline` (`routes/pipeline.tsx`). */
export class MyBidsPage {
  constructor(private readonly page: Page) {}

  /** Opens My Bids. The path is relative, because the SPA is served under `/v2/ui/`. */
  async open(): Promise<void> {
    await this.page.goto("./pipeline");
  }

  row(title: string): BidRow {
    return new BidRow(this.page, title);
  }
}
