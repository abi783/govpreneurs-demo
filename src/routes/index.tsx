import { createFileRoute } from "@tanstack/react-router";
import { DemoPlaceholder } from "../demo/ui/DemoPlaceholder";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Success Center · GovPreneurs" }] }),
  component: () => <DemoPlaceholder title="Success Center" owner="the Success Center home page agent" />,
});
