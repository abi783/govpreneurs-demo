// DEMO: the first import in `src/main.tsx`. It must run before anything else
// can make a network call, so keep it the first import there.

import { installFetchInterceptor } from "./fetchInterceptor";
import { installLinkGuard } from "../nav/linkGuard";
import { registerAllDemoRoutes } from "../api";

installFetchInterceptor();
installLinkGuard();
registerAllDemoRoutes();
