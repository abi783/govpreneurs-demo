/**
 * The forecast take's wire contract, FRONTEND SIDE.
 *
 * The take's constants and interfaces are declared twice: here in
 * `grantTakeApi.ts`, and in the backend's
 * `backend/src/forecast-grant/forecast-take.types.ts`. The two workspaces share
 * no code, so this test reads the backend's SOURCE TEXT with the TypeScript
 * parser. It holds each constant equal to the one the client imports, and each
 * wire interface to the same property names and optionality as the client's.
 * The precedent is `grantChatApi.parity.test.ts`.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import * as ts from "typescript";
import {
  FORECAST_TAKE_COUNTED_KEYS,
  FORECAST_TAKE_FACT_STATES,
  FORECAST_TAKE_MEMBER_SOURCE_STATES,
  FORECAST_TAKE_MEMBER_SOURCES,
} from "./grantTakeApi";

const HERE = dirname(fileURLToPath(import.meta.url));
const BACKEND_TYPES = resolve(
  HERE,
  "../../../../backend/src/forecast-grant/forecast-take.types.ts",
);
const CLIENT_TYPES = resolve(HERE, "grantTakeApi.ts");

/** The wire interfaces both sides declare under the same name. */
const WIRE_INTERFACES = [
  "ForecastTakeBasis",
  "ForecastTakeCountedFact",
  "ForecastTakeNotChecked",
  "ForecastTakeRead",
  "ForecastTakeResponse",
] as const;

function parse(path: string): ts.SourceFile {
  return ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest);
}

const backend = parse(BACKEND_TYPES);
const client = parse(CLIENT_TYPES);

/** The initializer of `export const <name> = …`, with any `as const` removed. */
function initializer(file: ts.SourceFile, name: string): ts.Expression | undefined {
  for (const statement of file.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const decl of statement.declarationList.declarations) {
      if (!ts.isIdentifier(decl.name) || decl.name.text !== name) continue;
      const init = decl.initializer;
      return init && ts.isAsExpression(init) ? init.expression : init;
    }
  }
  return undefined;
}

/** The string elements of a backend array constant. */
function backendStrings(name: string): string[] {
  const init = initializer(backend, name);
  if (!init || !ts.isArrayLiteralExpression(init)) return [];
  return init.elements.flatMap((e) => (ts.isStringLiteral(e) ? [e.text] : []));
}

/** The string a backend constant holds, or undefined when it is not a string literal. */
function backendString(name: string): string | undefined {
  const init = initializer(backend, name);
  return init && ts.isStringLiteral(init) ? init.text : undefined;
}

/** Each property of an interface as `name` or `name?`, sorted. */
function members(file: ts.SourceFile, name: string): string[] {
  const decl = file.statements.find(
    (s): s is ts.InterfaceDeclaration => ts.isInterfaceDeclaration(s) && s.name.text === name,
  );
  if (!decl) return [];
  return decl.members
    .filter(ts.isPropertySignature)
    .map((m) => `${m.name.getText(file)}${m.questionToken ? "?" : ""}`)
    .sort();
}

/** The type text of one interface property, with whitespace and quote style made uniform. */
function propertyType(file: ts.SourceFile, iface: string, prop: string): string | undefined {
  const decl = file.statements.find(
    (s): s is ts.InterfaceDeclaration => ts.isInterfaceDeclaration(s) && s.name.text === iface,
  );
  const member = decl?.members
    .filter(ts.isPropertySignature)
    .find((m) => m.name.getText(file) === prop);
  return member?.type?.getText(file).replace(/\s+/g, "").replace(/'/g, '"');
}

describe("forecast take wire parity (frontend side)", () => {
  it.each([
    ["FORECAST_TAKE_COUNTED_KEYS", FORECAST_TAKE_COUNTED_KEYS],
    ["FORECAST_TAKE_FACT_STATES", FORECAST_TAKE_FACT_STATES],
    ["FORECAST_TAKE_MEMBER_SOURCES", FORECAST_TAKE_MEMBER_SOURCES],
    ["FORECAST_TAKE_MEMBER_SOURCE_STATES", FORECAST_TAKE_MEMBER_SOURCE_STATES],
  ])("the backend declares %s equal to the client, in order", (name, value) => {
    expect(backendStrings(name)).toEqual([...value]);
  });

  it("the backend's notice type is the client's literal", () => {
    expect(backendString("FORECAST_TAKE_NOTICE_TYPE")).toBe("forecast");
    expect(propertyType(client, "ForecastTakeResponse", "noticeType")).toBe('"forecast"');
  });

  it("the counted fact's state literal is the same on both sides", () => {
    expect(propertyType(backend, "ForecastTakeCountedFact", "state")).toBe('"counted"');
    expect(propertyType(client, "ForecastTakeCountedFact", "state")).toBe('"counted"');
    expect(propertyType(backend, "ForecastTakeNotChecked", "state")).toBe('"notChecked"');
    expect(propertyType(client, "ForecastTakeNotChecked", "state")).toBe('"notChecked"');
  });

  it.each(WIRE_INTERFACES)("%s has the same properties on both sides", (name) => {
    const backendMembers = members(backend, name);
    expect(backendMembers.length).toBeGreaterThan(0);
    expect(members(client, name)).toEqual(backendMembers);
  });
});
