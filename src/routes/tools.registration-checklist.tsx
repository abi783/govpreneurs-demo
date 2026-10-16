import { createFileRoute } from "@tanstack/react-router";
import { RegistrationChecklist } from "@/components/Tools/RegistrationChecklist/RegistrationChecklist";
import { toolsHead } from "@/lib/tools/toolsHead";

export const Route = createFileRoute("/tools/registration-checklist")({
  head: () =>
    toolsHead(
      "SAM.gov Registration Checklist: 9 Steps (Free)",
      "Every step to register for federal contracting: UEI, CAGE code, SAM.gov entity registration, and reps and certs. What to prepare — and why it's free.",
    ),
  component: RegistrationChecklist,
});
