// Deep routes owned by the explore agent. Append here, never in qa/routes.ts.
import { ROUTES as ORDERS } from "./explore-orders";
import { ROUTES as MARKET } from "./explore-market";

const OWN: string[] = [];

export const ROUTES: string[] = [...OWN, ...ORDERS, ...MARKET];
