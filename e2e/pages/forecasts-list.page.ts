import type { Locator, Page } from "@playwright/test";
import { FILTERS, LIST_COPY } from "../../src/lib/forecasts/copy";

/** The list's cards. Presentational, so matched by class. */
const CARD = ".fc-card";

/** A change marker's accessible name (`WATCH_MARKER.accessibleName` in `lib/forecasts/watchCopy.ts`). */
export const WATCH_MARKER_NAME = /unseen changes? to this forecast/;

/**
 * One forecast card on the list (`components/Forecast/ForecastCard.tsx`). Every
 * locator is scoped to the card's own root, so a list with several cards addresses
 * the right one.
 */
export class ForecastListCard {
  readonly root: Locator;
  readonly heading: Locator;
  /** The change marker (`components/Forecast/WatchMarker.tsx`): text plus an icon. */
  readonly watchMarker: Locator;
  /** Hunter's take line in the card's top block. Presentational, so matched by class. */
  readonly take: Locator;
  /** The label above the take line ("Hunter's take" or "Why Hunter thinks this fits"). */
  readonly takeKicker: Locator;
  /** The fit chip from her `matches` row. Presentational, so matched by class. */
  readonly fitChip: Locator;

  constructor(page: Page, title: string) {
    this.heading = page.getByRole("heading", { name: title });
    this.root = page.locator(CARD).filter({ has: this.heading });
    this.fitChip = this.root.locator(".fc-fit");
    this.watchMarker = this.root.getByRole("img", { name: WATCH_MARKER_NAME });
    this.take = this.root.locator(".opp-why-text");
    this.takeKicker = this.root.locator(".opp-why-kicker");
  }

  /** Opens the forecast's page from its card. */
  async open(): Promise<void> {
    await this.heading.click();
  }
}

/** Hunter's forecasts list at `/forecasts` (`routes/forecasts.index.tsx`). */
export class ForecastsListPage {
  constructor(private readonly page: Page) {}

  /** Opens the Saved view, where every tracked forecast is listed. The path is
   *  relative, because the SPA is served under `/v2/ui/`. */
  async openSaved(): Promise<void> {
    await this.page.goto("./forecasts?view=saved");
  }

  /** Opens the All forecasts view, where every active forecast is listed. Relative path. */
  async openAll(): Promise<void> {
    await this.page.goto("./forecasts?view=all");
  }

  /** Opens Forecasts for you, the list's default view. Relative path. */
  async openForYou(): Promise<void> {
    await this.page.goto("./forecasts");
  }

  card(title: string): ForecastListCard {
    return new ForecastListCard(this.page, title);
  }

  /** Every card's title, in the order the list shows them. */
  cardTitles(): Promise<string[]> {
    return this.page.locator(`${CARD} .fc-card__title`).allTextContents();
  }

  /** Waits until the list shows at least `count` cards. */
  async waitForCards(count: number): Promise<void> {
    await this.page
      .locator(CARD)
      .nth(count - 1)
      .waitFor();
  }

  /** The view control whose name starts with `label` ("Forecasts for you", "All forecasts", "Saved"). */
  viewTab(label: string): Locator {
    return this.page.getByRole("button", { name: new RegExp(`^${label}`) });
  }

  /** The count badge on a view control. Presentational, so matched by class. */
  viewCount(label: string): Locator {
    return this.viewTab(label).locator(".opps-tab-count");
  }

  /** Moves to the view named `label`. */
  async switchView(label: string): Promise<void> {
    await this.viewTab(label).click();
  }

  /** Scrolls the last card into view, so the list asks for its next page. */
  async scrollToListEnd(): Promise<void> {
    await this.page.locator(CARD).last().scrollIntoViewIfNeeded();
  }

  /** The notice that a next page failed. The cards already loaded stay above it. */
  get moreError(): Locator {
    return this.page.getByRole("alert").filter({ hasText: LIST_COPY.moreError });
  }

  /** Asks the failed next page again. */
  async retryMore(): Promise<void> {
    await this.moreError.getByRole("button", { name: "Retry", exact: true }).click();
  }

  /** Opens the filter drawer. */
  async openFilters(): Promise<void> {
    await this.page.getByRole("button", { name: FILTERS.open, exact: true }).click();
  }

  /** Turns on the "Kind of work" pill named `label` in the open drawer. */
  async chooseWork(label: string): Promise<void> {
    await this.page
      .getByRole("dialog", { name: FILTERS.title })
      .getByRole("group", { name: FILTERS.labels.work })
      .getByRole("button", { name: label })
      .click();
  }
}
