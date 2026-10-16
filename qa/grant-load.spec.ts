// Load-only check of EVERY opportunity page in the story. No click sweep.
//
// For each story opportunity: open /opportunities/<id> past Grant's introduction,
// wait until the page is quiet, and fail on any console error, page error, demo API
// call without a handler, handler that threw, blocked or outside request, bad text,
// old sample-member text, overflow at 1280 and 1024 px, or a missing part of the page.
//
//   QA_PORT=4342 bunx playwright test qa/grant-load.spec.ts

import { test, expect, type Page } from "@playwright/test";
import { OPPORTUNITIES } from "../src/demo/story/opportunities";

const BAD_TEXT = /something went wrong|unable to sign in|failed to load|error loading|not analyzed yet|\bundefined\b|\[object Object\]|\bNaN\b|\bnull\b/i;
const OLD_PERSONA = /\broof(ing|er|s)?\b|\bMarcus\b|Williams Construction|\b238160\b|SDVOSB|Amira's Kitchen|Diana|\bDEMO-[A-Z]+-\d+|HigherGov/i;
const CALL_WORD = { bid: "Bid", review: "Needs review", no_bid: "No-bid" } as const;

test.setTimeout(60_000);

async function openOpportunity(page: Page, id: string, errors: string[]): Promise<void> {
  page.setDefaultTimeout(12_000);
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console error: ${m.text().slice(0, 300)}`);
  });
  page.on("pageerror", (e) => errors.push(`page error: ${String(e.message).slice(0, 300)}`));
  await page.context().route("**/*", (route) => {
    const url = new URL(route.request().url());
    if (url.protocol === "data:" || url.protocol === "blob:" || ["127.0.0.1", "localhost"].includes(url.hostname)) return route.continue();
    if (url.hostname === "fonts.googleapis.com") return route.fulfill({ status: 200, contentType: "text/css", body: "" });
    if (url.hostname === "fonts.gstatic.com") return route.fulfill({ status: 200, contentType: "font/woff2", body: "" });
    errors.push(`outside request: ${url.href}`);
    return route.abort("blockedbyclient");
  });
  await page.addInitScript(() => {
    (window as unknown as { __DEMO_FAST__: boolean }).__DEMO_FAST__ = true;
  });
  await page.goto(`/opportunities/${id}?met=1&fast=1`, { waitUntil: "domcontentloaded" });
  // Wait for Grant's take to be on the page, and for every demo call to finish.
  await page.waitForSelector(".grant-canvas:not([aria-busy='true']) .gt-call__word", { timeout: 15_000 });
  await page.waitForFunction(() => ((window as unknown as { __DEMO_INFLIGHT__?: number }).__DEMO_INFLIGHT__ ?? 0) === 0, undefined, { timeout: 10_000 });
  await page.waitForTimeout(1_100); // the take reveals its text after about a second
}

for (const o of OPPORTUNITIES) {
  test(`opportunity page ${o.id}`, async ({ page }) => {
    const errors: string[] = [];
    await page.setViewportSize({ width: 1280, height: 800 });
    await openOpportunity(page, o.id, errors);

    const snap = await page.evaluate(() => {
      const w = window as unknown as {
        __DEMO_UNHANDLED__?: { method: string; path: string }[];
        __DEMO_ERRORS__?: { method: string; path: string; message: string }[];
        __DEMO_BLOCKED__?: { url: string }[];
      };
      const main = document.getElementById("demo-main");
      const attrs = Array.from(document.querySelectorAll("[placeholder],[title],[aria-label],img[alt]"))
        .map((el) => [el.getAttribute("placeholder"), el.getAttribute("title"), el.getAttribute("aria-label"), el.getAttribute("alt")].filter(Boolean).join(" "))
        .join(" | ");
      const call = document.querySelector(".gt-call__word .grant-chip")?.textContent?.trim() ?? "";
      const ava = Array.from(document.querySelectorAll<HTMLAnchorElement>(".opp-sticky__actions a")).map((a) => a.getAttribute("href"));
      return {
        unhandled: w.__DEMO_UNHANDLED__ ?? [],
        handlerErrors: w.__DEMO_ERRORS__ ?? [],
        blocked: w.__DEMO_BLOCKED__ ?? [],
        mainText: (main?.innerText ?? "").replace(/\s+/g, " ").trim(),
        attrText: attrs,
        call,
        ava,
        h1: document.querySelector(".opp-sticky__heading")?.textContent ?? "",
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        docs: document.querySelectorAll(".ref-doc__link").length,
        pins: document.querySelectorAll(".grant-pin").length,
        railOpen: Boolean(document.querySelector(".grant-dock")),
        contactLinks: document.querySelectorAll('a[href^="mailto:"], a[href^="tel:"]').length,
        sections: document.querySelectorAll(".evidence-accordion__item").length,
      };
    });

    for (const u of snap.unhandled) errors.push(`unhandled API call: ${u.method} ${u.path}`);
    for (const e of snap.handlerErrors) errors.push(`API handler threw: ${e.method} ${e.path}: ${e.message}`);
    for (const b of snap.blocked) errors.push(`blocked network call: ${b.url}`);
    const text = `${snap.mainText} | ${snap.attrText}`;
    const bad = BAD_TEXT.exec(text);
    if (bad) errors.push(`bad text "${bad[0]}": …${text.slice(Math.max(0, text.indexOf(bad[0]) - 40), text.indexOf(bad[0]) + 60)}…`);
    const old = OLD_PERSONA.exec(text);
    if (old) errors.push(`old sample-member text "${old[0]}"`);

    expect(snap.h1, "the page title").toBe(o.title);
    expect(snap.call, "Grant's call").toBe(CALL_WORD[o.grant.verdict]);
    expect(snap.mainText.length, "text on the page").toBeGreaterThan(1500);
    expect(snap.docs, "reference documents").toBeGreaterThan(0);
    expect(snap.sections, "detailed summary sections").toBeGreaterThanOrEqual(6);
    expect(snap.pins, "source chips").toBeGreaterThan(3);
    expect(snap.railOpen, "Grant's rail").toBe(true);
    expect(snap.contactLinks, "mailto and tel links").toBe(0);
    const wantsAva = Boolean(o.ava) || (o.grant.verdict === "bid" && o.grant.prime === "go");
    expect(snap.ava.includes(`/ava/${o.id}`), "the Ava action").toBe(wantsAva);
    expect(snap.overflow, "horizontal overflow at 1280 px").toBeLessThanOrEqual(1);

    await page.setViewportSize({ width: 1024, height: 800 });
    await page.waitForTimeout(250);
    const narrow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(narrow, "horizontal overflow at 1024 px").toBeLessThanOrEqual(1);

    expect(errors, errors.join("\n")).toEqual([]);
  });
}
