/**
 * DH-13 — THE WIRE CONTRACT, FRONTEND SIDE.
 *
 * ── WHAT THIS PINS ────────────────────────────────────────────────────────
 *
 * `MicroOrder` is declared TWICE: here, in `order.ts`, and on the backend in
 * `small-orders.entity.ts`. Two
 * declarations of one wire contract drift, and a drift is silent — the client
 * reads a field the server stopped sending and renders `undefined`, or the
 * server sends a field no screen knows about.
 *
 * So the field list is FROZEN, once per workspace, and three assertions hold
 * the ends together:
 *
 *   1. `order.ts` declares exactly the frozen list. Read from the SOURCE TEXT,
 *      not from the type — see the next block, which is the point of the file.
 *   2. Every order in `liveMapperOutput.fixture.ts` carries exactly the frozen
 *      key set. That fixture is real committed output of the backend mapper, so
 *      it is the referee: it cannot drift from the mapper the way a
 *      hand-written `MicroOrder` would.
 *   3. `MICRO_ORDER_FIELDS` below `satisfies Record<keyof MicroOrder, true>`,
 *      so `npx tsc --noEmit` fails as well — `frontend-v2/tsconfig.json`
 *      includes specs, which puts that half in the commit gate.
 *
 * The backend half is `backend/src/small-orders/small-orders.parity.spec.ts`.
 * It freezes the same names against the mapper's own output. The two lists are
 * separate literals because the two workspaces share no code; the fixture is
 * what ties them, because the backend generates it.
 *
 * ── WHY THE SOURCE TEXT AND NOT THE TYPE ─────────────────────────────────
 *
 * A TYPE HAS NO KEYS AT RUNTIME. A spec that reads `Object.keys` of anything
 * derived from `MicroOrder` reads the list it was handed, so it can catch a
 * RENAME and a REMOVAL — the fixture stops matching — but never an ADDITION:
 * add a field to `order.ts` alone and every runtime key set in the workspace is
 * unchanged. This file parses the declaration out of `order.ts` with the
 * TypeScript compiler instead, so an added field is a name the frozen list does
 * not hold, and the first test fails by name.
 *
 * Adding a field is then a deliberate edit in three places — both declarations
 * and both frozen lists — which is what the ledger asks for.
 *
 * ── THE COUNT ────────────────────────────────────────────────────────────
 *
 * THIRTY-ONE, not the thirty `GOAL-dibbs.md` DH-13 states and not the
 * twenty-nine `small-orders.entity.ts` states. Both counts predate `paper`,
 * which commit eac3ebe4 added on 9 September 2026. The number is asserted
 * below so it cannot rot again.
 *
 * Layer: TEST. Reads source text through the F0 testkit; imports no runtime
 * module but the fixture and the type.
 */
import { describe, it, expect } from "vitest";
import * as ts from "typescript";
import { LIVE_MAPPED_ORDERS, LIVE_MAPPED_UNCATEGORISED } from "./liveMapperOutput.fixture";
import { type MicroOrder } from "./order";
import { readSourceFile } from "./sourceScan.testkit";

/** Where `MicroOrder` is declared, under `frontend-v2/src`. */
const ORDER_DECLARATION = "lib/microPurchases/order.ts";

/**
 * THE FROZEN FIELD LIST. Every field the wire carries, and nothing else.
 *
 * `satisfies` makes it complete in both directions at compile time: a field
 * added to `MicroOrder` is a missing property here, and a name that is not a
 * field is an excess one. Editing this literal is how a field is added to the
 * contract — never a rename that happens to keep the count.
 */
const MICRO_ORDER_FIELDS = {
  id: true,
  solicitation: true,
  dlaOrderUrl: true,
  paper: true,
  version: true,
  amendedOn: true,
  nsn: true,
  plainName: true,
  officialName: true,
  category: true,
  naics: true,
  quantity: true,
  unitOfIssue: true,
  amc: true,
  amsc: true,
  lastPricePerUnit: true,
  lastPriceDate: true,
  standardPrice: true,
  deliveryDays: true,
  setAside: true,
  fobDestination: true,
  fastAward: true,
  repeats: true,
  needsDrawings: true,
  dibbsStatus: true,
  postedOn: true,
  closesOn: true,
  buyer: true,
  buyerContact: true,
  partNumbers: true,
  approvedSources: true,
  awards: true,
} satisfies Record<keyof MicroOrder, true>;

/** The frozen list, sorted, which is what every assertion below compares to. */
const FROZEN_KEYS: readonly string[] = Object.keys(MICRO_ORDER_FIELDS).sort();

/** How many fields the contract holds. Stated, so a silent addition to this
 *  file's own literal still has to move a number. */
const FROZEN_FIELD_COUNT = 32;

/** Both sets, because both are output of the same mapper run. */
const CORPUS: readonly MicroOrder[] = [...LIVE_MAPPED_ORDERS, ...LIVE_MAPPED_UNCATEGORISED];

/**
 * The property names declared at the top level of `type <name> = { … }`.
 *
 * Parsed with the TypeScript compiler rather than a regular expression: the
 * declaration carries ~250 lines of documentation and two nested object types,
 * and a regular expression over that text reports the fields of
 * `buyerContact` as fields of the order.
 *
 * @param source the file's text
 * @param typeName the type alias to read
 * @returns the field names, in declaration order
 */
function declaredFieldNames(source: string, typeName: string): string[] {
  const parsed = ts.createSourceFile(typeName, source, ts.ScriptTarget.ES2022, true);
  const alias = parsed.statements.find(
    (statement): statement is ts.TypeAliasDeclaration =>
      ts.isTypeAliasDeclaration(statement) && statement.name.text === typeName,
  );
  if (alias === undefined || !ts.isTypeLiteralNode(alias.type)) {
    throw new Error(`no \`type ${typeName} = { … }\` declaration to read`);
  }
  return alias.type.members
    .filter(ts.isPropertySignature)
    .map((member) => member.name.getText(parsed));
}

describe("the MicroOrder wire contract, frontend side", () => {
  it("freezes thirty-two field names", () => {
    // Non-vacuous: every assertion below compares to this list, so a list that
    // quietly emptied would pass them all.
    expect(FROZEN_KEYS).toHaveLength(FROZEN_FIELD_COUNT);
    expect(new Set(FROZEN_KEYS).size).toBe(FROZEN_FIELD_COUNT);
  });

  it("declares exactly the frozen field list in order.ts", () => {
    const declared = declaredFieldNames(readSourceFile(ORDER_DECLARATION), "MicroOrder");

    // Sorted on both sides: the declaration groups fields by subject and the
    // frozen list follows it, but neither owns the ORDER of the other.
    expect([...declared].sort()).toEqual(FROZEN_KEYS);
  });

  it("carries exactly the frozen key set on every order of the live mapper output", () => {
    const wrong = CORPUS.filter(
      (order) => JSON.stringify(Object.keys(order).sort()) !== JSON.stringify(FROZEN_KEYS),
    );

    // The ids, not the count: a failure names the orders to go and look at.
    expect(wrong.map((order) => order.id)).toEqual([]);
    expect(CORPUS.length).toBeGreaterThan(0);
  });
});
