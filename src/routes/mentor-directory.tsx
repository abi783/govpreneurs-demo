import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, ExternalLink, Search, X } from "lucide-react";
import { apiFetch, API_BASE_URL, buildApiError, ApiError } from "../lib/api";
import { isMockEnv } from "../lib/env";
import { formatDateAbsolute } from "../lib/format";
import { Chip, Modal, Button } from "@/components/ui";

/**
 * This page must only render when embedded as an iframe whose immediate
 * parent is the GovPreneurs app. Enforced whenever NOT local dev — `env.ts`'s
 * `isMockEnv()` is the only reliable environment signal in this app (staging
 * uses the same real GHL SSO/auth path as production, see that file's doc
 * comment), so staging is gated here too, not just production.
 */
const ALLOWED_PARENT_ORIGIN = "https://app.govpreneurs.com";

/**
 * Best-effort, client-side embed check. Not a security boundary (any
 * client-side check can be spoofed by a determined caller with direct API
 * access) — this only prevents casual/accidental standalone access to a
 * page that assumes it's inside the GovPreneurs GHL shell.
 *
 * Evaluated once per mount (see `useState(() => ...)` at the call site).
 */
function isEmbeddedUnderAllowedOrigin(): boolean {
  if (typeof window === "undefined") return false;

  // Not in an iframe at all → definitely not embedded.
  if (window.self === window.top) return false;

  // Chromium/Safari: exposes the full ancestor chain; check the immediate
  // parent only (index 0), not just "some ancestor".
  const ancestorOrigins = (window.location as Location & { ancestorOrigins?: { length: number; item(i: number): string | null } })
    .ancestorOrigins;
  if (ancestorOrigins && ancestorOrigins.length > 0) {
    return ancestorOrigins.item(0) === ALLOWED_PARENT_ORIGIN;
  }

  // Firefox fallback: no ancestorOrigins support, use document.referrer.
  if (!document.referrer) return false;
  try {
    return new URL(document.referrer).origin === ALLOWED_PARENT_ORIGIN;
  } catch {
    return false;
  }
}

/**
 * True when this page is allowed to render its content: local dev always
 * allowed (standalone), otherwise only when embedded under the allowed
 * parent origin.
 */
function isAccessAllowed(): boolean {
  return isMockEnv() || isEmbeddedUnderAllowedOrigin();
}

interface MentorDirectorySearch {
  key?: string;
}

function validateSearch(input: Record<string, unknown>): MentorDirectorySearch {
  return {
    key: typeof input.key === "string" && input.key ? input.key : undefined,
  };
}

export const Route = createFileRoute("/mentor-directory")({
  validateSearch,
  head: () => ({
    meta: [
      { title: "Customer Directory · GovPreneurs" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MentorDirectoryPage,
});

interface Customer {
  id: string;
  locationId: string | null;
  name: string;
  email: string | null;
  naicsCodes: string[];
  primaryNaics: string | null;
  socioEconomicCerts: string[];
  certifications: string[];
  stateCodes: string[];
  cities: string[];
  worksAnywhereInUS: boolean;
  isSmall: boolean | null;
  uei: string | null;
  cage: string | null;
  registeredInSam: boolean | null;
  entityRenewalDate: string | null;
  capabilityStatementUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

interface CustomerDirectoryResponse {
  customers: Customer[];
  total: number;
  page: number;
  limit: number;
  naicsNames?: Record<string, string>;
}

interface DirectoryFacets {
  naics: { code: string; name: string | null }[];
  states: string[];
  setAsides: string[];
}

interface FetchCustomersParams {
  search: string;
  naics: string;
  state: string;
  setAsides: string[];
  sortBy: SortKey;
  sortDir: SortDir;
  page: number;
  limit: number;
}

/**
 * Header carrying the shared access key (read from the page's `?key=` query
 * param) required by the backend on deployed envs. Built explicitly here
 * rather than baked into `apiFetch` since it's specific to this
 * publicly-embeddable page, not the GHL-token auth path every other page uses.
 */
function directoryKeyHeaders(directoryKey: string | undefined): HeadersInit | undefined {
  return directoryKey ? { "X-Directory-Key": directoryKey } : undefined;
}

async function fetchCustomers(
  params: FetchCustomersParams,
  directoryKey: string | undefined,
): Promise<CustomerDirectoryResponse> {
  const qs = new URLSearchParams();
  if (params.search.trim()) qs.set("search", params.search.trim());
  if (params.naics) qs.set("naics", params.naics);
  if (params.state) qs.set("state", params.state);
  if (params.setAsides.length > 0) qs.set("setAsides", params.setAsides.join(","));
  qs.set("sortBy", params.sortBy);
  qs.set("sortDir", params.sortDir);
  qs.set("page", String(params.page));
  qs.set("limit", String(params.limit));

  const res = await apiFetch(`${API_BASE_URL}/customer-directory/customers?${qs.toString()}`, {
    headers: directoryKeyHeaders(directoryKey),
  });
  if (!res.ok) return buildApiError(res, "Couldn't load the customer directory.");
  return res.json();
}

async function fetchFacets(directoryKey: string | undefined): Promise<DirectoryFacets> {
  const res = await apiFetch(`${API_BASE_URL}/customer-directory/facets`, {
    headers: directoryKeyHeaders(directoryKey),
  });
  if (!res.ok) return buildApiError(res, "Couldn't load directory filters.");
  return res.json();
}

const NAICS_OPTION_NAME_MAX = 40;

function truncateName(name: string, max: number): string {
  return name.length > max ? `${name.slice(0, max - 1)}…` : name;
}

function naicsOptionLabel(code: string, name: string | null): string {
  return name ? `${code} — ${truncateName(name, NAICS_OPTION_NAME_MAX)}` : code;
}

function naicsTitle(code: string, naicsNames: Record<string, string>): string {
  const name = naicsNames[code];
  return name ? `${code} — ${name}` : code;
}

type SortKey =
  | "name"
  | "email"
  | "primaryNaics"
  | "naicsCount"
  | "setAsides"
  | "states"
  | "isSmall"
  | "registeredInSam";
type SortDir = "asc" | "desc";

const EM_DASH = "—";
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 25;
const SEARCH_DEBOUNCE_MS = 300;

function displayPrimaryNaics(c: Customer): string | null {
  return c.primaryNaics ?? c.naicsCodes[0] ?? null;
}

function MentorDirectoryPage() {
  // Evaluated once per mount — the embed check reads window.self/top and
  // ancestorOrigins/referrer, none of which change over the component's
  // lifetime, so there's no reason to re-check on every render.
  const [accessAllowed] = useState(isAccessAllowed);
  const { key: directoryKey } = Route.useSearch();

  const [q, setQ] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [naicsFilter, setNaicsFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [setAsideFilters, setSetAsideFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selected, setSelected] = useState<Customer | null>(null);
  const [limit, setLimit] = useState<number>(DEFAULT_PAGE_SIZE);
  const [page, setPage] = useState(1);
  // Bumped on "Clear filters" to force a fresh mount of the NAICS combobox,
  // discarding any in-progress (unselected) search text it holds internally.
  const [naicsComboResetKey, setNaicsComboResetKey] = useState(0);

  // Debounce the raw search input into debouncedSearch so keystrokes don't
  // each fire a server request.
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(q), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [q]);

  const facetsQuery = useQuery({
    queryKey: ["mentor-directory-facets", directoryKey],
    queryFn: () => fetchFacets(directoryKey),
    staleTime: Infinity,
    enabled: accessAllowed,
  });
  const facets = facetsQuery.data;

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: [
      "mentor-directory-customers",
      directoryKey,
      debouncedSearch,
      naicsFilter,
      stateFilter,
      setAsideFilters,
      sortBy,
      sortDir,
      page,
      limit,
    ],
    queryFn: () =>
      fetchCustomers(
        {
          search: debouncedSearch,
          naics: naicsFilter,
          state: stateFilter,
          setAsides: setAsideFilters,
          sortBy,
          sortDir,
          page,
          limit,
        },
        directoryKey,
      ),
    placeholderData: keepPreviousData,
    enabled: accessAllowed,
  });

  const customers = data?.customers ?? [];
  const naicsNames = data?.naicsNames ?? {};
  const total = data?.total ?? 0;

  const hasActiveFilters =
    debouncedSearch.trim() !== "" || naicsFilter !== "" || stateFilter !== "" || setAsideFilters.length > 0;

  function clearFilters() {
    setQ("");
    setDebouncedSearch("");
    setNaicsFilter("");
    setNaicsComboResetKey((k) => k + 1);
    setStateFilter("");
    setSetAsideFilters([]);
  }

  function toggleSetAside(value: string) {
    setSetAsideFilters((cur) =>
      cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value],
    );
  }

  function toggleSort(key: SortKey) {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("asc");
    }
  }

  // Reset to page 1 whenever search, filters, sort, or page size changes.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, naicsFilter, stateFilter, setAsideFilters, sortBy, sortDir, limit]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  // Clamp if the server total shrinks (e.g. data changed) and the current
  // page is now out of range.
  useEffect(() => {
    if (data && page > totalPages) setPage(totalPages);
  }, [data, page, totalPages]);

  const pageStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const pageEnd = total === 0 ? 0 : (page - 1) * limit + customers.length;
  const showPagerControls = total > PAGE_SIZE_OPTIONS[0];

  if (!accessAllowed) {
    return (
      <>
        <div className="brand-stripe" />
        <div className="cust-dir-page">
          <div className="cust-dir-blocked">
            <h1 className="t-display-lg">Access restricted</h1>
            <p className="t-body-sm cust-dir-blocked-body">
              This page can only be opened from inside the GovPreneurs app (app.govpreneurs.com).
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="brand-stripe" />
      <div className="cust-dir-page">
        <header className="cust-dir-header">
          <div className="t-label" style={{ marginBottom: "var(--s-3)" }}>Mentor tools</div>
          <h1 className="t-display-lg">Customer Directory</h1>
          <p className="t-body-sm" style={{ marginTop: "var(--s-2)" }}>
            All GovPreneurs customers — for mentor use.
          </p>
        </header>

        {isLoading ? (
          <div className="cust-dir-loading">Loading customers…</div>
        ) : isError ? (
          <div className="cust-dir-error">
            <p className="t-body-sm">
              {error instanceof ApiError && error.status === 403
                ? "Access key missing or invalid. Open this page from the GovPreneurs app."
                : error instanceof Error
                  ? error.message
                  : "Couldn't load the customer directory."}
            </p>
            <Button variant="secondary" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : (
          <>
            <div className="cust-dir-toolbar">
              <div className="exp-search">
                <Search size={14} />
                <input
                  className="exp-search-input"
                  placeholder="Search by name, email, UEI, or NAICS…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </div>

              <NaicsCombobox
                key={naicsComboResetKey}
                options={facets?.naics ?? []}
                value={naicsFilter}
                onChange={setNaicsFilter}
              />

              <select
                className="cust-dir-select"
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                aria-label="Filter by state"
              >
                <option value="">All states</option>
                {(facets?.states ?? []).map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>

              <div className="exp-pills" role="group" aria-label="Filter by set-aside">
                {(facets?.setAsides ?? []).map((sa) => (
                  <button
                    key={sa}
                    type="button"
                    className={`exp-pill${setAsideFilters.includes(sa) ? " is-active" : ""}`}
                    onClick={() => toggleSetAside(sa)}
                    aria-pressed={setAsideFilters.includes(sa)}
                  >
                    {sa}
                  </button>
                ))}
              </div>
            </div>

            <div className="cust-dir-results">
              <span className="cust-dir-results-count">
                {hasActiveFilters ? `${total} matching customers` : `${total} customers`}
                {isFetching ? " · refreshing…" : ""}
              </span>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X size={12} /> Clear filters
                </Button>
              )}
              <div className="cust-dir-page-size">
                <label htmlFor="cust-dir-page-size-select">Rows per page</label>
                <select
                  id="cust-dir-page-size-select"
                  className="cust-dir-select cust-dir-select-sm"
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  aria-label="Rows per page"
                >
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {customers.length === 0 ? (
              <div className="cust-dir-empty">No customers match your filters.</div>
            ) : (
              <div className="cust-dir-table-scroll" style={{ opacity: isFetching ? 0.6 : 1, transition: "opacity var(--d-fast) ease" }}>
                <table className="cust-dir-table">
                  <thead>
                    <tr>
                      <SortableTh label="Business Name" sortKey="name" current={sortBy} dir={sortDir} onSort={toggleSort} />
                      <SortableTh label="Email" sortKey="email" current={sortBy} dir={sortDir} onSort={toggleSort} />
                      <SortableTh label="Primary NAICS" sortKey="primaryNaics" current={sortBy} dir={sortDir} onSort={toggleSort} />
                      <SortableTh label="NAICS" sortKey="naicsCount" current={sortBy} dir={sortDir} onSort={toggleSort} />
                      <SortableTh label="Set-asides" sortKey="setAsides" current={sortBy} dir={sortDir} onSort={toggleSort} />
                      <SortableTh label="State(s)" sortKey="states" current={sortBy} dir={sortDir} onSort={toggleSort} />
                      <SortableTh label="Small Biz" sortKey="isSmall" current={sortBy} dir={sortDir} onSort={toggleSort} />
                      <SortableTh label="SAM" sortKey="registeredInSam" current={sortBy} dir={sortDir} onSort={toggleSort} />
                      <th>Capability</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c) => (
                      <tr
                        key={c.id}
                        tabIndex={0}
                        onClick={() => setSelected(c)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelected(c);
                          }
                        }}
                      >
                        <td className="cust-dir-cell-truncate" title={c.name || undefined}>
                          {c.name || EM_DASH}
                        </td>
                        <td className="cust-dir-cell-truncate" title={c.email || undefined}>
                          {c.email || EM_DASH}
                        </td>
                        <td
                          className="mono"
                          title={
                            displayPrimaryNaics(c)
                              ? naicsTitle(displayPrimaryNaics(c)!, naicsNames)
                              : undefined
                          }
                        >
                          {displayPrimaryNaics(c) ?? EM_DASH}
                        </td>
                        <td>
                          <ChipOverflowList items={c.naicsCodes} mono naicsNames={naicsNames} />
                        </td>
                        <td>
                          <ChipOverflowList items={c.socioEconomicCerts} />
                        </td>
                        <td>{c.stateCodes.length ? c.stateCodes.join(", ") : EM_DASH}</td>
                        <td>{c.isSmall ? "✓" : <span className="cust-dir-cell-dash">{EM_DASH}</span>}</td>
                        <td>{c.registeredInSam ? "✓" : <span className="cust-dir-cell-dash">{EM_DASH}</span>}</td>
                        <td>
                          {c.capabilityStatementUrl ? (
                            <a
                              href={c.capabilityStatementUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="cust-dir-cell-link"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View <ExternalLink size={11} />
                            </a>
                          ) : (
                            <span className="cust-dir-cell-dash">{EM_DASH}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {total > 0 && (
              <div className="cust-dir-pager">
                <span className="cust-dir-pager-summary">
                  Showing {pageStart}–{pageEnd} of {total}
                </span>
                {showPagerControls && (
                  <div className="cust-dir-pager-controls">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      <ChevronLeft size={14} /> Prev
                    </Button>
                    <span className="cust-dir-pager-indicator">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                    >
                      Next <ChevronRight size={14} />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <Modal.Root open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        {selected && <CustomerDetailModal customer={selected} naicsNames={naicsNames} />}
      </Modal.Root>
    </>
  );
}

const NAICS_COMBO_MAX_RESULTS = 50;

interface NaicsOption {
  code: string;
  name: string | null;
}

function NaicsCombobox({
  options,
  value,
  onChange,
}: {
  options: NaicsOption[];
  value: string;
  onChange: (code: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedOption = value ? options.find((o) => o.code === value) ?? null : null;

  // What the input displays: the selected option's label when nothing is
  // being actively typed, otherwise the in-progress search query.
  const displayValue = query !== "" ? query : selectedOption ? naicsOptionLabel(selectedOption.code, selectedOption.name) : "";

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q === "") return options;
    return options.filter(({ code, name }) => {
      if (code.toLowerCase().includes(q)) return true;
      return name != null && name.toLowerCase().includes(q);
    });
  }, [options, query]);

  const visibleMatches = matches.slice(0, NAICS_COMBO_MAX_RESULTS);

  // Close on click-outside.
  useEffect(() => {
    if (!isOpen) return;
    function handlePointerDown(e: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [isOpen]);

  // Keep the active row in view while navigating with the keyboard.
  useEffect(() => {
    if (activeIndex < 0) return;
    const row = listRef.current?.children[activeIndex] as HTMLElement | undefined;
    row?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  function openWithFreshSelection() {
    setIsOpen(true);
    setActiveIndex(-1);
  }

  function selectOption(option: NaicsOption) {
    onChange(option.code);
    setQuery("");
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  }

  function clearSelection() {
    onChange("");
    setQuery("");
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!isOpen) {
        openWithFreshSelection();
        return;
      }
      setActiveIndex((i) => (i + 1 >= visibleMatches.length ? 0 : i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!isOpen) {
        openWithFreshSelection();
        return;
      }
      setActiveIndex((i) => (i - 1 < 0 ? visibleMatches.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      if (isOpen && activeIndex >= 0 && activeIndex < visibleMatches.length) {
        e.preventDefault();
        selectOption(visibleMatches[activeIndex]);
      }
    } else if (e.key === "Escape") {
      if (isOpen) {
        e.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
      }
    }
  }

  const remaining = matches.length - visibleMatches.length;
  const listboxId = "cust-dir-naics-combo-listbox";

  return (
    <div className="cust-dir-combo" ref={containerRef}>
      <div
        className="cust-dir-combo-field"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-owns={listboxId}
      >
        <input
          ref={inputRef}
          type="text"
          className="cust-dir-select cust-dir-combo-input"
          placeholder="Filter by NAICS — type code or name"
          value={displayValue}
          onChange={(e) => {
            // Any typing drops a current selection and resumes searching.
            setQuery(e.target.value);
            openWithFreshSelection();
          }}
          onFocus={openWithFreshSelection}
          onKeyDown={handleKeyDown}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-activedescendant={
            isOpen && activeIndex >= 0 ? `cust-dir-naics-option-${visibleMatches[activeIndex]?.code}` : undefined
          }
          aria-label="Filter by NAICS code"
        />
        {(query !== "" || selectedOption) && (
          <button
            type="button"
            className="cust-dir-combo-clear"
            onClick={clearSelection}
            aria-label="Clear NAICS filter"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="cust-dir-combo-dropdown">
          {visibleMatches.length === 0 ? (
            <div className="cust-dir-combo-empty">No matching NAICS codes.</div>
          ) : (
            <ul className="cust-dir-combo-list" role="listbox" id={listboxId} ref={listRef}>
              {visibleMatches.map((option, index) => (
                <li
                  key={option.code}
                  id={`cust-dir-naics-option-${option.code}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  className={`cust-dir-combo-option${index === activeIndex ? " is-active" : ""}`}
                  onMouseDown={(e) => {
                    // Prevent the input from blurring before the click registers.
                    e.preventDefault();
                    selectOption(option);
                  }}
                  onMouseEnter={() => setActiveIndex(index)}
                >
                  {naicsOptionLabel(option.code, option.name)}
                </li>
              ))}
            </ul>
          )}
          {remaining > 0 && (
            <div className="cust-dir-combo-footer">{matches.length} matches — keep typing</div>
          )}
        </div>
      )}
    </div>
  );
}

function SortableTh({
  label,
  sortKey,
  current,
  dir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const isActive = current === sortKey;
  const Icon = isActive ? (dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <th>
      <button type="button" className="cust-dir-th-btn" onClick={() => onSort(sortKey)}>
        {label} <Icon size={11} />
      </button>
    </th>
  );
}

function ChipOverflowList({
  items,
  mono = false,
  naicsNames,
}: {
  items: string[];
  mono?: boolean;
  naicsNames?: Record<string, string>;
}) {
  if (items.length === 0) return <span className="cust-dir-cell-dash">{EM_DASH}</span>;
  const shown = items.slice(0, 2);
  const rest = items.slice(2);
  return (
    <div className="cust-dir-cell-chips">
      {shown.map((item) => (
        <Chip
          key={item}
          variant="status"
          tone="neutral"
          className={mono ? "mono" : undefined}
          title={naicsNames ? naicsTitle(item, naicsNames) : undefined}
        >
          {item}
        </Chip>
      ))}
      {rest.length > 0 && (
        <span
          className="cust-dir-cell-more"
          title={
            naicsNames
              ? rest.map((item) => naicsTitle(item, naicsNames)).join("\n")
              : undefined
          }
        >
          +{rest.length}
        </span>
      )}
    </div>
  );
}

function CustomerDetailModal({
  customer: c,
  naicsNames,
}: {
  customer: Customer;
  naicsNames: Record<string, string>;
}) {
  return (
    <Modal.Content size="lg">
      <Modal.Header title={c.name || "Customer detail"} />
      <Modal.Body>
        <section className="cust-dir-modal-section">
          <div className="cust-dir-modal-section-title">Business</div>
          <div className="cust-dir-modal-grid">
            <Field label="Business name" value={c.name} />
            <Field label="Email" value={c.email} />
            <Field label="Location ID" value={c.locationId} mono />
            <Field label="UEI" value={c.uei} mono />
            <Field label="CAGE" value={c.cage} mono />
            <Field label="Small business" value={c.isSmall == null ? null : c.isSmall ? "Yes" : "No"} />
            <Field
              label="SAM registered"
              value={c.registeredInSam == null ? null : c.registeredInSam ? "Yes" : "No"}
            />
            <Field label="Entity renewal date" value={formatDateAbsolute(c.entityRenewalDate)} />
          </div>
        </section>

        <section className="cust-dir-modal-section">
          <div className="cust-dir-modal-section-title">Capabilities</div>
          <div
            className="cust-dir-naics-list"
            style={{ marginBottom: c.capabilityStatementUrl ? "var(--s-3)" : 0 }}
          >
            {c.naicsCodes.length ? (
              c.naicsCodes.map((n) => (
                <div key={n} className="cust-dir-naics-row">
                  <Chip
                    variant="status"
                    tone={n === c.primaryNaics ? "insight" : "neutral"}
                    className="mono"
                  >
                    {n}
                    {n === c.primaryNaics ? " (primary)" : ""}
                  </Chip>
                  <span className="t-body-sm cust-dir-naics-row-name">
                    {naicsNames[n] ?? EM_DASH}
                  </span>
                </div>
              ))
            ) : (
              <span className="cust-dir-cell-dash">{EM_DASH}</span>
            )}
          </div>
          {c.capabilityStatementUrl && (
            <a href={c.capabilityStatementUrl} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" size="sm">
                <ExternalLink size={12} /> View capability statement
              </Button>
            </a>
          )}
        </section>

        <section className="cust-dir-modal-section">
          <div className="cust-dir-modal-section-title">Certifications &amp; Set-asides</div>
          <div className="cust-dir-modal-chips">
            {c.socioEconomicCerts.length === 0 && c.certifications.length === 0 ? (
              <span className="cust-dir-cell-dash">{EM_DASH}</span>
            ) : (
              <>
                {c.socioEconomicCerts.map((sa) => (
                  <Chip key={sa} variant="status" tone="pos">
                    {sa}
                  </Chip>
                ))}
                {c.certifications.map((cert) => (
                  <Chip key={cert} variant="status" tone="neutral">
                    {cert}
                  </Chip>
                ))}
              </>
            )}
          </div>
        </section>

        <section className="cust-dir-modal-section">
          <div className="cust-dir-modal-section-title">Location</div>
          <div className="cust-dir-modal-grid">
            <Field label="State(s)" value={c.stateCodes.length ? c.stateCodes.join(", ") : null} />
            <Field label="Cities" value={c.cities.length ? c.cities.join(", ") : null} />
            <Field label="Works anywhere in US" value={c.worksAnywhereInUS ? "Yes" : "No"} />
          </div>
        </section>

        <section className="cust-dir-modal-section">
          <div className="cust-dir-modal-section-title">Meta</div>
          <div className="cust-dir-modal-grid">
            <Field label="Created" value={formatDateAbsolute(c.createdAt)} />
            <Field label="Updated" value={formatDateAbsolute(c.updatedAt)} />
          </div>
        </section>
      </Modal.Body>
    </Modal.Content>
  );
}

function Field({ label, value, mono = false }: { label: string; value: string | null | undefined; mono?: boolean }) {
  return (
    <div>
      <div className="cust-dir-modal-field-label">{label}</div>
      <div className={`cust-dir-modal-field-value${mono ? " mono" : ""}`}>
        {value || EM_DASH}
      </div>
    </div>
  );
}
