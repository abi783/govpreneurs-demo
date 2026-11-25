// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";

const Navigate = vi.fn((_p: unknown) => null);
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (config: object) => ({
    ...config,
    useParams: () => ({ contractId: "abc123" }),
  }),
  Navigate: (p: unknown) => Navigate(p),
}));
afterEach(cleanup);

it("old awarded links keep the award id", async () => {
  const { Route } = await import("./opportunities.awarded.$contractId");
  const C = (Route as unknown as { component: () => import("react").JSX.Element }).component;
  render(<C />);
  expect(Navigate).toHaveBeenCalledWith(
    expect.objectContaining({ to: "/awards", search: { award: "abc123" }, replace: true }),
  );
});
