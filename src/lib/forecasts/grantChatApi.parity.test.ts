/**
 * The forecast Grant chat's wire contract, FRONTEND SIDE.
 *
 * The request bounds and the call names are declared twice: here in
 * `grantChatApi.ts` and `grantCopy.ts`, and in the backend's
 * `backend/src/forecast-grant/forecast-grant.types.ts`. The two workspaces share
 * no code, so this test reads the backend's SOURCE TEXT with the TypeScript
 * parser and holds each value equal to the one the client imports.
 *
 * The backend half is `backend/src/forecast-grant/forecast-grant.parity.spec.ts`.
 * It reads this workspace's source in the same way, so a change in either
 * workspace fails that workspace's own suite. The precedent is the small-orders
 * pair (`lib/microPurchases/parity.test.ts`, `small-orders.parity.spec.ts`).
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import * as ts from "typescript";
import {
  MESSAGE_MAX,
  READ_SUMMARY_MAX,
  READ_UNKNOWN_MAX,
  READ_UNKNOWNS_MAX_ITEMS,
} from "./grantChatApi";
import type { ForecastCall } from "./grantCopy";

/** The backend file that declares the contract, from this file. */
const BACKEND_TYPES = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../../backend/src/forecast-grant/forecast-grant.types.ts",
);

/**
 * Every call the client names. `satisfies` makes the list complete in both
 * directions at compile time: a call added to `ForecastCall` is a missing
 * property here, and a name that is not a call is an excess one.
 */
const CLIENT_CALLS = {
  prepare: true,
  review: true,
  skip: true,
  closed: true,
} satisfies Record<ForecastCall, true>;

const backend = ts.createSourceFile(
  BACKEND_TYPES,
  readFileSync(BACKEND_TYPES, "utf8"),
  ts.ScriptTarget.Latest,
);

/** The initializer of `export const <name> = …` in the backend file, with any `as const` removed. */
function initializer(name: string): ts.Expression | undefined {
  for (const statement of backend.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const decl of statement.declarationList.declarations) {
      if (!ts.isIdentifier(decl.name) || decl.name.text !== name) continue;
      const init = decl.initializer;
      return init && ts.isAsExpression(init) ? init.expression : init;
    }
  }
  return undefined;
}

/** The number a backend constant holds, or undefined when it is not a number literal. */
function backendNumber(name: string): number | undefined {
  const init = initializer(name);
  return init && ts.isNumericLiteral(init) ? Number(init.text) : undefined;
}

/** The string elements of a backend array constant. */
function backendStrings(name: string): string[] {
  const init = initializer(name);
  if (!init || !ts.isArrayLiteralExpression(init)) return [];
  return init.elements.flatMap((e) => (ts.isStringLiteral(e) ? [e.text] : []));
}

describe("forecast Grant chat wire parity (frontend side)", () => {
  it.each([
    ["MESSAGE_MAX", MESSAGE_MAX],
    ["READ_SUMMARY_MAX", READ_SUMMARY_MAX],
    ["READ_UNKNOWNS_MAX_ITEMS", READ_UNKNOWNS_MAX_ITEMS],
    ["READ_UNKNOWN_MAX", READ_UNKNOWN_MAX],
  ])("the backend declares %s equal to the client", (name, value) => {
    expect(backendNumber(name)).toBe(value);
  });

  it("the backend's FORECAST_CALLS names the same calls as ForecastCall", () => {
    expect(backendStrings("FORECAST_CALLS").sort()).toEqual(Object.keys(CLIENT_CALLS).sort());
  });
});
