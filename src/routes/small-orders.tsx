import { Outlet, createFileRoute } from "@tanstack/react-router";
import { SaveFailureNotice } from "../components/MicroPurchases/SaveFailureNotice";

// Layout only — the list lives in small-orders.index.tsx, one order in
// small-orders.$orderId.tsx, and the ones she cannot bid yet in
// small-orders.restricted.tsx. Without this Outlet the parent swallows its
// children and /small-orders/$orderId silently renders the list instead.
//
// AND THE ONE NOTICE THAT OUTLIVES A ROUTE (DH-22). Every route under here
// writes to the member-state store — the board saves and marks seen, the order
// page attests and records a quote, the wins page records a delivery — and one
// failed write is the same fact on all four. It is mounted ONCE, here, so the
// notice stays on screen while she walks from the order she quoted back to the
// board. Its own position is fixed, so it does not sit inside any route's
// column.
function SmallOrdersLayout() {
  return (
    <>
      <Outlet />
      <SaveFailureNotice />
    </>
  );
}

export const Route = createFileRoute("/small-orders")({
  // DEMO: the browser tab said only "GovPreneurs" on every Small Orders page.
  head: () => ({
    meta: [{ title: "Small Orders — Defense Logistics Agency · GovPreneurs" }],
  }),
  component: SmallOrdersLayout,
});
