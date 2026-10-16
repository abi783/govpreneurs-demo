import { createFileRoute } from "@tanstack/react-router";
import { BusinessPartPage } from "../demo/sc/business/BusinessPartPage";

// `/my-business/<part>`: sell, jobs, papers, capacity, business, digital, and tell.
export const Route = createFileRoute("/my-business/$part")({
  head: () => ({ meta: [{ title: "My Business · GovPreneurs" }] }),
  component: MyBusinessPart,
});

function MyBusinessPart() {
  const { part } = Route.useParams();
  return <BusinessPartPage part={part} />;
}
