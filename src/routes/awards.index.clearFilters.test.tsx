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
const navigate = (opts: { search: Search | ((p: Search) => Search) }) =>
  setUrlSearch(typeof opts.search === "function" ? opts.search(urlSearch) : opts.search);

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

describe("Awards empty state", () => {
  it("Clear filters clears the filters, like the Clear all chip", async () => {
    const { NO_AWARD_FILTERS } = await import("../lib/filters/awardFilters");
    const { Route } = await import("./awards.index");
    const Page = (Route as unknown as { component: () => import("react").JSX.Element }).component;
    fetchAwards.mockResolvedValue({ awards: [], page: 1, limit: 25, hasMore: false });
    urlSearch = { q: "zzz", f: { ...NO_AWARD_FILTERS, competed: "no" } };

    render(<Page />);
    const btn = await screen.findByRole("button", { name: "Clear filters" });
    fireEvent.click(btn);

    await waitFor(() => expect(urlSearch.f).toBeUndefined());
    expect(urlSearch.q).toBe("zzz");
    expect(screen.queryByRole("button", { name: "Clear all" })).toBeNull();
  });

  it("typing keeps trailing spaces and writes the URL once, after a pause", async () => {
    const { Route } = await import("./awards.index");
    const Page = (Route as unknown as { component: () => ReactNode }).component;
    fetchAwards.mockResolvedValue({ awards: [], page: 1, limit: 25, hasMore: false });
    urlSearch = {};
    vi.useFakeTimers();
    try {
      render(<Page />);
      const box = screen.getByLabelText(/Search awards/) as HTMLInputElement;
      fireEvent.change(box, { target: { value: "janitorial " } });
      expect(box.value).toBe("janitorial ");
      expect(urlSearch.q).toBeUndefined();
      act(() => void vi.advanceTimersByTime(300));
      expect(urlSearch.q).toBe("janitorial");
      expect(box.value).toBe("janitorial ");
    } finally {
      vi.useRealTimers();
    }
  });
});
