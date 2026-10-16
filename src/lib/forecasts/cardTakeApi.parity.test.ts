/**
 * The card take's wire contract, FRONTEND SIDE.
 *
 * The bounds and the wire interfaces are declared twice: here in `cardTakeApi.ts`
 * and in the backend's `backend/src/forecast-grant/forecast-card-take.types.ts`.
 * The two workspaces share no code, so this test reads the backend's SOURCE TEXT
 * with the TypeScript parser. The precedent is `grantTakeApi.parity.test.ts`.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import * as ts from "typescript";
import { FORECAST_CARD_TAKE_LINE_MAX, FORECAST_CARD_TAKE_MAX_KEYS } from "./cardTakeApi";

const HERE = dirname(fileURLToPath(import.meta.url));
const BACKEND_TYPES = resolve(
  HERE,
  "../../../../backend/src/forecast-grant/forecast-card-take.types.ts",
);
const CLIENT_TYPES = resolve(HERE, "cardTakeApi.ts");

function parse(path: string): ts.SourceFile {
  return ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest);
}

const backend = parse(BACKEND_TYPES);
const client = parse(CLIENT_TYPES);

/** The numeric value of `export const <name> = <number>` in the backend file. */
function backendNumber(name: string): number | undefined {
  for (const statement of backend.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const decl of statement.declarationList.declarations) {
      if (!ts.isIdentifier(decl.name) || decl.name.text !== name) continue;
      const init = decl.initializer;
      return init && ts.isNumericLiteral(init) ? Number(init.text) : undefined;
    }
  }
  return undefined;
}

/** The property names of an interface, sorted. */
function members(file: ts.SourceFile, name: string): string[] {
  for (const statement of file.statements) {
    if (ts.isInterfaceDeclaration(statement) && statement.name.text === name) {
      return statement.members
        .map((m) => (m.name && ts.isIdentifier(m.name) ? m.name.text : ""))
        .sort();
    }
  }
  return [];
}

describe("the card take's wire contract matches the backend", () => {
  it("holds the same key cap and line cap", () => {
    expect(backendNumber("FORECAST_CARD_TAKE_MAX_KEYS")).toBe(FORECAST_CARD_TAKE_MAX_KEYS);
    expect(backendNumber("FORECAST_CARD_TAKE_LINE_MAX")).toBe(FORECAST_CARD_TAKE_LINE_MAX);
  });

  it.each(["ForecastCardTake", "ForecastCardTakesResponse"])(
    "declares %s with the same properties",
    (name) => {
      const want = members(backend, name);
      expect(want.length).toBeGreaterThan(0);
      expect(members(client, name)).toEqual(want);
    },
  );
});
