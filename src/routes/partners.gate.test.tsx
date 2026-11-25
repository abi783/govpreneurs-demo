// @vitest-environment jsdom
import type { ReactNode } from "react";
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (config: object) => ({
    ...config,
    useSearch: () => ({ view: "find" }),
  }),
  useNavigate: () => vi.fn(),
  Link: ({ children, to, ...rest }: { children?: ReactNode; to: string }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));
vi.mock("../lib/memberState", () => ({
  useMemberState: () => ({ profile: { trades: [] }, loading: false }),
}));
vi.mock("../components/Layout/page-meta", () => ({ usePageMeta: () => {} }));
vi.mock("../components/Partners/FindPartnersView", () => ({ FindPartnersView: () => null }));
vi.mock("../components/Partners/MyPartnersView", () => ({ MyPartnersView: () => null }));
afterEach(cleanup);

it("Go to My Business opens the in-app My Business page, not the Success Center", async () => {
  const { Route } = await import("./partners");
  const Page = (Route as unknown as { component: () => ReactNode }).component;
  const Comp = Page as () => import("react").JSX.Element;
  render(<Comp />);
  const a = screen.getByRole("link", { name: "Go to My Business" });
  expect(a.getAttribute("href")).toBe("/business-profile");
  expect(a.getAttribute("target")).toBeNull();
});

it("has the Partners page title without 'Know your market'", async () => {
  const { Route } = await import("./partners");
  const head = (Route as unknown as { head: () => { meta: { title?: string }[] } }).head();
  expect(head.meta[0].title).toBe("Partners · GovPreneurs");
});
