// DEMO: the in-browser API router.
//
// Every backend call the demo makes ends here. `fetchInterceptor.ts` hands it
// each request whose path starts with `/__demo_api/` (frontend-v2 code) or
// `/api/` (code lifted from the Success Center). Handlers live in `src/demo/api/*`.
//
// PATH SCHEME (read this before you write a handler):
//   - A frontend-v2 request goes to `${API_BASE_URL}/opportunities/discover/v2`,
//     and `API_BASE_URL` is `/__demo_api`. The router removes that prefix, so the
//     handler path is `/opportunities/discover/v2`. Write it WITHOUT any prefix.
//   - A Success Center request goes to `/api/portal/...`. The router keeps the
//     whole path. The handler path is `/api/portal/...`. Write it WITH `/api`.
//   - `:name` matches one path segment. `*` at the end matches the rest.
//   - Query strings are never part of the pattern. Read them from `ctx.query`.
//
// A handler returns plain data (the router answers 200 with JSON), or
// `demoResponse(status, body, headers?)`, or a `Response`. It may be async.
//
// Failure rules (the QA crawl fails on all of these):
//   - No handler matches: `console.error("[demo] unhandled API call", ...)`,
//     the call goes in `window.__DEMO_UNHANDLED__`, and the answer is 501.
//   - A handler throws: the error goes in `window.__DEMO_ERRORS__` and the
//     answer is 500.
//
// Latency: 150 to 400 ms at random, so a sales call looks real. It is zero when
// `window.__DEMO_FAST__` is true or the page URL has `?fast=1`. Tests use that.

export type DemoMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface DemoRequestContext {
  /** Values of the `:name` segments in the pattern. */
  params: Record<string, string>;
  /** The query string of the request. */
  query: URLSearchParams;
  /** The parsed JSON body, a `FormData`, a string, or `null` when there is no body. */
  body: any;
  method: DemoMethod;
  /** The full request URL. */
  url: URL;
  /** The request headers. */
  headers: Headers;
}

export type DemoHandlerResult = unknown | Response | DemoResponse | Promise<unknown | Response | DemoResponse>;

export interface DemoRouteDef {
  method: DemoMethod;
  /** See PATH SCHEME above. */
  path: string;
  handler: (ctx: DemoRequestContext) => DemoHandlerResult;
}

export class DemoResponse {
  constructor(
    public status: number,
    public body: unknown,
    public headers: Record<string, string> = {},
  ) {}
}

/** Build an explicit response (use for 4xx, 204, or custom headers). */
export function demoResponse(
  status: number,
  body?: unknown,
  headers?: Record<string, string>,
): DemoResponse {
  return new DemoResponse(status, body, headers);
}

interface CompiledRoute {
  def: DemoRouteDef;
  segments: string[];
  wildcard: boolean;
}

const routes: CompiledRoute[] = [];

function compile(def: DemoRouteDef): CompiledRoute {
  const trimmed = def.path.replace(/\/+$/, "") || "/";
  const segments = trimmed.split("/").filter(Boolean);
  const wildcard = segments[segments.length - 1] === "*";
  if (wildcard) segments.pop();
  return { def, segments, wildcard };
}

/** Add handlers. Later registrations win over earlier ones for the same method and path. */
export function registerRoutes(defs: readonly DemoRouteDef[]): void {
  for (const def of defs) routes.unshift(compile(def));
}

/** The handlers now registered (the QA harness and `/__demo` tools read this). */
export function listRegisteredRoutes(): { method: DemoMethod; path: string }[] {
  return routes.map((r) => ({ method: r.def.method, path: r.def.path }));
}

function match(
  route: CompiledRoute,
  method: string,
  pathSegments: string[],
): Record<string, string> | null {
  if (route.def.method !== method) return null;
  if (route.wildcard) {
    if (pathSegments.length < route.segments.length) return null;
  } else if (pathSegments.length !== route.segments.length) {
    return null;
  }
  const params: Record<string, string> = {};
  for (let i = 0; i < route.segments.length; i++) {
    const want = route.segments[i];
    const got = pathSegments[i];
    if (want.startsWith(":")) {
      try {
        params[want.slice(1)] = decodeURIComponent(got);
      } catch {
        params[want.slice(1)] = got;
      }
    } else if (want !== got) {
      return null;
    }
  }
  if (route.wildcard) params["*"] = pathSegments.slice(route.segments.length).join("/");
  return params;
}

// ── Test hooks ──────────────────────────────────────────────────────────────

declare global {
  interface Window {
    __DEMO_FAST__?: boolean;
    __DEMO_UNHANDLED__?: { method: string; path: string }[];
    __DEMO_ERRORS__?: { method: string; path: string; message: string }[];
    __DEMO_BLOCKED__?: { url: string; method?: string }[];
    /** Number of demo API calls now in flight. The QA harness waits for 0. */
    __DEMO_INFLIGHT__?: number;
  }
}

function fastMode(): boolean {
  if (typeof window === "undefined") return true;
  if (window.__DEMO_FAST__) return true;
  try {
    return new URLSearchParams(window.location.search).get("fast") === "1";
  } catch {
    return false;
  }
}

// DEMO: answers leave in the order the calls arrived. A random wait per call alone lets a late
// "save" overtake an earlier "unsave" (or an old list overtake a new one), and then the screen and
// the stored state disagree. The wait is still 150 to 400 ms, but never earlier than the answer
// before it.
let lastAnswerAt = 0;

function latency(): Promise<void> {
  if (fastMode()) return Promise.resolve();
  const at = Math.max(lastAnswerAt, Date.now() + 150 + Math.random() * 250);
  lastAnswerAt = at;
  return new Promise((r) => setTimeout(r, Math.max(0, at - Date.now())));
}

function record<K extends "__DEMO_UNHANDLED__" | "__DEMO_ERRORS__">(key: K, entry: NonNullable<Window[K]>[number]): void {
  const w = window as Window;
  const list = (w[key] ??= [] as never) as unknown as unknown[];
  list.push(entry);
}

function json(status: number, body: unknown, extra: Record<string, string> = {}): Response {
  if (status === 204 || status === 304) return new Response(null, { status, headers: extra });
  return new Response(JSON.stringify(body ?? null), {
    status,
    headers: { "Content-Type": "application/json", ...extra },
  });
}

async function readBody(init: RequestInit | undefined, request: Request | null): Promise<unknown> {
  const raw = init?.body ?? null;
  if (raw == null && request && request.method !== "GET" && request.method !== "HEAD") {
    try {
      const text = await request.clone().text();
      if (!text) return null;
      try {
        return JSON.parse(text);
      } catch {
        return text;
      }
    } catch {
      return null;
    }
  }
  if (raw == null) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  if (raw instanceof FormData) return raw;
  if (raw instanceof URLSearchParams) return raw;
  if (raw instanceof Blob) return raw;
  return raw;
}

/**
 * Answer one request. `routePath` is the path AFTER the prefix rule in the
 * header comment (no prefix for `/__demo_api`, the full path for `/api`).
 */
export async function handleDemoRequest(
  routePath: string,
  url: URL,
  init: RequestInit | undefined,
  request: Request | null,
): Promise<Response> {
  window.__DEMO_INFLIGHT__ = (window.__DEMO_INFLIGHT__ ?? 0) + 1;
  try {
    return await dispatch(routePath, url, init, request);
  } finally {
    window.__DEMO_INFLIGHT__ = Math.max(0, (window.__DEMO_INFLIGHT__ ?? 1) - 1);
  }
}

async function dispatch(
  routePath: string,
  url: URL,
  init: RequestInit | undefined,
  request: Request | null,
): Promise<Response> {
  const method = (init?.method ?? request?.method ?? "GET").toUpperCase();
  const pathSegments = routePath.split("/").filter(Boolean);
  const headers = new Headers(init?.headers ?? request?.headers ?? undefined);

  // DEMO: the handler runs now, in the order the calls arrive. Only the answer waits (see `latency`).
  const signal = init?.signal ?? request?.signal ?? null;
  if (signal?.aborted) throw new DOMException("The operation was aborted.", "AbortError");
  const answer = await run(method, routePath, pathSegments, headers, url, init, request, signal);
  await latency();
  // The caller can cancel while the answer is "in flight".
  if (signal?.aborted) throw new DOMException("The operation was aborted.", "AbortError");
  return answer;
}

async function run(
  method: string,
  routePath: string,
  pathSegments: string[],
  headers: Headers,
  url: URL,
  init: RequestInit | undefined,
  request: Request | null,
  signal: AbortSignal | null,
): Promise<Response> {

  // The best match wins: more literal segments beat `:param`, which beats `*`.
  // When two patterns tie, the one registered last wins.
  let best: { route: CompiledRoute; params: Record<string, string>; score: number } | null = null;
  for (const route of routes) {
    const params = match(route, method, pathSegments);
    if (!params) continue;
    const literals = route.segments.filter((s) => !s.startsWith(":")).length;
    const score = literals * 2 + (route.wildcard ? 0 : 1);
    if (!best || score > best.score) best = { route, params, score };
  }

  if (best) {
    const { route, params } = best;
    try {
      const body = await readBody(init, request);
      const result = await route.def.handler({
        params,
        query: url.searchParams,
        body,
        method: method as DemoMethod,
        url,
        headers,
      });
      if (signal?.aborted) throw new DOMException("The operation was aborted.", "AbortError");
      if (result instanceof Response) return result;
      if (result instanceof DemoResponse) return json(result.status, result.body, result.headers);
      return json(200, result === undefined ? null : result);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") throw err;
      const message = err instanceof Error ? err.message : String(err);
      console.error("[demo] API handler failed", method, routePath, err);
      record("__DEMO_ERRORS__", { method, path: routePath, message });
      return json(500, { message: "Demo handler failed", error: message });
    }
  }

  console.error("[demo] unhandled API call", method, routePath);
  record("__DEMO_UNHANDLED__", { method, path: routePath });
  return json(501, { message: `Demo has no handler for ${method} ${routePath}` });
}
