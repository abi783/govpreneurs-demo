// What she downloads (components/Ava/downloads.ts), asserted: the review
// panel of 7 October 2026 found a certificates file that held no
// certificates, Word files sent as the bid, option years with no price, and
// approved answers printed as blanks. Run: bun test src/lib/ava

import { describe, expect, test } from "vitest";
import { CASES } from "./cases";
import { effectiveBid } from "./derive";
import { getAvaBid } from "./fixtures";
import { withGrantFor } from "./grant";
import type { BidState } from "./store";
import { modeFor, planDownload } from "../../components/Ava/downloads";
import { answerOnForm, formAsks } from "../../components/Ava/FormPaper";
import { keepPaper, dropPaper } from "../../components/Ava/paperFiles";
import { periodColumns } from "../../components/Ava/PriceParts";

const FAY = "FAYNC-2026-R-08";
const CUM = "CUMCO-2026-014";
const MAC = "SP4701-26-Q-0021";

function ctxOf(caseId: string) {
  const c = CASES.find((x) => x.id === caseId)!;
  const s0 = c.build();
  const g = withGrantFor(c.noticeId, getAvaBid(c.noticeId)!, s0, {});
  return {
    id: c.noticeId,
    fixture: g.fixture,
    bid: effectiveBid(g.fixture, g.s),
    s: g.s as BidState,
    grant: g.grant,
  };
}

const PNG = () =>
  new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], "photo.png", { type: "image/png" });

describe("her papers", () => {
  test("with none of her files in this session, no file claims to hold them", () => {
    const ctx = ctxOf("send-upload");
    const { files, papers } = planDownload(ctx, null, "pdf");
    expect(papers.length).toBeGreaterThan(0);
    expect(papers.every((p) => !p.inFile)).toBe(true);
    // A file made only of papers is never produced empty: no "attach" page.
    const paperOnly = files.filter((f) => f.part.pieces.every((pc) => pc.kind === "papers"));
    expect(paperOnly).toHaveLength(0);
  });

  test("her own files go inside the PDF she sends", () => {
    const ctx = ctxOf("send-upload");
    const asks = planDownload(ctx, null, "pdf").papers.map((p) => p.askId);
    for (const a of asks) keepPaper(ctx.id, a, PNG());
    const { papers } = planDownload(ctx, null, "pdf");
    expect(papers.filter((p) => !p.original).every((p) => p.inFile)).toBe(true);
    for (const a of asks) dropPaper(ctx.id, a);
  });

  test("a paper bid's bond is the signed original in the envelope, never a copy", () => {
    const ctx = ctxOf("send-paper");
    const bond = planDownload(ctx, null, "pdf").papers.find(
      (p) => p.askId === ctx.bid.bidSecurity?.bondAskId,
    );
    if (bond) {
      expect(bond.inFile).toBe(false);
      expect(bond.original).toBeDefined();
    }
    expect(ctx.id).toBe(CUM);
  });
});

describe("the files", () => {
  test("nothing open: every file she sends is a PDF, or the buyer's Excel", () => {
    const ctx = ctxOf("send-upload");
    expect(modeFor(0)).toBe("pdf");
    const kinds = planDownload(ctx, null, modeFor(0)).files.map((f) => f.kind);
    expect(kinds.every((k) => k === "pdf" || k === "xlsx")).toBe(true);
    expect(planDownload(ctx, null, modeFor(0)).files.every((f) => !/\.docx$/.test(f.name))).toBe(
      true,
    );
  });

  test("a part left open: Word, to finish", () => {
    expect(modeFor(1)).toBe("word");
  });
});

describe("prices", () => {
  test("every option period has its own price, above the base year", () => {
    const ctx = ctxOf("send-email");
    expect(ctx.id).toBe(MAC);
    const cols = periodColumns(ctx.bid, ctx.s);
    const per = ctx.bid.price?.periods;
    expect(per).toBeDefined();
    expect(cols).toHaveLength(per!.count + 1);
    const base = cols[0].prices[0]!;
    for (const c of cols.slice(1)) {
      expect(c.prices.every((p) => p !== null)).toBe(true);
      expect(c.prices[0]!).toBeGreaterThan(base);
    }
  });
});

describe("forms", () => {
  test("an answer she approved prints as its fact, never as a blank or as the question", () => {
    const ctx = ctxOf("send-upload");
    expect(ctx.id).toBe(FAY);
    const approved = ctx.bid.forms.flatMap((form) =>
      formAsks(ctx, form).filter((a) => a.answer.type === "approve" && ctx.s.answers[a.id]),
    );
    expect(approved.length).toBeGreaterThan(0);
    for (const ask of approved) {
      const printed = answerOnForm(ctx.bid, ctx.s, ask, "");
      expect(printed).not.toBeNull();
      expect(printed!).not.toMatch(/\?$/);
    }
    // The stored fact, never the question's sentence (round 2).
    const employees = approved.find((a) => a.id === "ask-employees");
    if (employees) expect(answerOnForm(ctx.bid, ctx.s, employees, "")).toBe("5");
  });
});
