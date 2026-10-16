import { createFileRoute, Outlet } from "@tanstack/react-router";
import { ToolShell } from "@/components/Tools/ToolShell";
import "@/styles/tools.css";
import "@/styles/tools-gate.css";

/**
 * Layout route for the public /tools/* pages (no GHL session — see
 * __root.tsx's AuthGate isPublicBypass list). Renders its own minimal shell
 * since public routes skip AppShell entirely.
 */
export const Route = createFileRoute("/tools")({
  component: () => (
    <ToolShell>
      <Outlet />
    </ToolShell>
  ),
});
