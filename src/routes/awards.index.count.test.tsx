// @vitest-environment jsdom
//
// AF-09: a list with more pages must not read "25 awards" (it is "25+").
// ST-04: while a request has failed, the head must not keep the last good count.
import { useSyncExternalStore, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

type Search = Record<string, unknown>;
let urlSearch: Search = {};
const listeners = new Set<() => void>();
const setUrlSearch = (next: Search) => {
  urlSearch = next;
  listeners.forEach((l) => l());
};
const useUrlSearch = () =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => urlSearch,
  );
const navigate = vi.fn((opts: { search: Search | ((p: Search) => Search); replace?: boolean }) =>
  setUrlSearch(typeof opts.search === "function" ? opts.search(urlSearch) : opts.search),
);

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (config: object) => ({
    ...config,
    useSearch: useUrlSearch,
    useNavigate: () => navigate,
  }),
  useNavigate: () => navigate,
  Link: ({ children, className }: { children?: ReactNode; className?: string }) => (
    <a className={className}>{children}</a>
  ),
}));

const fetchAwards = vi.fn();
vi.mock("../lib/awardsApi", async (orig) => ({
  ...(await orig<typeof import("../lib/awardsApi")>()),
  fetchAwards: (...a: unknown[]) => fetchAwards(...a),
  fetchAwardFacets: () => Promise.resolve({ naics: [], psc: [], agencies: [], pricing: [] }),
}));
vi.mock("../lib/memberState", () => ({
  useMemberState: () => ({ profile: { cities: [] }, loading: false }),
}));
vi.mock("../lib/useSavedAwards", () => ({
  useSavedAwards: () => ({ isSaved: () => false, toggle: () => {}, saved: [] }),
}));
vi.mock("../components/Layout/page-meta", () => ({ usePageMeta: () => {} }));
vi.mock("../components/Awards/SavedPartnerAwards", () => ({ SavedPartnerAwards: () => null }));
vi.mock("../components/Awards/AwardDetailDialog", () => ({ AwardDetailDialog: () => null }));
vi.mock("../components/Awards/AwardsFilterPanel", () => ({ AwardsFilterPanel: () => null }));

afterEach(cleanup);

const page = async () => {
  const { Route } = await import("./awards.index");
  return (Route as unknown as { component: () => import("react").JSX.Element }).component;
};
const rows = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    awardId: `a${i}`,
    title: `Job ${i}`,
    winner: { name: "Acme", awardeeKey: null },
    agency: { name: "GSA" },
    recency: {},
    location: {},
  }));

describe("Awards count", () => {
  it("reads 25+ when another page exists (AF-09)", async () => {
    const Page = await page();
    fetchAwards.mockResolvedValue({ awards: rows(2), page: 1, limit: 2, hasMore: true });
    urlSearch = { f: { work: "mine" } };
    render(<Page />);
    await waitFor(() => expect(document.body.textContent).toMatch(/2\+\s*awards/));
  });

  it("drops the count while the request is failing (ST-04)", async () => {
    const Page = await page();
    fetchAwards.mockResolvedValueOnce({ awards: rows(2), page: 1, limit: 25, hasMore: true });
    urlSearch = { q: "roofing" };
    render(<Page />);
    await waitFor(() => expect(document.body.textContent).toMatch(/for\s*.?roofing/));
    fetchAwards.mockRejectedValue(new Error("Failed to fetch"));
    setUrlSearch({ q: "roofing2" });
    await screen.findByText("Could not load awards.");
    expect(screen.queryByText("Failed to fetch")).toBeNull();
    expect(document.body.textContent).not.toMatch(/awards? for/);
  });
});
