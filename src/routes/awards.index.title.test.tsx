// @vitest-environment jsdom
//
// The empty state's "Clear filters" must clear the filters, exactly as the "Clear all"
// chip does (prod, 2026-11-20: the chip worked, the button did not).
import { useSyncExternalStore, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

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

describe("Awards search typing", () => {
  it("replaces the URL entry (once, after a pause) so Back does not step through letters", async () => {
    const { Route } = await import("./awards.index");
    const Page = (Route as unknown as { component: () => import("react").JSX.Element }).component;
    fetchAwards.mockResolvedValue({ awards: [], page: 1, limit: 25, hasMore: false });
    urlSearch = {};
    navigate.mockClear();
    render(<Page />);
    const box = await screen.findByRole("searchbox");
    fireEvent.change(box, { target: { value: "r" } });
    fireEvent.change(box, { target: { value: "ro" } });
    await act(() => new Promise((r) => setTimeout(r, 350)));
    const calls = navigate.mock.calls.filter(([o]) => typeof o.search === "function");
    expect(calls.length).toBe(1);
    for (const [o] of calls) expect(o.replace).toBe(true);
  });

  it("has the Awards page title without 'Know your market'", async () => {
    const { Route } = await import("./awards.index");
    const head = (Route as unknown as { head: () => { meta: { title?: string }[] } }).head();
    expect(head.meta[0].title).toBe("Awards · GovPreneurs");
  });
});
