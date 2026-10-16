import { createFileRoute } from "@tanstack/react-router";
import { DemoPlaceholder } from "../demo/ui/DemoPlaceholder";

export const Route = createFileRoute("/my-business/")({
  head: () => ({ meta: [{ title: "My Business · GovPreneurs" }] }),
  component: () => <DemoPlaceholder title="My Business" owner="the My Business page agent" />,
});
