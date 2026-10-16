import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { registerNavigator } from "./demo/nav/navigate";

const queryClient = new QueryClient();

// See src/lib/basepath.ts for why the basepath is derived there.
import { basepath } from "./lib/basepath";
export { basepath };

export const router = createRouter({
  routeTree,
  basepath,
  context: { queryClient },
  scrollRestoration: true,
  // DEMO: the main area of the shell scrolls, not the window. Reset it on each navigation.
  scrollToTopSelectors: ["#demo-main"],
  defaultPreloadStaleTime: 0,
});

// DEMO: code outside React (ghlNav.ts, the Success Center shims) moves the app
// through this function. See src/demo/nav/navigate.ts.
registerNavigator((to, opts) => {
  if (opts?.replace) router.history.replace(to);
  else router.history.push(to);
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
