import { createFileRoute } from "@tanstack/react-router";
import { RoadmapPage } from "../demo/sc/roadmap/RoadmapPage";

export const Route = createFileRoute("/roadmap")({
  head: () => ({ meta: [{ title: "Roadmap · GovPreneurs" }] }),
  component: RoadmapPage,
});
