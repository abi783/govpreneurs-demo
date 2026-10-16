/**
 * The forecast watch's wire contract, FRONTEND SIDE.
 *
 * The watch's constants and wire interfaces are declared twice: here in
 * `watch.ts`, and in the backend's
 * `backend/src/forecast-watch/forecast-watch.types.ts`. The two workspaces share
 * no code, so this test reads the backend's SOURCE TEXT with the TypeScript
 * parser. It holds each array equal to the one the client imports, and each wire
 * interface to the same property names and optionality as the client's. The
 * precedent is `grantTakeApi.parity.test.ts`.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import * as ts from "typescript";
import {
  FORECAST_WATCH_EVENT_KINDS,
  FORECAST_WATCH_FIELDS,
  FORECAST_WATCH_NOTICE_BASIS_KINDS,
  FORECAST_WATCH_NOTICE_TARGETS,
  FORECAST_WATCH_UNCOUNTED_KINDS,
  type ForecastWatchEvent,
} from "./watch";
import { DEMO_FIRM, SCORED_FORECASTS } from "./__fixtures__/scored";
import { WATCH_NOTICE } from "./watchCopy";
import { watchLines, type NoticeLine } from "./watchLines";

const HERE = dirname(fileURLToPath(import.meta.url));
const BACKEND_TYPES = resolve(
  HERE,
  "../../../../backend/src/forecast-watch/forecast-watch.types.ts",
);
const CLIENT_TYPES = resolve(HERE, "watch.ts");
const BACKEND_EXACT_LINKS = resolve(
  HERE,
  "../../../../backend/src/forecast-watch/forecast-links.exact.ts",
);

/** Each wire interface as [backend name, client name]. The client drops the `Dto` suffix. */
const WIRE_INTERFACES = [
  ["ForecastWatchResponse", "ForecastWatchResponse"],
  ["ForecastWatchForecastDto", "ForecastWatchForecast"],
  ["ForecastWatchEventDto", "ForecastWatchEvent"],
  ["ForecastWatchNotice", "ForecastWatchNotice"],
] as const;

function parse(path: string): ts.SourceFile {
  return ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest);
}

const backend = parse(BACKEND_TYPES);
const client = parse(CLIENT_TYPES);

/** The string elements of `export const <name> = [...] as const` in `file`. */
function arrayStrings(file: ts.SourceFile, name: string): string[] {
  for (const statement of file.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const decl of statement.declarationList.declarations) {
      if (!ts.isIdentifier(decl.name) || decl.name.text !== name) continue;
      const raw = decl.initializer;
      const init = raw && ts.isAsExpression(raw) ? raw.expression : raw;
      if (!init || !ts.isArrayLiteralExpression(init)) return [];
      return init.elements.flatMap((e) => (ts.isStringLiteral(e) ? [e.text] : []));
    }
  }
  return [];
}

function interfaceOf(file: ts.SourceFile, name: string): ts.InterfaceDeclaration | undefined {
  return file.statements.find(
    (s): s is ts.InterfaceDeclaration => ts.isInterfaceDeclaration(s) && s.name.text === name,
  );
}

/** Each property signature as `name` or `name?`, sorted. */
function propertyNames(file: ts.SourceFile, list: ts.NodeArray<ts.TypeElement>): string[] {
  return list
    .filter(ts.isPropertySignature)
    .map((m) => `${m.name.getText(file)}${m.questionToken ? "?" : ""}`)
    .sort();
}

function members(file: ts.SourceFile, name: string): string[] {
  const decl = interfaceOf(file, name);
  return decl ? propertyNames(file, decl.members) : [];
}

/** The property signature `prop` of interface `iface`. */
function property(
  file: ts.SourceFile,
  iface: string,
  prop: string,
): ts.PropertySignature | undefined {
  return interfaceOf(file, iface)
    ?.members.filter(ts.isPropertySignature)
    .find((m) => m.name.getText(file) === prop);
}

/** The type text of a property, with whitespace and quote style made uniform. */
function propertyType(file: ts.SourceFile, iface: string, prop: string): string | undefined {
  return property(file, iface, prop)?.type?.getText(file).replace(/\s+/g, "").replace(/'/g, '"');
}

describe("forecast watch wire parity (frontend side)", () => {
  it.each([
    ["FORECAST_WATCH_FIELDS", FORECAST_WATCH_FIELDS],
    ["FORECAST_WATCH_EVENT_KINDS", FORECAST_WATCH_EVENT_KINDS],
    ["FORECAST_WATCH_NOTICE_TARGETS", FORECAST_WATCH_NOTICE_TARGETS],
    ["FORECAST_WATCH_NOTICE_BASIS_KINDS", FORECAST_WATCH_NOTICE_BASIS_KINDS],
    ["FORECAST_WATCH_UNCOUNTED_KINDS", FORECAST_WATCH_UNCOUNTED_KINDS],
  ])("the backend declares %s equal to the client, in order", (name, value) => {
    const backendValue = arrayStrings(backend, name);
    expect(backendValue.length).toBeGreaterThan(0);
    expect(backendValue).toEqual([...value]);
    expect(arrayStrings(client, name)).toEqual(backendValue);
  });

  it.each(WIRE_INTERFACES)("%s has the same properties as the client's %s", (b, c) => {
    const backendMembers = members(backend, b);
    expect(backendMembers.length).toBeGreaterThan(0);
    expect(members(client, c)).toEqual(backendMembers);
  });

  it.each(WIRE_INTERFACES)("%s types each property as the client's %s does", (b, c) => {
    const rename = (text: string | undefined): string | undefined =>
      text?.replace(/(ForecastWatch\w+)Dto\b/g, "$1");
    for (const name of members(backend, b).map((m) => m.replace("?", ""))) {
      expect([name, rename(propertyType(client, c, name))]).toEqual([
        name,
        rename(propertyType(backend, b, name)),
      ]);
    }
  });

  it("the notice's basis has the same members, properties and types on both sides", () => {
    const backendBasis = basisMembers(backend);
    expect(backendBasis).toHaveLength(FORECAST_WATCH_NOTICE_BASIS_KINDS.length);
    expect(basisMembers(client)).toEqual(backendBasis);
  });

  it("the watched value alias has the same union members on both sides", () => {
    const backendMembers = aliasMembers(backend, "ForecastWatchValue");
    expect(backendMembers.length).toBeGreaterThan(0);
    expect(aliasMembers(client, "ForecastWatchValue")).toEqual(backendMembers);
  });
});

/** The `[key, number]` entries of `export const <name> ... = { ... }` in `file`. */
function objectNumbers(file: ts.SourceFile, name: string): [string, number][] {
  for (const statement of file.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const decl of statement.declarationList.declarations) {
      if (!ts.isIdentifier(decl.name) || decl.name.text !== name) continue;
      const raw = decl.initializer;
      const init = raw && ts.isAsExpression(raw) ? raw.expression : raw;
      if (!init || !ts.isObjectLiteralExpression(init)) return [];
      return init.properties.flatMap((p) =>
        ts.isPropertyAssignment(p) &&
        (ts.isStringLiteral(p.name) || ts.isIdentifier(p.name)) &&
        ts.isNumericLiteral(p.initializer)
          ? [[p.name.text, Number(p.initializer.text)] as [string, number]]
          : [],
      );
    }
  }
  return [];
}

/** The headline the watch box shows for a named notice of `noticeType`. */
function namedHeadline(noticeType: string): string {
  const event: ForecastWatchEvent = {
    id: "ev",
    kind: "bid_request_posted",
    field: null,
    before: null,
    after: null,
    decided: null,
    notice: {
      oppKey: "OPP_1",
      target: "opportunity",
      title: "Roof repair",
      agencyName: "Naval Facilities",
      noticeType,
      postedOn: "2026-09-25",
      held: true,
      basis: { kind: "named", number: "N1" },
    },
    observedAt: "2026-09-27T12:19:00.000Z",
    seenAt: null,
  };
  const forecast = SCORED_FORECASTS[0];
  const [line] = watchLines([event], { forecast, firm: DEMO_FIRM });
  return (line as NoticeLine).headline;
}

/** The headline for each backend rank. A rank past 1 is not a bid request or an early notice. */
const HEADLINE_OF_RANK: Record<number, string> = {
  0: WATCH_NOTICE.postedHeadline.bidRequest,
  1: WATCH_NOTICE.postedHeadline.earlyNotice,
};

describe("forecast links notice-type parity (frontend side)", () => {
  const ranks = objectNumbers(parse(BACKEND_EXACT_LINKS), "BID_NOTICE_TYPE_RANK");

  it("reads the backend's BID_NOTICE_TYPE_RANK with a bid request and an early notice", () => {
    expect(ranks.map(([, rank]) => rank)).toEqual(expect.arrayContaining([0, 1]));
  });

  it("words each ranked type as the rank says, after the client's normalisation", () => {
    for (const [type, rank] of ranks) {
      const expected = HEADLINE_OF_RANK[rank];
      const actual = namedHeadline(type);
      if (expected) expect([type, actual]).toEqual([type, expected]);
      else expect(Object.values(HEADLINE_OF_RANK)).not.toContain(actual);
    }
  });

  it("keeps Sources Sought on its own headline", () => {
    expect(ranks.map(([type]) => type)).toContain("Sources Sought");
    expect(namedHeadline("Sources Sought")).toBe(WATCH_NOTICE.postedHeadline.sourcesSought);
  });
});

/**
 * Each member of the `ForecastWatchNoticeBasis` union as sorted `name:type` pairs, with
 * whitespace, quote style and comments made uniform. Sorted by its `kind`.
 */
function basisMembers(file: ts.SourceFile): string[][] {
  const alias = file.statements.find(
    (s): s is ts.TypeAliasDeclaration =>
      ts.isTypeAliasDeclaration(s) && s.name.text === "ForecastWatchNoticeBasis",
  );
  if (!alias || !ts.isUnionTypeNode(alias.type)) return [];
  return alias.type.types
    .filter(ts.isTypeLiteralNode)
    .map((literal) =>
      literal.members
        .filter(ts.isPropertySignature)
        .map((m) => {
          const type = m.type?.getText(file).replace(/\s+/g, "").replace(/'/g, '"');
          return `${m.name.getText(file)}${m.questionToken ? "?" : ""}:${type}`;
        })
        .sort(),
    )
    .sort((a, b) =>
      (a.find((p) => p.startsWith("kind:")) ?? "").localeCompare(
        b.find((p) => p.startsWith("kind:")) ?? "",
      ),
    );
}

/** The member types of `type <name> = A | B | …`, as sorted text. */
function aliasMembers(file: ts.SourceFile, name: string): string[] {
  const alias = file.statements.find(
    (s): s is ts.TypeAliasDeclaration => ts.isTypeAliasDeclaration(s) && s.name.text === name,
  );
  if (!alias) return [];
  const type = alias.type;
  const parts = ts.isUnionTypeNode(type) ? type.types : [type];
  return parts.map((t) => t.getText(file)).sort();
}
