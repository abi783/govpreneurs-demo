// Shared helpers for Ava's own QA specs (qa/flows/ava-qa.spec.ts). They open a
// bid, answer its questions the way a person would, and write the visible text
// of each state to qa/report/text/ava-*.txt, so a person can read it.

import fs from "node:fs";
import path from "node:path";
import { expect, type Download, type Page } from "@playwright/test";

export const BIDS = {
  mackall: "SP4701-26-Q-0021",
  fayetteville: "FAYNC-2026-R-08",
  cumberland: "CUMCO-2026-014",
  reply: "W912EE-27-S-0004",
} as const;

/** Text that must never show on a page. */
export const BAD_TEXT =
  /\bundefined\b|\bNaN\b|\[object Object\]|Invalid Date|something went wrong|\bnull\b/i;
/** Text from the wrong business, the wrong mentor, or things the demo bans. */
export const WRONG_STORY =
  /\broof(ing|er|s)?\b|\bMarcus\b|Williams Construction|238160|Diana|Potts|Amira's Kitchen|\bDEMO-|HigherGov|Sodexo|Aramark|Compass Group|Eurest|Hay Street (United )?Methodist/i;
/** A promise to win, or Ava sending a bid herself. */
export const PROMISES =
  /\bwill win\b|guarantee[sd]?\b|you(?:'ll| will) (?:be )?awarded|sure to win|Ava (?:will )?(?:submit|send)s? (?:it|your|the bid)|submitted for you|I(?: will)? (?:submit|send) (?:it|your bid|the bid) for you/i;

export const QUIET =
  /not sure|leave it|later|stop working|ask a mentor|i don't have|not yet|take my answer/i;

export interface Watch {
  problems: string[];
  downloads: Download[];
  requests: string[];
}

/** Watch a page: console errors and warnings, page errors, requests that leave the app. */
export function watch(page: Page): Watch {
  const w: Watch = { problems: [], downloads: [], requests: [] };
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning")
      w.problems.push(`console ${m.type()}: ${m.text().slice(0, 300)}`);
  });
  page.on("pageerror", (e) => w.problems.push(`page error: ${e.message.slice(0, 300)}`));
  page.on("download", (d) => w.downloads.push(d));
  page.on("request", (r) => {
    const u = new URL(r.url());
    const local = ["127.0.0.1", "localhost"].includes(u.hostname);
    const inline = /^(data|blob):/.test(u.protocol);
    const fonts = /fonts\.(googleapis|gstatic)\.com/.test(u.hostname);
    if (!local && !inline && !fonts) w.problems.push(`outside request: ${r.url()}`);
  });
  return w;
}

const TEXT_DIR = path.join(process.cwd(), "qa", "report", "text");

/** Write the visible text of the main area to qa/report/text/ava-<name>.txt. */
export async function dump(page: Page, name: string): Promise<string> {
  const text = await page.locator("#demo-main").innerText();
  fs.mkdirSync(TEXT_DIR, { recursive: true });
  fs.writeFileSync(path.join(TEXT_DIR, `ava-${name}.txt`), text);
  return text;
}

/** Fail on any text that must not show. */
export async function cleanText(page: Page, where: string): Promise<string> {
  const text = await dump(page, where.replace(/[^a-z0-9]+/gi, "-").toLowerCase());
  expect(text, `${where}: bad text`).not.toMatch(BAD_TEXT);
  expect(text, `${where}: wrong story`).not.toMatch(WRONG_STORY);
  expect(text, `${where}: a promise or a send by Ava`).not.toMatch(PROMISES);
  return text;
}

export async function open(page: Page, id: string, fast = true): Promise<void> {
  await page.goto(`/ava/${id}${fast ? "?fast=1" : ""}`);
  await page.waitForLoadState("networkidle");
  await expect(page.locator(".ava2, .ava-page").first()).toBeVisible();
}

/** Tick every box in an open dialog and press its main button. */
export async function confirmDialog(page: Page): Promise<boolean> {
  const dialog = page.getByRole("dialog");
  if (!(await dialog.isVisible().catch(() => false))) return false;
  for (const box of await dialog.getByRole("checkbox").all()) {
    if (!(await box.isChecked())) await box.check();
  }
  const main = dialog.locator("button.btn-primary:not([disabled])");
  if ((await main.count()) === 0) return false;
  await main.first().click();
  await page.waitForTimeout(150);
  return true;
}

export interface Step {
  question: string;
  chips: string[];
  picked: string;
  how: "chip" | "typed" | "fields" | "dialog";
}

/** Words a person could type in the box that asks for `asks`. */
function fillFor(asks: string): string {
  if (/meals/.test(asks)) return "400";
  if (/percent|%|contingency|profit/.test(asks)) return "5";
  if (/email/.test(asks)) return "reference@example.com";
  if (/phone/.test(asks)) return "(910) 555-0100";
  if (/name|title/.test(asks)) return "Dana Reyes";
  return "12";
}

/** Answer questions until Ava says the bid is ready (the "Read my bid" button).
 *  `pick` chooses a chip. `typeEvery`: type the chip's words instead of tapping
 *  it, every n-th question (0: never). Returns every step taken. */
export async function answerAll(
  page: Page,
  opts: {
    pick?: (labels: string[]) => number;
    typeEvery?: number;
    max?: number;
  } = {},
): Promise<Step[]> {
  const steps: Step[] = [];
  const ready = page.getByRole("button", { name: "Read my bid" });
  const pickIdx =
    opts.pick ??
    ((labels: string[]) => {
      const i = labels.findIndex((l) => !QUIET.test(l));
      return i >= 0 ? i : 0;
    });
  let n = 0;
  for (let i = 0; i < (opts.max ?? 90); i++) {
    if (await ready.isVisible().catch(() => false)) return steps;
    await page.waitForTimeout(120);
    if (await confirmDialog(page)) {
      steps.push({ question: "(dialog)", chips: [], picked: "confirmed", how: "dialog" });
      continue;
    }
    const inputs = page.locator(".ava2-fields input");
    if ((await inputs.count()) > 0) {
      const asked: string[] = [];
      for (const input of await inputs.all()) {
        const asks = (
          await input
            .locator("xpath=ancestor::label[1]")
            .innerText()
            .catch(() => "")
        ).toLowerCase();
        asked.push(asks.replace(/\s+/g, " ").trim());
        if (await input.inputValue()) continue;
        await input.fill(fillFor(asks));
      }
      const go = page.locator(".ava2-fields button.btn-primary:not([disabled])");
      if ((await go.count()) > 0) {
        await go.first().click();
        steps.push({ question: asked.join(" | "), chips: [], picked: "numbers", how: "fields" });
        continue;
      }
    }
    const area = page.locator(".ava2-talk__scroll .ds-replies").last();
    const buttons = area.locator("button:not([disabled])");
    const labels = (await buttons.allInnerTexts()).map((l) => l.trim());
    if (labels.length === 0) continue;
    if (labels.includes("Read my bid")) return steps;
    const choice = pickIdx(labels);
    const tail = (await page.locator(".ava2-talk__scroll").innerText())
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const question = tail.slice(-labels.length - 4, -labels.length).join(" / ");
    n++;
    if (opts.typeEvery && n % opts.typeEvery === 0) {
      const box = page.getByLabel(/Type to Ava/i).first();
      await box.fill(labels[choice]);
      await box.press("Enter");
      await page.waitForTimeout(250);
      steps.push({ question, chips: labels, picked: labels[choice], how: "typed" });
      continue;
    }
    await buttons.nth(choice).click();
    steps.push({ question, chips: labels, picked: labels[choice], how: "chip" });
  }
  return steps;
}

/** In her read of the bid, something may still hold the download: a paper to
 *  add, or a price to approve again. Settle each until the download button shows. */
export async function settleHolds(page: Page): Promise<void> {
  const button = page.getByRole("button", { name: /Download your (bid|reply)/ });
  for (let i = 0; i < 40; i++) {
    if (await button.isVisible().catch(() => false)) return;
    await page.waitForTimeout(150);
    if (await confirmDialog(page)) continue;
    const choose = page.getByRole("button", { name: "Choose a file" }).last();
    if (await choose.isVisible().catch(() => false)) {
      const chooser = page.waitForEvent("filechooser");
      await choose.click();
      await (
        await chooser
      ).setFiles({
        name: "paper.pdf",
        mimeType: "application/pdf",
        buffer: Buffer.from("%PDF-1.4\n% a sample paper\n"),
      });
      const yes = page.getByRole("button", { name: /Yes, that is right/ });
      await yes.waitFor({ timeout: 3000 }).catch(() => undefined);
      if (await yes.isVisible().catch(() => false)) await yes.click();
      continue;
    }
    const add = page.getByRole("button", { name: "Add it now" }).first();
    if (await add.isVisible().catch(() => false)) {
      await add.click();
      continue;
    }
    const replies = page
      .locator(".ava2-read__chat .ds-replies")
      .last()
      .locator("button:not([disabled])");
    const labels = (await replies.allInnerTexts()).map((l) => l.trim());
    const pick = labels.findIndex((l) => /^yes|^approve|^use/i.test(l) && !QUIET.test(l));
    if (pick >= 0) await replies.nth(pick).click();
  }
}

/** The files a person gets: name, size, the first bytes, and whether the inside holds up. */
export async function filesOf(
  w: Watch,
): Promise<{ name: string; size: number; head: string; inside: string | null }[]> {
  const out: { name: string; size: number; head: string; inside: string | null }[] = [];
  for (const d of w.downloads) {
    const p = await d.path();
    const buf = fs.readFileSync(p);
    const name = d.suggestedFilename();
    let inside: string | null = null;
    // A PDF ends with its end marker. A Word or Excel file is a zip that holds its main part.
    if (/\.pdf$/i.test(name) && !buf.subarray(-64).toString("latin1").includes("%%EOF"))
      inside = "a PDF with no end marker";
    if (/\.docx$/i.test(name) && !buf.includes("word/document.xml"))
      inside = "a Word file with no word/document.xml";
    if (/\.xlsx$/i.test(name) && !buf.includes("xl/workbook.xml"))
      inside = "an Excel file with no xl/workbook.xml";
    out.push({ name, size: buf.length, head: buf.subarray(0, 4).toString("latin1"), inside });
  }
  return out;
}

/** Keep every download in qa/report/downloads/<folder>/, so a person can open the files. */
export async function saveDownloads(w: Watch, folder: string): Promise<string[]> {
  const dir = path.join(process.cwd(), "qa", "report", "downloads", folder);
  fs.mkdirSync(dir, { recursive: true });
  const names: string[] = [];
  for (const d of w.downloads) {
    const to = path.join(dir, d.suggestedFilename());
    await d.saveAs(to);
    names.push(to);
  }
  return names;
}

/** A download is a real file: a PDF starts with "%PDF", Word and Excel with "PK". */
export function expectValidFiles(
  files: { name: string; size: number; head: string; inside: string | null }[],
): void {
  expect(files.length, "no download happened").toBeGreaterThan(0);
  for (const f of files) {
    expect(f.name, "download name").toMatch(/\.(pdf|docx|xlsx|txt|csv)$/i);
    expect(f.name, "download name").not.toMatch(/undefined|NaN|\[object|null/i);
    if (/\.pdf$/i.test(f.name)) expect(f.head, f.name).toBe("%PDF");
    else if (/\.(docx|xlsx)$/i.test(f.name)) expect(f.head.slice(0, 2), f.name).toBe("PK");
    expect(f.inside, f.name).toBeNull();
    expect(f.size, f.name).toBeGreaterThan(800);
  }
}

/** Horizontal overflow, and anything cut off at the right edge, in the main area. */
export async function layoutProblems(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const out: string[] = [];
    const vw = document.documentElement.clientWidth;
    if (document.documentElement.scrollWidth > vw + 1)
      out.push(`page scrolls sideways: ${document.documentElement.scrollWidth} > ${vw}`);
    const main = document.getElementById("demo-main");
    if (main && main.scrollWidth > main.clientWidth + 1)
      out.push(`main area scrolls sideways: ${main.scrollWidth} > ${main.clientWidth}`);
    const root = document.querySelector(".ava2, .ava-page");
    const seen = new Set<string>();
    if (root) {
      for (const el of Array.from(root.querySelectorAll<HTMLElement>("*"))) {
        const r = el.getBoundingClientRect();
        if (r.width <= 1 || r.height <= 1) continue;
        if (el.closest(".sr-only, .u-visually-hidden")) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility === "hidden" || cs.display === "none") continue;
        // Skip what a scroll area holds on purpose.
        let scrolls = false;
        for (let p: HTMLElement | null = el.parentElement; p && p !== root; p = p.parentElement) {
          const o = getComputedStyle(p);
          if (/(auto|scroll|hidden|clip)/.test(o.overflowX)) {
            const pr = p.getBoundingClientRect();
            if (r.right > pr.right + 1 || r.left < pr.left - 1) scrolls = true;
            break;
          }
        }
        if (scrolls) continue;
        if (r.right > vw + 1) {
          const key = `${el.tagName}.${el.className}`;
          if (!seen.has(key)) {
            seen.add(key);
            out.push(
              `cut off at the right edge: <${el.tagName.toLowerCase()} class="${String(el.className).slice(0, 60)}"> right=${Math.round(r.right)} > ${vw}`,
            );
          }
        }
        // Text that spills out of its own box.
        if (
          el.scrollWidth > el.clientWidth + 2 &&
          /(hidden|clip)/.test(cs.overflowX) &&
          cs.textOverflow !== "ellipsis" &&
          el.children.length === 0 &&
          (el.textContent ?? "").trim().length > 0
        ) {
          const key = `clip ${el.tagName}.${el.className}`;
          if (!seen.has(key)) {
            seen.add(key);
            out.push(
              `text clipped: <${el.tagName.toLowerCase()} class="${String(el.className).slice(0, 60)}"> "${(el.textContent ?? "").trim().slice(0, 50)}"`,
            );
          }
        }
      }
    }
    // A strip that scrolls sideways hides some of what it holds: the tabs of the
    // parts of the bid, the steps, a sheet.
    for (const el of Array.from(document.querySelectorAll<HTMLElement>("#demo-main *"))) {
      const r = el.getBoundingClientRect();
      if (r.width < 40 || r.height < 10) continue;
      const cs = getComputedStyle(el);
      if (!/(auto|scroll)/.test(cs.overflowX)) continue;
      if (el.scrollWidth > el.clientWidth + 2) {
        const key = `sideways ${el.tagName}.${el.className}`;
        if (!seen.has(key)) {
          seen.add(key);
          out.push(
            `scrolls sideways inside: <${el.tagName.toLowerCase()} class="${String(el.className).slice(0, 60)}"> ${el.scrollWidth} > ${el.clientWidth}`,
          );
        }
      }
    }
    return out;
  });
}

/** The talk box is on screen, inside the window, and takes typing. */
export async function inputReachable(
  page: Page,
  opts: { scroll?: boolean } = {},
): Promise<string | null> {
  const box = page.getByLabel(/Type to Ava|Ask Ava/i).first();
  if (!(await box.isVisible().catch(() => false))) return "the talk box is not visible";
  // Where the panes stack, the reader's chat sits under the document: it is reached by scrolling.
  if (opts.scroll) await box.scrollIntoViewIfNeeded();
  const r = await box.boundingBox();
  const vp = page.viewportSize();
  if (!r || !vp) return "no box";
  if (r.y + r.height > vp.height + 1 || r.y < 0)
    return `the talk box is outside the window (y=${Math.round(r.y)}, h=${Math.round(r.height)}, window ${vp.height})`;
  if (r.x + r.width > vp.width + 1) return "the talk box is cut off at the right";
  return null;
}
