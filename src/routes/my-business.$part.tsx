import { createFileRoute, notFound } from "@tanstack/react-router";
import { BusinessPartPage } from "../demo/sc/business/BusinessPartPage";
import { isPartId } from "@sc/lib/businessProfile/parts";

// `/my-business/<part>`: sell, jobs, papers, capacity, business, digital, and tell.
// Any other word is a 404, as in the Success Center.
export const Route = createFileRoute("/my-business/$part")({
  head: () => ({ meta: [{ title: "My Business · GovPreneurs" }] }),
  beforeLoad: ({ params }) => {
    if (params.part !== "tell" && !isPartId(params.part)) throw notFound();
  },
  component: MyBusinessPart,
});

function MyBusinessPart() {
  const { part } = Route.useParams();
  return <BusinessPartPage part={part} />;
}
