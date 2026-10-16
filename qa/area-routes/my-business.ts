// Deep routes owned by the my-business agent. Append here, never in qa/routes.ts.
export const ROUTES: string[] = [
  // Success Center: My Business. Basic Info is /my-business (the menu route).
  "/my-business/sell",
  "/my-business/jobs",
  "/my-business/papers",
  "/my-business/capacity",
  "/my-business/business",
  "/my-business/digital",
  "/my-business/tell",

  // Business profile (frontend-v2): every tab, the first-visit mode, Stay Ready and the builder.
  "/business-profile",
  "/business-profile?tab=identity",
  "/business-profile?tab=capabilities",
  "/business-profile?tab=certifications",
  "/business-profile?tab=digital",
  "/business-profile?tab=sled",
  "/business-profile?tab=bidder-profile",
  "/business-profile?tab=past-performance",
  "/business-profile?tab=mentor-history",
  "/business-profile?tab=knowledge",
  "/business-profile?tab=stay-ready",
  "/business-profile?onboarding=true",
  "/stay-ready",
  "/stay-ready/sam",
  "/stay-ready/health-permit",
  "/stay-ready/wosb-cert",
  "/stay-ready/insurance",
  "/cap-statement/builder",
];
