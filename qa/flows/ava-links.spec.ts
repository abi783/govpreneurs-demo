// What Tim does in Ava shows on the Pipeline and in Tasks.
import { expect, test } from "@playwright/test";

const KEY = "gp-demo:v1:ava.states";

test("a sent reply and uploaded certificates show on Pipeline and Tasks", async ({ page }) => {
  await page.goto("/?fast=1");
  await page.evaluate((key) => {
    const at = new Date().toISOString();
    const states = {
      "W912EE-27-S-0004": { started: true, sentAt: at, answers: {} },
      "CUMCO-2026-014": { started: true, answers: { "ask-food-handlers": { status: "done", at, fileName: "certificates.pdf" } } },
    };
    sessionStorage.setItem(key, JSON.stringify(states));
  }, KEY);
  await page.goto("/pipeline?fast=1");
  await expect(page.getByText(/You sent it on/)).toBeVisible();
  await expect(page.getByText("Certificates in. Ava is building the bid again.")).toBeVisible();
  await page.goto("/tasks?fast=1");
  await page.waitForLoadState("networkidle");
  const body = await page.locator("body").innerText();
  expect(body).not.toMatch(/Send your Fort Bragg sources-sought reply[\s\S]{0,200}Open/);
});
