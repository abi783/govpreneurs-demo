import { createFileRoute } from "@tanstack/react-router";
import { CoChecklist } from "@/components/Tools/CoChecklist/CoChecklist";
import { toolsHead } from "@/lib/tools/toolsHead";

export const Route = createFileRoute("/tools/co-checklist")({
  head: () =>
    toolsHead(
      "The Contracting Officer's Checklist: 50 Items",
      "See what a federal contracting officer checks before awarding to a small business: 50 items across 12 sections, grounded in FAR responsibility standards.",
    ),
  component: CoChecklist,
});
