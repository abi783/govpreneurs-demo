import { Outlet, createFileRoute } from "@tanstack/react-router";
import { ScPage } from "../demo/sc/ScPage";
import { BusinessShell } from "../demo/sc/business/BusinessShell";

// DEMO: My Business is the Success Center's page (the lifted code in src/sc). The frame
// (score card and section list) stays while the visitor moves between its parts.
export const Route = createFileRoute("/my-business")({
  head: () => ({ meta: [{ title: "My Business · GovPreneurs" }] }),
  component: MyBusinessLayout,
});

function MyBusinessLayout() {
  return (
    <ScPage>
      <BusinessShell>
        <Outlet />
      </BusinessShell>
    </ScPage>
  );
}
