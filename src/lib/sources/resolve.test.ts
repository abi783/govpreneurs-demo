// The invariant under test: EVERY pin resolves to a renderable sheet state
// with non-empty content. A tappable chip that leads nowhere is the failure
// mode this whole pattern exists to prevent — same rule the rail's suggested
// questions already enforce.

// vitest runs with `globals: true` (vitest.config.ts), same as the other lib suites.
import { getGrantAnalysis } from "../grant";
import { OPPORTUNITIES } from "../mock/opportunities";
import type { Pin } from "../grant/types";
import { chipVariant, resolveSource } from "./resolve";
import { resolveRecord } from "./records";

/** Deep-walk an analysis for anything shaped like a Pin. Deliberately structural
 *  rather than a hand-listed set of fields: when someone adds a new pin-carrying
 *  field to GrantAnalysis, this sweep covers it without being edited. */
function allPins(node: unknown, found: Pin[] = []): Pin[] {
  if (Array.isArray(node)) {
    for (const item of node) allPins(item, found);
    return found;
  }
  if (node && typeof node === "object") {
    const o = node as Record<string, unknown>;
    const prov = o.provenance as Record<string, unknown> | undefined;
    if (typeof o.label === "string" && prov && typeof prov.type === "string") {
      found.push(node as Pin);
      return found; // a Pin is a leaf — don't descend into its provenance
    }
    for (const v of Object.values(o)) allPins(v, found);
  }
  return found;
}

// Every opportunity that has a hand-authored Grant analysis, built through the
// real entry point so resolved compliance rows and central chips are included.
const analyses = OPPORTUNITIES.slice(0, 40).map((opp) => getGrantAnalysis(opp));

describe("resolveSource — the no-dead-chip invariant", () => {
  test("the fixtures actually carry pins (guards against an empty sweep)", () => {
    const total = analyses.flatMap((a) => allPins(a)).length;
    expect(total).toBeGreaterThan(10);
  });

  test("every pin resolves to a known kind", () => {
    for (const pin of analyses.flatMap((a) => allPins(a))) {
      const view = resolveSource(pin);
      expect(["doc", "record", "conversation", "computed", "public", "tally", "unavailable"]).toContain(
        view.kind,
      );
    }
  });

  test("no resolved source has an empty body", () => {
    for (const pin of analyses.flatMap((a) => allPins(a))) {
      const view = resolveSource(pin);
      if (view.kind === "doc") expect(view.span.trim().length).toBeGreaterThan(0);
      if (view.kind === "computed") expect(view.note.trim().length).toBeGreaterThan(0);
      if (view.kind === "record") expect(view.record.fields.length).toBeGreaterThan(0);
      if (view.kind === "conversation") expect(view.conversation.turns.length).toBeGreaterThan(0);
      if (view.kind === "unavailable") {
        expect(view.headline.trim().length).toBeGreaterThan(0);
        expect(view.reason.trim().length).toBeGreaterThan(0);
      }
    }
  });

  test("every pin gets a locator and a provenance line", () => {
    for (const pin of analyses.flatMap((a) => allPins(a))) {
      const view = resolveSource(pin);
      expect(view.locator.trim().length).toBeGreaterThan(0);
      expect(view.provLine.trim().length).toBeGreaterThan(0);
    }
  });

  test("the chip variant always matches the body the sheet will render", () => {
    for (const pin of analyses.flatMap((a) => allPins(a))) {
      const view = resolveSource(pin);
      const variant = chipVariant(pin);
      if (view.kind === "record") expect(variant).toBe("record");
      else if (view.kind === "unavailable") expect(variant).toBe("missing");
      else if (view.kind === "conversation") expect(variant).toBe("said");
      // Both public shapes share one chip — see chipVariant.
      else if (view.kind === "public" || view.kind === "tally") expect(variant).toBe("public");
      else expect(variant).toBe("doc");
    }
  });
});

describe("resolveSource — per-kind behaviour", () => {
  test("an unavailable source states whether the analysis leaned on it", () => {
    const view = resolveSource({
      label: "Attachment 9",
      provenance: {
        type: "solicitation",
        ref: "attachment-9",
        unavailable: { reason: "Scanned, no extractable text.", usedInAnalysis: false },
      },
    });
    expect(view.kind).toBe("unavailable");
    if (view.kind === "unavailable") expect(view.usedInAnalysis).toBe(false);
  });

  test("a pin with surrounding context is not flagged context-missing", () => {
    const view = resolveSource({
      label: "§L.4",
      provenance: {
        type: "solicitation",
        ref: "§L.4",
        excerpt: { before: "L.3 …", span: "L.4 …", after: "L.4.3 …" },
      },
    });
    expect(view.kind).toBe("doc");
    if (view.kind === "doc") {
      expect(view.contextMissing).toBe(false);
      expect(view.before).toBeTruthy();
      expect(view.after).toBeTruthy();
    }
  });

  test("a bare quote still renders, and admits the context is absent", () => {
    const view = resolveSource({
      label: "§B.2",
      provenance: { type: "solicitation", ref: "§B.2", quote: "Scope of work." },
    });
    expect(view.kind).toBe("doc");
    if (view.kind === "doc") expect(view.contextMissing).toBe(true);
  });

  test("a pin with neither quote nor excerpt becomes an explained gap, not a blank", () => {
    const view = resolveSource({
      label: "§Z.1",
      provenance: { type: "solicitation", ref: "§Z.1" },
    });
    expect(view.kind).toBe("unavailable");
  });

  test("only solicitation refs that map to a section offer the reveal escape hatch", () => {
    const mapped = resolveSource({
      label: "§L.4",
      provenance: { type: "solicitation", ref: "§L.4", quote: "x" },
    });
    const unmapped = resolveSource({
      label: "FPDS W912",
      provenance: { type: "fpds", ref: "W912PM-19-C-0043", quote: "x" },
    });
    if (mapped.kind === "doc") expect(mapped.revealRef).toBe("§L.4");
    if (unmapped.kind === "doc") expect(unmapped.revealRef).toBeNull();
  });

  test("a computed pin shows the working rather than claiming a quote", () => {
    const view = resolveSource({
      label: "Working days",
      provenance: { type: "computed", ref: "deadline.workingDays" },
    });
    expect(view.kind).toBe("computed");
  });
});

describe("resolveSource — conversations (the third geometry)", () => {
  const chat = {
    label: "You told Hunter",
    provenance: {
      type: "chat" as const,
      ref: "chat.bonding",
      conversation: {
        channel: "hunter" as const,
        occurredAt: "2026-04-18T15:42:00Z",
        citedTurnId: "c2",
        attested: true,
        turns: [
          {
            id: "c1",
            speaker: "Hunter",
            role: "agent" as const,
            text: "Do you have a surety line?",
          },
          { id: "c2", speaker: "You", role: "member" as const, text: "About $600K, county level." },
          { id: "c3", speaker: "Hunter", role: "agent" as const, text: "Noted." },
        ],
        learning: "Proven capacity is $600K.",
        learningBy: "Hunter",
      },
    },
  };

  test("a chat pin resolves to a conversation body", () => {
    const view = resolveSource(chat);
    expect(view.kind).toBe("conversation");
  });

  test("the member being quoted to themselves is flagged as self", () => {
    const view = resolveSource(chat);
    if (view.kind === "conversation") {
      expect(view.isSelf).toBe(true);
      expect(view.citedSpeaker).toBe("You");
      expect(view.sourceLabel).toBe("Your own words");
    }
  });

  // R7 — the rule of completeness. A cited utterance alone is not a source.
  test("surrounding turns survive resolution — a lone utterance is not a citation", () => {
    const view = resolveSource(chat);
    if (view.kind === "conversation") {
      const idx = view.conversation.turns.findIndex((t) => t.id === view.conversation.citedTurnId);
      expect(idx).toBeGreaterThan(0); // something came before
      expect(view.conversation.turns.length).toBeGreaterThan(idx + 1); // and after
    }
  });

  test("an attestation is distinguished from a passing remark", () => {
    const attested = resolveSource(chat);
    const remark = resolveSource({
      ...chat,
      provenance: {
        ...chat.provenance,
        conversation: { ...chat.provenance.conversation, attested: false },
      },
    });
    if (attested.kind === "conversation") expect(attested.conversation.attested).toBe(true);
    if (remark.kind === "conversation") expect(remark.conversation.attested).toBeFalsy();
    expect(attested.provLine).not.toBe(remark.provLine);
  });

  test("a mentor transcript names the speaker rather than claiming they are you", () => {
    const view = resolveSource({
      label: "Diana's call",
      provenance: {
        type: "transcript",
        ref: "call.diana",
        conversation: {
          channel: "mentor-call",
          title: "Positioning call with Diana",
          occurredAt: "2026-04-22T09:00:00Z",
          citedTurnId: "t2",
          playAt: "14:32",
          turns: [
            { id: "t1", speaker: "You", role: "member", at: "14:24", text: "Crew of three." },
            {
              id: "t2",
              speaker: "Diana Potts",
              role: "mentor",
              at: "14:32",
              text: "Go in as a sub.",
            },
            {
              id: "t3",
              speaker: "Diana Potts",
              role: "mentor",
              at: "14:58",
              text: "And reposition.",
            },
          ],
        },
      },
    });
    expect(view.kind).toBe("conversation");
    if (view.kind === "conversation") {
      expect(view.isSelf).toBe(false);
      expect(view.sourceLabel).toContain("Diana Potts");
      // The locator must answer who/when/where — deposition-citation practice.
      expect(view.locator).toContain("Positioning call with Diana");
      expect(view.locator).toContain("14:32");
      expect(view.locator).toMatch(/2026/);
    }
  });

  // Regression: the footer credited the MEMBER for a mentor's words — it read
  // "You confirmed this" under a Diana quote. Attribution must follow the speaker.
  test("the provenance line credits whoever actually said it", () => {
    const mine = resolveSource(chat);
    const theirs = resolveSource({
      label: "Diana's call",
      provenance: {
        type: "transcript",
        ref: "call.diana",
        conversation: {
          channel: "mentor-call",
          occurredAt: "2026-04-22T09:00:00Z",
          citedTurnId: "t1",
          attested: true,
          turns: [
            { id: "t0", speaker: "You", role: "member", text: "Crew of three." },
            { id: "t1", speaker: "Diana Potts", role: "mentor", text: "Go in as a sub." },
            { id: "t2", speaker: "Diana Potts", role: "mentor", text: "And reposition." },
          ],
        },
      },
    });
    expect(mine.provLine).toContain("You confirmed this");
    expect(theirs.provLine).toContain("Diana Potts");
    expect(theirs.provLine).not.toContain("You confirmed");
  });

  test("a conversation pin with no turns becomes an explained gap, not a blank", () => {
    const view = resolveSource({
      label: "You told Hunter",
      provenance: { type: "chat", ref: "chat.missing" },
    });
    expect(view.kind).toBe("unavailable");
  });

  // R8 — verbatim and derived must stay separable at the data layer, or the UI
  // cannot keep them apart.
  test("the derived learning is carried separately from the verbatim turns", () => {
    const view = resolveSource(chat);
    if (view.kind === "conversation") {
      expect(view.conversation.learning).toBeTruthy();
      const verbatim = view.conversation.turns.map((t) => t.text).join(" ");
      expect(verbatim).not.toContain(view.conversation.learning!);
    }
  });
});

describe("resolveRecord — descriptors, not bespoke viewers", () => {
  test("a profile ref resolves to a record with fields and a home page", () => {
    const rec = resolveRecord("profile.bidderProfile.insuranceBonding");
    expect(rec).not.toBeNull();
    expect(rec!.fields.length).toBeGreaterThan(0);
    expect(rec!.href).toBeTruthy();
  });

  test("the pinned keys exist among the record's own fields", () => {
    for (const ref of [
      "roadmap",
      "profile.bidderProfile.insuranceBonding",
      "profile.identity.samStatus",
      "profile.identity.UEI",
      "profile.pastPerformance",
    ]) {
      const rec = resolveRecord(ref);
      expect(rec).not.toBeNull();
      const keys = new Set(rec!.fields.map((f) => f.key));
      for (const k of rec!.pinned) expect(keys.has(k)).toBe(true);
    }
  });

  test("a non-record ref returns null so the caller falls back", () => {
    expect(resolveRecord("§L.4")).toBeNull();
  });

  // Regression: `text()` was being handed paths ending in ".value", so it looked
  // for `.value.value` and returned null — every field rendered "Not on file",
  // which reads as missing member data rather than a bug. Assert real values.
  test("record fields carry the member's actual data, not empty placeholders", () => {
    const sam = resolveRecord("sam")!;
    const byKey = new Map(sam.fields.map((f) => [f.key, f.value]));
    expect(byKey.get("uei")).toBe("LW1SL1HLED3");
    expect(byKey.get("cage")).toBe("16WG0");
    expect(byKey.get("samStatus")).toContain("Active");
    // …and the title resolves the company name rather than falling back.
    expect(sam.title).toContain("Williams Construction");
    expect(sam.title).not.toContain("your company");
  });

  test("a verified record reports a verified status", () => {
    expect(resolveRecord("sam")!.status.tone).toBe("ok");
  });
});

/* ── The fourth geometry · public government records ────────────────────────
   Task #30 / public-records-PRD.md. Two shapes (entry, tally), attributed to
   the government system of record and never to the aggregator we buy through. */
describe("resolveSource — public government records", () => {
  const award = {
    awardId: "W912PM-19-C-0043",
    title: null,
    description: "Grounds maintenance, Fort Bragg cantonment area",
    awardeeName: "Sterling Roofing Systems",
    agencyName: "Department of Defense · Army",
    naicsCode: "238160",
    naicsDescription: "Roofing Contractors",
    value: 4_180_000,
    offers: 4,
    fiscalYear: 2024,
    actionDate: "2024-03-11",
    setAside: "Total Small Business",
    extentCompeted: "Full And Open Competition",
    popState: "NC",
    solicitationId: null,
    sourceUrl: null,
    asOf: "2026-07-20T11:42:23.602Z",
  };
  const entryPin = (ref = "award:W912PM-19-C-0043#winner") =>
    ({ label: "Sterling — prior award", provenance: { type: "public", ref, award } }) as never;

  const tally = {
    kind: "comparable-awards" as const,
    figure: 1_200_000,
    low: 790_000,
    high: 3_590_000,
    countedOver: 14,
    matchedOn: "NAICS 238160 · Roofing Contractors",
    yearsCovered: "FY2019–FY2024",
    sample: [award, { ...award, awardId: "X2", awardeeName: "Second Firm", value: 900_000 }],
    asOf: "2026-07-20T11:42:23.602Z",
  };
  const tallyPin = (over = {}) =>
    ({
      label: "historical band",
      provenance: { type: "public", ref: "tally:comparable-awards", tally: { ...tally, ...over } },
    }) as never;

  test("an award resolves to a register ENTRY, attributed to the government system", () => {
    const view = resolveSource(entryPin());
    expect(view.kind).toBe("public");
    if (view.kind !== "public") return;
    expect(view.entry.origin).toBe("Federal award record");
    expect(view.sourceLabel).toBe("Federal award record");
    expect(view.entry.title).toBe("Contract W912PM-19-C-0043");
    // D4 — six fields, fixed. Not PSC, not place-of-performance ZIP.
    expect(view.entry.fields).toHaveLength(6);
    expect(view.entry.fields.map((f) => f.key)).toEqual([
      "winner",
      "agency",
      "value",
      "awardedAt",
      "options",
      "workType",
    ]);
  });

  test("the highlight rides in the ref, and only it varies per claim", () => {
    const winner = resolveSource(entryPin("award:W912PM-19-C-0043#winner"));
    const value = resolveSource(entryPin("award:W912PM-19-C-0043#value"));
    if (winner.kind === "public") expect(winner.entry.pinned).toEqual(["winner"]);
    if (value.kind === "public") expect(value.entry.pinned).toEqual(["value"]);
    // The field SET is identical either way — that is what stops cherry-picking.
    if (winner.kind === "public" && value.kind === "public") {
      expect(winner.entry.fields.map((f) => f.key)).toEqual(value.entry.fields.map((f) => f.key));
    }
  });

  test("a counted figure resolves to a TALLY carrying its basis, not one row", () => {
    const view = resolveSource(tallyPin());
    expect(view.kind).toBe("tally");
    if (view.kind !== "tally") return;
    expect(view.tally.figure).toBe("$1.2M");
    const basis = Object.fromEntries(view.tally.basis.map((b) => [b.label, b.value]));
    // Without the basis the figure is an assertion; with it, a finding.
    expect(basis["Awards counted"]).toBe("14");
    expect(basis["Matched on"]).toBe("NAICS 238160 · Roofing Contractors");
    expect(basis["Award years covered"]).toBe("FY2019–FY2024");
    expect(basis["Range"]).toBe("$790K – $3.6M");
    // A sample must never read as the population.
    expect(view.tally.sampleOf).toBe(14);
    expect(view.tally.sample.length).toBeLessThan(view.tally.sampleOf);
  });

  // D1, the rule the PRD says to enforce with a test, because a regression here
  // is a trust bug rather than a copy bug.
  test("no source ever names the data aggregator", () => {
    for (const pin of [entryPin(), tallyPin(), tallyPin({ kind: "field-size", figure: 4 })]) {
      const blob = JSON.stringify(resolveSource(pin));
      expect(blob).not.toMatch(/highergov/i);
      expect(blob).not.toMatch(/\bour data\b/i);
    }
  });

  // D2 — every public figure is COUNTED, never predicted. Bid information is not
  // releasable before award, so no tally may speak in the future tense.
  test("no public figure claims to know who will bid", () => {
    for (const kind of ["comparable-awards", "field-size"] as const) {
      const view = resolveSource(tallyPin({ kind, figure: kind === "field-size" ? 4 : 1_200_000 }));
      if (view.kind !== "tally") throw new Error("expected a tally");
      const words = `${view.tally.figureLabel} ${view.tally.basis.map((b) => b.label).join(" ")}`;
      expect(words).not.toMatch(/likely|will bid|expected to bid|predict|forecast/i);
    }
    // The field-size figure is explicitly retrospective.
    const fs = resolveSource(tallyPin({ kind: "field-size", figure: 4 }));
    if (fs.kind === "tally") expect(fs.tally.figureLabel).toMatch(/received/i);
  });

  // D5 — freshness is on the face of it, and material lag is named.
  test("freshness is stated, and defense lag is named rather than left silent", () => {
    const view = resolveSource(entryPin());
    if (view.kind !== "public") return;
    expect(view.entry.asOf).toMatch(/checked/);
    expect(view.provLine).toContain("Federal award record");
    // The fixture's agency is Army, so the ~90-day lag must be surfaced.
    expect(view.entry.lagNote).toMatch(/90 days behind/);
    const civilian = resolveSource({
      label: "x",
      provenance: {
        type: "public",
        ref: "award:A1",
        award: { ...award, agencyName: "Department of Agriculture" },
      },
    } as never);
    if (civilian.kind === "public") expect(civilian.entry.lagNote).toBeUndefined();
  });

  test("a public ref is never rendered raw — it is a key, not a citation", () => {
    const view = resolveSource({
      label: "x",
      provenance: { type: "public", ref: "award:W912PM-19-C-0043#winner,options" },
    } as never);
    // No descriptor (no payload) ⇒ explained gap, and the machine ref is cleaned.
    expect(view.kind).toBe("unavailable");
    if (view.kind === "unavailable") {
      expect(view.reason).toContain("W912PM-19-C-0043");
      expect(view.reason).not.toContain("award:");
      expect(view.reason).not.toContain("#winner");
    }
  });

  test("the legacy fpds spelling still resolves", () => {
    const view = resolveSource({
      label: "Sterling — prior award",
      provenance: { type: "fpds", ref: "award:W912PM-19-C-0043#winner", award },
    } as never);
    expect(view.kind).toBe("public");
  });

  test("a malformed payload degrades instead of throwing inside the canvas", () => {
    for (const bad of [null, "an award", 42, [], { figure: "not a number" }]) {
      const entry = resolveSource({
        label: "x",
        provenance: { type: "public", ref: "award:X1", award: bad },
      } as never);
      const tal = resolveSource({
        label: "x",
        provenance: { type: "public", ref: "tally:comparable-awards", tally: bad },
      } as never);
      for (const v of [entry, tal]) {
        expect(v.kind).toBeTruthy();
        expect(JSON.stringify(v)).not.toMatch(/highergov/i);
      }
    }
  });

  test("both public shapes share one chip, distinct from doc and record", () => {
    expect(chipVariant(entryPin())).toBe("public");
    expect(chipVariant(tallyPin())).toBe("public");
  });

  // The regression that started this: every live award ref was a vendor deep
  // link, and the locator printed it verbatim as the sheet's coordinate.
  test("a vendor URL in a ref is never printed as the locator", () => {
    const view = resolveSource({
      label: "prior award",
      provenance: { type: "fpds", ref: "https://www.highergov.com/contract/03310323D0024/" },
    } as never);
    expect(view.locator).not.toMatch(/highergov/i);
    expect(view.locator).not.toMatch(/https?:\/\//);
  });
});

/* ── The remaining registers: entity, buyer, market-winners ─────────────────
   PR #30 §6 objects 2, 4 and 7. Each is a descriptor over a payload the server
   supplies; the shell, the attribution rule and the sanitiser are shared. */
describe("resolveSource — entity (a registered contractor)", () => {
  const ENTITY = {
    awardeeKey: 306086091,
    name: "Standing Bear Farms & Forests",
    legalName: "STANDING BEAR FARMS & FORESTS, LLC",
    uei: "WK5HTFNWQ2R8",
    cageCode: "9EZF2",
    basedIn: "Baton Rouge, LA",
    primaryNaics: "111110",
    primaryNaicsDescription: null,
    busTypes: [
      { label: "Self-Certified Small Disadvantaged Business", certified: false },
      { label: "8(a) Program Participant", certified: true },
    ],
    registrationExpires: "2027-04-24T00:00:00.000Z",
    yearFounded: "2018",
    awardsOnRecord: 4,
    totalAwarded: 3_760_103,
    asOf: "2026-07-20T09:07:01.213Z",
  };
  const pin = (over = {}, ref = "entity:306086091#name") =>
    ({ label: "Standing Bear", provenance: { type: "public", ref, entity: { ...ENTITY, ...over } } }) as never;

  test("resolves to the firm's OWN registration, not the member's", () => {
    const v = resolveSource(pin());
    expect(v.kind).toBe("public");
    if (v.kind !== "public") return;
    expect(v.entry.origin).toBe("SAM.gov registration");
    expect(v.entry.title).toBe("Standing Bear Farms & Forests");
    expect(v.entry.fields).toHaveLength(6);
    const by = Object.fromEntries(v.entry.fields.map((f) => [f.key, f.value]));
    expect(by.basedIn).toBe("Baton Rouge, LA");
    expect(by.totalAwarded).toBe("$3.8M");
    expect(by.awards).toBe("4");
  });

  // The field where getting it wrong costs a member an award.
  test("a self-certified status is never printed as a certification", () => {
    const v = resolveSource(pin());
    if (v.kind !== "public") return;
    const busTypes = v.entry.fields.find((f) => f.key === "busTypes")?.value ?? "";
    expect(busTypes).toContain("Self-Certified Small Disadvantaged Business (self-certified)");
    // A genuinely certified row carries no qualifier.
    expect(busTypes).toContain("8(a) Program Participant");
    expect(busTypes).not.toContain("8(a) Program Participant (self-certified)");
  });

  test("a firm not on the register is an explained gap, not the member's record", () => {
    const v = resolveSource({
      label: "Some Firm",
      provenance: { type: "public", ref: "entity:Some Firm" },
    } as never);
    expect(v.kind).toBe("unavailable");
    // The old bug: this used to resolve to the MEMBER's own SAM registration.
    expect(JSON.stringify(v)).not.toMatch(/Your record|roadmap/i);
  });

  test("zero awards on record is stated, not hidden", () => {
    const v = resolveSource(pin({ awardsOnRecord: 0, totalAwarded: null }));
    if (v.kind !== "public") return;
    const by = Object.fromEntries(v.entry.fields.map((f) => [f.key, f.value]));
    expect(by.awards).toBe("0");
    expect(by.totalAwarded).toBeNull();
  });
});

describe("resolveSource — buyer (a contracting office)", () => {
  const BUYER = {
    agencyKey: 1464,
    name: "Justice Management Division",
    abbreviation: "JMD",
    agencyType: "Federal",
    isDefense: false,
    parents: ["Department of Justice", "Offices, Boards and Divisions"],
    buys: [
      { code: "541519", description: "Other Computer Related Services", awards: 100 },
      { code: "541611", description: "Consulting Services", awards: 53 },
    ],
    awardsExamined: 300,
    setAsideAwards: 54,
    officers: 21,
    asOf: "2026-07-20T11:17:52.733Z",
  };
  const pin = (over = {}) =>
    ({
      label: "Justice Management Division",
      provenance: { type: "public", ref: "buyer:1464#office", buyer: { ...BUYER, ...over } },
    }) as never;

  test("resolves to the office's own award history", () => {
    const v = resolveSource(pin());
    expect(v.kind).toBe("public");
    if (v.kind !== "public") return;
    expect(v.entry.origin).toBe("Contracting office award history");
    const by = Object.fromEntries(v.entry.fields.map((f) => [f.key, f.value]));
    expect(by.office).toBe("Justice Management Division (JMD)");
    expect(by.partOf).toBe("Department of Justice › Offices, Boards and Divisions");
    expect(by.buys).toContain("541519 Other Computer Related Services (100)");
    expect(by.officers).toBe("21");
  });

  // The quantity we have is not the quantity that phrase names.
  test("the set-aside count is not dressed up as a small-business share", () => {
    const v = resolveSource(pin());
    if (v.kind !== "public") return;
    const row = v.entry.fields.find((f) => f.key === "setAside");
    expect(row?.label).toBe("Set-aside awards");
    expect(row?.label).not.toMatch(/small business/i);
    expect(row?.value).toBe("54 of 300 examined");
    // The office's awards are read in no set order, so "the last" would claim recency.
    expect(row?.value).not.toMatch(/\blast\b/);
    // Never a percentage — that would imply a denominator we did not measure.
    expect(row?.value).not.toMatch(/%/);
  });

  test("a defense office carries the lag note; a civilian one does not", () => {
    const civ = resolveSource(pin());
    if (civ.kind === "public") expect(civ.entry.lagNote).toBeUndefined();
    const def = resolveSource(pin({ isDefense: true }));
    if (def.kind === "public") expect(def.entry.lagNote).toMatch(/90 days behind/);
  });
});

describe("resolveSource — market winners (the counted answer to 'who bids?')", () => {
  const T = {
    kind: "market-winners" as const,
    figure: 109,
    low: null,
    high: null,
    countedOver: 109,
    matchedOn: "NAICS 238160 · Roofing Contractors",
    yearsCovered: "FY2006–FY2026",
    sample: [],
    firms: [
      { name: "Global Construct Group", awards: 9, totalValue: 3_760_103 },
      { name: "DJB Contracting", awards: 1, totalValue: 276_604 },
    ],
    asOf: "2026-07-20T11:51:24.006Z",
  };
  const pin = (over = {}) =>
    ({
      label: "109 firms have won work like this",
      provenance: { type: "public", ref: "tally:market-winners", tally: { ...T, ...over } },
    }) as never;

  test("counts FIRMS, and its sample rows are firms rather than awards", () => {
    const v = resolveSource(pin());
    expect(v.kind).toBe("tally");
    if (v.kind !== "tally") return;
    expect(v.tally.figure).toBe("109");
    expect(v.tally.unit).toBe("firms");
    expect(v.tally.sample[0].label).toBe("Global Construct Group");
    expect(v.tally.sample[0].value).toContain("9 awards");
    // Singular, on the row where it matters.
    expect(v.tally.sample[1].value).toContain("1 award");
    expect(v.tally.sample[1].value).not.toContain("1 awards");
    const basis = Object.fromEntries(v.tally.basis.map((b) => [b.label, b.value]));
    expect(basis["Firms counted"]).toBe("109");
  });

  // D2 — the reason this register exists instead of a bidder estimate.
  test("it is retrospective and never claims to know who will bid", () => {
    const v = resolveSource(pin());
    if (v.kind !== "tally") return;
    expect(v.tally.figureLabel).toMatch(/have won/i);
    const words = `${v.tally.figureLabel} ${v.tally.basis.map((b) => b.label).join(" ")}`;
    expect(words).not.toMatch(/likely|will bid|expected to bid|predict|forecast|bidding/i);
  });

  test("no vendor string survives any of the three new registers", () => {
    const V = "https://www.highergov.com/awardee/x/";
    const probes = [
      resolveSource({
        label: "x",
        provenance: { type: "public", ref: "entity:1", entity: { awardeeKey: 1, name: V, legalName: V, basedIn: V, busTypes: [{ label: V, certified: true }], asOf: null } },
      } as never),
      resolveSource({
        label: "x",
        provenance: { type: "public", ref: "buyer:1", buyer: { agencyKey: 1, name: V, abbreviation: null, agencyType: V, isDefense: false, parents: [V], buys: [{ code: "1", description: V, awards: 1 }], awardsExamined: 1, setAsideAwards: 0, officers: 0, asOf: null } },
      } as never),
      resolveSource(pin({ firms: [{ name: V, awards: 1, totalValue: null }] })),
    ];
    for (const v of probes) expect(JSON.stringify(v)).not.toMatch(/highergov/i);
  });

  test("malformed payloads on the new registers degrade instead of throwing", () => {
    for (const bad of [null, "x", 42, [], { name: {} }]) {
      for (const ref of ["entity:1", "buyer:1", "tally:market-winners"]) {
        const key = ref.startsWith("entity") ? "entity" : ref.startsWith("buyer") ? "buyer" : "tally";
        expect(() =>
          resolveSource({ label: "x", provenance: { type: "public", ref, [key]: bad } } as never),
        ).not.toThrow();
      }
    }
  });

  test("all three register kinds share the public chip", () => {
    expect(chipVariant(pin())).toBe("public");
  });
});

describe("resolveSource — subaward (what a prime pays its subs)", () => {
  const SA = {
    primeKey: 10000137,
    primeName: "Thundercat Technology",
    subCount: 25,
    awardCount: 81,
    totalSubcontracted: 30_816_878,
    mostRecent: "2024-01-01T00:00:00.000Z",
    subs: [
      { name: "Carahsoft Technology", awards: 23, total: 19_370_091 },
      { name: "Red River Technology", awards: 5, total: 610_566 },
    ],
    asOf: "2026-07-20T09:07:44.681Z",
  };
  const pin = (over = {}) =>
    ({
      label: "Thundercat — subcontracting record",
      provenance: {
        type: "public",
        ref: "subaward:10000137#subCount",
        subaward: { ...SA, ...over },
      },
    }) as never;

  test("resolves to the subcontract reports, a different system from SAM", () => {
    const v = resolveSource(pin());
    expect(v.kind).toBe("public");
    if (v.kind !== "public") return;
    expect(v.entry.origin).toBe("Federal subcontract reports");
    expect(v.entry.title).toBe("Subcontracting — Thundercat Technology");
    const by = Object.fromEntries(v.entry.fields.map((f) => [f.key, f.value]));
    expect(by.subCount).toBe("25");
    expect(by.awardCount).toBe("81");
    expect(by.total).toBe("$30.8M");
    expect(by.subs).toBe("Carahsoft Technology (23) · Red River Technology (5)");
    expect(v.entry.pinned).toEqual(["subCount"]);
  });

  // These rows carry no NAICS, so the count spans all their work. Saying "in
  // your market" would name a filter we never applied.
  test("the scope is stated rather than implied to be the member's market", () => {
    const v = resolveSource(pin());
    if (v.kind !== "public") return;
    const scope = v.entry.fields.find((f) => f.key === "scope")?.value ?? "";
    expect(scope).toMatch(/not filtered to your market/i);
    expect(JSON.stringify(v)).not.toMatch(/in your market/i);
  });

  test("no vendor string survives, and a malformed payload degrades", () => {
    const V = "https://www.highergov.com/awardee/x/";
    expect(
      JSON.stringify(resolveSource(pin({ primeName: V, subs: [{ name: V, awards: 1, total: 1 }] }))),
    ).not.toMatch(/highergov/i);
    for (const bad of [null, "x", 42, [], { subs: "nope" }]) {
      expect(() =>
        resolveSource({
          label: "x",
          provenance: { type: "public", ref: "subaward:1", subaward: bad },
        } as never),
      ).not.toThrow();
    }
  });
});

describe("resolveSource — vehicle and market sub-use (the last two registers)", () => {
  // Values from a real live join: opportunity 12363N22Q4055 → vehicle 7393.
  const VEHICLE = {
    vehicleKey: 7393,
    name: "Pacific Southwest (PSW) Stewardship BPA (Region 5)",
    vehicleType: "BPA",
    whoCanUse: "Multiple Agencies",
    sharedCeiling: 50_000_000,
    lastDateToOrder: "2032-10-03T00:00:00.000Z",
    setAside: null,
    naicsCode: "115310",
    sponsorAgency: "Forest Service",
    associatedSolicitation: "12363N22Q4055",
    asOf: "2026-08-03T18:54:50.592Z",
  };
  const vPin = (over = {}) =>
    ({
      label: "Pacific Southwest Stewardship BPA",
      provenance: {
        type: "public",
        ref: "vehicle:7393#whoCanUse",
        vehicle: { ...VEHICLE, ...over },
      },
    }) as never;

  test("a vehicle resolves with the fields that decide whether you can bid", () => {
    const v = resolveSource(vPin());
    expect(v.kind).toBe("public");
    if (v.kind !== "public") return;
    expect(v.entry.origin).toBe("Contract vehicle record");
    const by = Object.fromEntries(v.entry.fields.map((f) => [f.key, f.value]));
    expect(by.type).toBe("BPA");
    expect(by.whoCanUse).toBe("Multiple Agencies");
    expect(by.ceiling).toBe("$50M");
    expect(by.sponsor).toBe("Forest Service");
    // The claim rests on who can use it, so that is the highlighted row.
    expect(v.entry.pinned).toEqual(["whoCanUse"]);
  });

  // The register uses 0 as "not stated"; printing "$0" would be a claim nobody
  // made, and on a ceiling that reads as "this vehicle is worth nothing".
  test("a zero ceiling reads as absent, not as $0", () => {
    const v = resolveSource(vPin({ sharedCeiling: 0 }));
    if (v.kind !== "public") return;
    expect(v.entry.fields.find((f) => f.key === "ceiling")?.value).toBeNull();
    expect(JSON.stringify(v)).not.toMatch(/\$0\b/);
  });

  const SU = {
    kind: "sub-use" as const,
    figure: 1709,
    low: null,
    high: null,
    countedOver: 1709,
    matchedOn: "NAICS 236220 · Commercial and Institutional Building Construction",
    yearsCovered: "FY2017–FY2026",
    sample: [],
    subs: [
      { name: "Coffman Engineers", awards: 10, total: 2_632_959 },
      { name: "Calvin Electric", awards: 1, total: 722_348 },
    ],
    asOf: "2026-07-21T17:48:00.231Z",
  };
  const sPin = (over = {}) =>
    ({
      label: "1709 firms subcontracted on work like this",
      provenance: { type: "public", ref: "tally:sub-use", tally: { ...SU, ...over } },
    }) as never;

  test("market sub-use counts firms, scoped by the NAICS we actually filtered on", () => {
    const v = resolveSource(sPin());
    expect(v.kind).toBe("tally");
    if (v.kind !== "tally") return;
    expect(v.tally.origin).toBe("Federal subcontract reports");
    expect(v.tally.figure).toBe("1709");
    expect(v.tally.unit).toBe("firms");
    const basis = Object.fromEntries(v.tally.basis.map((b) => [b.label, b.value]));
    expect(basis["Firms counted"]).toBe("1709");
    expect(basis["Matched on"]).toContain("NAICS 236220");
    expect(basis["Award years covered"]).toBe("FY2017–FY2026");
    expect(v.tally.sample[0].value).toContain("10 subawards");
    // Singular where it matters.
    expect(v.tally.sample[1].value).toContain("1 subaward");
    expect(v.tally.sample[1].value).not.toContain("1 subawards");
  });

  test("neither new register leaks the vendor or throws on a malformed payload", () => {
    const V = "https://www.highergov.com/vehicle/x/";
    expect(JSON.stringify(resolveSource(vPin({ name: V, sponsorAgency: V })))).not.toMatch(
      /highergov/i,
    );
    expect(
      JSON.stringify(resolveSource(sPin({ subs: [{ name: V, awards: 1, total: 1 }] }))),
    ).not.toMatch(/highergov/i);
    for (const bad of [null, "x", 42, [], { name: {} }]) {
      expect(() =>
        resolveSource({
          label: "x",
          provenance: { type: "public", ref: "vehicle:1", vehicle: bad },
        } as never),
      ).not.toThrow();
      expect(() =>
        resolveSource({
          label: "x",
          provenance: { type: "public", ref: "tally:sub-use", tally: bad },
        } as never),
      ).not.toThrow();
    }
  });

  test("both are counted records, never predictions", () => {
    const v = resolveSource(sPin());
    if (v.kind !== "tally") return;
    expect(v.tally.figureLabel).toMatch(/have been subcontracted/i);
    expect(v.tally.figureLabel).not.toMatch(/likely|will|predict|expected/i);
  });
});

describe("resolveSource — forecast (the one register that points forward)", () => {
  const F = {
    oppKey: "682e8129b40a5799b5f13238d4eb09b6",
    title: "Main Library Renovation and Sustainability Upgrades",
    agencyName: "City of Norwalk",
    agencyKey: 11877,
    forecastType: "New",
    expectedDate: "2026-09-11T00:00:00.000Z",
    estValueLow: 5_000_000,
    estValueHigh: 10_000_000,
    contractingOfficer: "Katy Marin",
    naicsCode: "236220",
    setAside: null,
    popState: "CT",
    alsoUpcoming: 33,
    asOf: "2026-06-12T10:05:44.830Z",
  };
  const pin = (over = {}) =>
    ({
      label: "Upcoming: Main Library Renovation",
      provenance: {
        type: "public",
        ref: "forecast:682e8129b40a5799b5f13238d4eb09b6#expected",
        forecast: { ...F, ...over },
      },
    }) as never;

  test("resolves to the agency's own forecast, with the fields that make it actionable", () => {
    const v = resolveSource(pin());
    expect(v.kind).toBe("public");
    if (v.kind !== "public") return;
    expect(v.entry.origin).toBe("Agency forecast");
    const by = Object.fromEntries(v.entry.fields.map((f) => [f.key, f.value]));
    expect(by.agency).toBe("City of Norwalk");
    expect(by.kind).toBe("New");
    expect(by.value).toBe("$5M – $10M");
    expect(by.officer).toBe("Katy Marin");
    expect(v.entry.pinned).toEqual(["expected"]);
  });

  // Only ~6% of forecasts name a CO. Hiding the row would imply we never looked
  // for the one contact that makes a forecast actionable.
  test("an absent contracting officer is stated, not hidden", () => {
    const v = resolveSource(pin({ contractingOfficer: null }));
    if (v.kind !== "public") return;
    const row = v.entry.fields.find((f) => f.key === "officer");
    expect(row).toBeDefined();
    expect(row?.value).toBeNull();
    // Forecast, agency, kind, expected, value, officer and the other-forecasts count.
    expect(v.entry.fields).toHaveLength(7);
  });

  test("a single-point estimate is not rendered as a range", () => {
    const same = resolveSource(pin({ estValueLow: 5_000_000, estValueHigh: 5_000_000 }));
    if (same.kind === "public") {
      expect(same.entry.fields.find((f) => f.key === "value")?.value).toBe("$5M");
    }
    const onlyHigh = resolveSource(pin({ estValueLow: null, estValueHigh: 10_000_000 }));
    if (onlyHigh.kind === "public") {
      expect(onlyHigh.entry.fields.find((f) => f.key === "value")?.value).toBe("$10M");
    }
    const neither = resolveSource(pin({ estValueLow: null, estValueHigh: null }));
    if (neither.kind === "public") {
      expect(neither.entry.fields.find((f) => f.key === "value")?.value).toBeNull();
    }
  });

  // The count of other forecasts is a field of the record, not a freshness lag, and it
  // is matched on the forecast's own trade, never on the member's.
  test("other upcoming buys from the same office are a field, not a lag note", () => {
    const others = (v: ReturnType<typeof resolveSource>) =>
      v.kind === "public" ? v.entry.fields.find((f) => f.key === "others") : undefined;
    const many = resolveSource(pin());
    expect(others(many)?.label).toBe("Other forecasts from this office in this trade");
    expect(others(many)?.value).toBe("33");
    expect(others(resolveSource(pin({ alsoUpcoming: 1 })))?.value).toBe("1");
    expect(others(resolveSource(pin({ alsoUpcoming: 0 })))?.value).toBeNull();
    for (const v of [many, resolveSource(pin({ alsoUpcoming: 1 }))]) {
      if (v.kind !== "public") throw new Error("expected a public entry");
      expect(v.entry.lagNote).toBeUndefined();
      expect(JSON.stringify(v.entry)).not.toMatch(/your trade/);
    }
  });

  // A forecast is the only forward-looking register, so it is the one most at
  // risk of reading as a prediction. It is a published record.
  test("it is attributed to the agency, never phrased as our prediction", () => {
    const v = resolveSource(pin());
    if (v.kind !== "public") return;
    const blob = `${v.entry.origin} ${v.entry.locator} ${v.entry.fields.map((f) => f.label).join(" ")}`;
    expect(blob).toMatch(/Agency forecast/);
    expect(blob).not.toMatch(/likely|predict|we expect|our estimate/i);
  });

  test("no vendor leak, and a malformed payload degrades", () => {
    const V = "https://www.highergov.com/opportunity/x/";
    expect(JSON.stringify(resolveSource(pin({ title: V, agencyName: V })))).not.toMatch(
      /highergov/i,
    );
    for (const bad of [null, "x", 42, [], { title: {} }]) {
      expect(() =>
        resolveSource({
          label: "x",
          provenance: { type: "public", ref: "forecast:1", forecast: bad },
        } as never),
      ).not.toThrow();
    }
  });
});
