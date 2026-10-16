import { createFileRoute } from "@tanstack/react-router";
import { CapStatement } from "@/components/Tools/CapStatement/CapStatement";
import { toolsHead } from "@/lib/tools/toolsHead";

export const Route = createFileRoute("/tools/capability-statement")({
  head: () =>
    toolsHead(
      "Free Capability Statement Builder — 3 Templates",
      "Build a one-page federal capability statement PDF free: 3 templates, your logo and colors, UEI and NAICS fields. No signup, and nothing leaves your browser.",
    ),
  component: CapStatement,
});
