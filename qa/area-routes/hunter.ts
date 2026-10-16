// Deep routes owned by the hunter agent. Append here, never in qa/routes.ts.
//
// The feed keeps its tab, filters, sort and search in page state, not in the URL,
// so there is no deep route to add. `/opportunities` is in the menu list. The
// click sweep opens the Filters drawer, the sort menu, the tabs and the chat
// buttons. `qa/hunter-flow.spec.ts` drives the multi-step flows.
export const ROUTES: string[] = [];
