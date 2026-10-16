// Every menu item is reachable and opens its page, on a short laptop screen too.
import { expect, test } from "@playwright/test";
import { ALL_MENU_ITEMS } from "../../src/demo/nav/menu";

for (const size of [{ width: 1280, height: 720 }, { width: 1440, height: 900 }]) {
  test(`menu works at ${size.width}x${size.height}`, async ({ page }) => {
    await page.setViewportSize(size);
    await page.goto("/?fast=1");
    const nav = page.locator("nav").first();
    for (const item of ALL_MENU_ITEMS) {
      const link = nav.getByRole("link", { name: item.label, exact: true });
      await link.scrollIntoViewIfNeeded();
      await expect(link).toBeVisible();
      await link.click();
      await expect(page).toHaveURL(new RegExp(`${item.to === "/" ? "/(\\?.*)?$" : item.to}`));
    }
    await page.goto("/government-buyers?fast=1");
    await page.screenshot({ path: `qa/report/shots/menu-${size.width}x${size.height}.png` });
  });
}
