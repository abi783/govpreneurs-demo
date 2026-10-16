import { createFileRoute } from "@tanstack/react-router";
import { Hubzone } from "@/components/Tools/Hubzone/Hubzone";
import { toolsHead } from "@/lib/tools/toolsHead";

export const Route = createFileRoute("/tools/hubzone")({
  head: () =>
    toolsHead(
      "Is My Address in a HUBZone? Free Map Lookup",
      "Check any address against current SBA HUBZone layers, see which designation applies and when it expires, plus the 35% employee rule you also have to meet.",
    ),
  component: Hubzone,
});
