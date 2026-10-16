import { Outlet, createFileRoute } from "@tanstack/react-router";

// Layout only — the list lives in forecasts.index.tsx and one forecast in
// forecasts.$forecastId.tsx. Without this Outlet the parent swallows its child and
// /forecasts/$forecastId silently renders the list instead.
export const Route = createFileRoute("/forecasts")({
  component: () => <Outlet />,
});
