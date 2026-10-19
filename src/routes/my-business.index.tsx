import { createFileRoute } from "@tanstack/react-router";
import { BusinessLanding } from "../demo/sc/business/BusinessLanding";

export const Route = createFileRoute("/my-business/")({
  head: () => ({ meta: [{ title: "My Business · GovPreneurs" }] }),
  component: BusinessLanding,
});
