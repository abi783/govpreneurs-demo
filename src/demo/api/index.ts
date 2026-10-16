// DEMO: registers every area's handlers with the router.
// Add a new area file here. One file per area; each exports `routes`.

import { registerRoutes } from "../runtime/router";
import { routes as session } from "./session";
import { routes as hunter } from "./hunter";
import { routes as opportunity } from "./opportunity";
import { routes as grant } from "./grant";
import { routes as workspace } from "./workspace";
import { routes as pipeline } from "./pipeline";
import { routes as mentorReviews } from "./mentorReviews";
import { routes as wallet } from "./wallet";
import { routes as partners } from "./partners";
import { routes as awards } from "./awards";
import { routes as buyers } from "./buyers";
import { routes as forecasts } from "./forecasts";
import { routes as smallOrders } from "./smallOrders";
import { routes as businessProfile } from "./businessProfile";
import { routes as scRoadmap } from "./scRoadmap";
import { routes as scTasks } from "./scTasks";
import { routes as scBusiness } from "./scBusiness";
import { routes as scHome } from "./scHome";
import { routes as scMentors } from "./scMentors";
import { routes as misc } from "./misc";

const ALL = [
  session,
  hunter,
  opportunity,
  grant,
  workspace,
  pipeline,
  mentorReviews,
  wallet,
  partners,
  awards,
  buyers,
  forecasts,
  smallOrders,
  businessProfile,
  scRoadmap,
  scTasks,
  scBusiness,
  scHome,
  scMentors,
  misc,
];

let done = false;

export function registerAllDemoRoutes(): void {
  if (done) return;
  done = true;
  for (const routes of ALL) registerRoutes(routes);
}
