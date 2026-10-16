// DEMO: search entries for the command palette: every Roadmap step and every task.
// Imported by the Roadmap and Tasks pages, so they are in the palette once the app loads.

import { registerSearchEntries } from "@/demo/nav/searchIndex";
import { TASKS } from "@/demo/story/workspace";
import { SHAPE } from "./roadmap/model";

registerSearchEntries([
  ...SHAPE.flatMap((phase) =>
    phase.subSteps.map((s) => ({
      label: `Roadmap: ${s.label}`,
      hint: "Roadmap",
      to: `/roadmap?step=${s.id}`,
      keywords: ["roadmap", "step", phase.label],
    })),
  ),
  ...TASKS.map((t) => ({
    label: t.title,
    hint: "Task",
    to: "/tasks",
    keywords: ["task", "to do"],
  })),
]);
