// Deep routes owned by the explore agent. Append here, never in qa/routes.ts.
// The two sub-task files hold the Small Orders routes and the market routes
// (Partners, Awards, Government Buyers, Vehicles, Labor Pricing).
import { ROUTES as ORDERS } from "./explore-orders";
import { ROUTES as MARKET } from "./explore-market";

const FORT_BRAGG = "80e9e92fd343cd7549f92d15374c2885";
const POPE = "56bab3ae5e621d59e2833dc342c88ace";
const VA_FAYETTEVILLE = "ce493b6f89e41ddc4ff5b2b7923301d9";
const CAMP_LEJEUNE = "047c3c8aa5dc76e7ccacc984bdff9848";
const SEYMOUR_JOHNSON = "b8df4a0e3186f2939a144fd849a2ff9c";
const COLLEGE_FOOD_COURT = "63bc4374632ee3bee7be3c460d51bdad";
const CUMBERLAND_SUMMER = "c4bc5f58071250bae50daa744a3df632";
const EPA_CAFETERIA = "699296af65265448b94b6ce84a4f10ea";
const ATLANTA_MEALS = "a55390c2bf8b53c9bc7ec54a19b56116";
const VSU_DINING = "3f95972fa7a051b296e0e902f0a2ccc0";

const OWN: string[] = [
  // Forecasts: the three views, a capture tab, a lane, a filter and a search.
  "/forecasts?view=all",
  "/forecasts?view=saved",
  "/forecasts?tab=act_now",
  "/forecasts?lane=sled",
  "/forecasts?q=catering",
  // A forecast page: the story forecast, the near ones, an out-of-area one, a local one.
  `/forecasts/${FORT_BRAGG}`,
  `/forecasts/${POPE}`,
  `/forecasts/${VA_FAYETTEVILLE}`,
  `/forecasts/${CAMP_LEJEUNE}`,
  `/forecasts/${SEYMOUR_JOHNSON}`,
  `/forecasts/${COLLEGE_FOOD_COURT}`,
  `/forecasts/${CUMBERLAND_SUMMER}`,
  `/forecasts/${EPA_CAFETERIA}`,
  `/forecasts/${ATLANTA_MEALS}`,
  `/forecasts/${VSU_DINING}`,
  // Mentor Reviews: the three written threads.
  "/mentors/rev-fayetteville-proposal",
  "/mentors/rev-mackall-pursue",
  "/mentors/rev-womack-closeout",
  "/wallet",
  "/home",
];

export const ROUTES: string[] = [...OWN, ...ORDERS, ...MARKET];
