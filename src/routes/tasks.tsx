import { createFileRoute } from "@tanstack/react-router";
import { DemoPlaceholder } from "../demo/ui/DemoPlaceholder";

export const Route = createFileRoute("/tasks")({
  head: () => ({ meta: [{ title: "Tasks · GovPreneurs" }] }),
  component: () => <DemoPlaceholder title="Tasks" owner="the Tasks page agent" />,
});
