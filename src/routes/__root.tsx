import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  HeadContent,
  createRootRouteWithContext,
  useRouter,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { usePostHog } from "posthog-js/react";
import {
  consumePendingNavIntent,
  consumeOppDeepLink,
  consumeReviewDeepLink,
  oppDeepLinkRoute,
} from "../lib/ghlNav";

import { AppShell } from "../components/Layout/AppShell";
import { CommandBarProvider } from "../components/CommandBar/CommandBarProvider";
import { DemoSessionProvider } from "../lib/demoSession";
import { UIStateProvider } from "../lib/uiState";
import { GhlUserProvider, useGhlUser } from "../lib/ghlUser";
import { BusinessProfileProvider } from "../lib/businessProfile";
import { posthogIdentity, sessionSuperProperties } from "../lib/analyticsSession";

function NotFoundComponent() {
  return (
    <>
      <div className="brand-stripe" />
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--bg)", padding: "var(--s-6)" }}>
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <div className="t-label" style={{ marginBottom: "var(--s-3)" }}>Error 404</div>
          <h1 className="t-display-lg">Page not found</h1>
          <p className="t-body-sm" style={{ marginTop: "var(--s-2)" }}>
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div style={{ marginTop: "var(--s-5)" }}>
            <Link to="/" className="btn btn-primary">Go home</Link>
          </div>
        </div>
      </div>
    </>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <>
      <div className="brand-stripe" />
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--bg)", padding: "var(--s-6)" }}>
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <h1 className="t-heading">This page didn't load</h1>
          <p className="t-body-sm" style={{ marginTop: "var(--s-2)" }}>
            Something went wrong on our end. You can try refreshing or head back home.
          </p>
          <div style={{ marginTop: "var(--s-5)", display: "flex", gap: "var(--s-2)", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => { router.invalidate(); reset(); }}
              className="btn btn-primary"
            >
              Try again
            </button>
            <a href={router.basepath} className="btn btn-secondary">Go home</a>
          </div>
        </div>
      </div>
    </>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    // A cross-page nav from another GHL custom page (e.g. My Bids) leaves an
    // intent in shared localStorage; consume it once on boot. Delete-before-
    // navigate + 15s TTL make this idempotent under StrictMode double-invoke.
    consumePendingNavIntent((route) => {
      void router.navigate({ to: route });
    });

    // A notification deep-link stores the target opportunity or small-order id in
    // localStorage before hard-redirecting into the GHL menu page (see
    // routes/redirect.tsx); consume it here on boot. Skip on the /redirect
    // route itself — that's the page that SETS the deep-link, so consuming it
    // immediately would clear it before the GHL redirect happens. Checking
    // window.location.pathname (not router.state.location.pathname) is
    // deliberately robust to whether the /v2/ui basepath is included.
    if (!window.location.pathname.endsWith("/redirect")) {
      consumeOppDeepLink((id, kind) => {
        void router.navigate(oppDeepLinkRoute(id, kind));
      });
      consumeReviewDeepLink((reviewId) => {
        void router.navigate({ to: "/mentors/$reviewId", params: { reviewId } });
      });
    }
  }, [router]);

  return (
    <QueryClientProvider client={queryClient}>
      <HeadContent />
      <UIStateProvider>
        {/* DemoSessionProvider kept for /admin and /internal bypass routes */}
        <DemoSessionProvider>
          <GhlUserProvider>
            <BusinessProfileProvider>
              <AuthGate />
            </BusinessProfileProvider>
          </GhlUserProvider>
        </DemoSessionProvider>
      </UIStateProvider>
    </QueryClientProvider>
  );
}

function AuthGate() {
  const { loading, error, session, refetch } = useGhlUser();
  const { location } = useRouter().state;
  const posthog = usePostHog();
  const isPublicBypass =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/internal") ||
    location.pathname.startsWith("/mentor-directory") ||
    location.pathname.startsWith("/redirect") ||
    location.pathname.startsWith("/tools");

  // Tag every event from this app with app_version:"v2" so v2 traffic is
  // distinguishable from the v1 app in PostHog (v1 doesn't register this).
  useEffect(() => {
    posthog?.register({ app_version: "v2" });
  }, [posthog]);

  // Tag every event with whether a team member is behind this session. identify
  // below names the location owner even when an agency user switched into the
  // member's account, so without this their clicks count as the member's own.
  // Registered before identify so the $identify event carries it too.
  useEffect(() => {
    if (posthog && session?.userId) {
      posthog.register(sessionSuperProperties({ type: session.type }));
    }
  }, [posthog, session?.userId, session?.type]);

  // Every event carries the member company. A team member is identified as
  // themselves, never as the member whose account they opened (posthogIdentity).
  useEffect(() => {
    if (!posthog || !session?.userId) return;
    posthog.register({ location_id: session.locationId });
    const identity = posthogIdentity(session);
    if (identity) posthog.identify(identity.distinctId, identity.properties);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the fields posthogIdentity reads, not the session object
  }, [
    posthog,
    session?.type,
    session?.userId,
    session?.email,
    session?.userName,
    session?.locationId,
    session?.role,
    session?.planId,
    session?.saasMode,
    session?.viewerUserId,
    session?.viewerEmail,
  ]);

  // Manual pageview on route change (autocapture pageview is disabled, as in v1).
  useEffect(() => {
    if (!posthog) return;
    posthog.capture("$pageview", {
      $current_url: typeof window !== "undefined" ? window.location.href : undefined,
      $pathname: location.pathname,
      $search: location.searchStr,
    });
  }, [posthog, location.pathname, location.searchStr]);

  // Admin/internal/mentor-directory bypass routes don't need GHL auth
  if (isPublicBypass) {
    return <Outlet />;
  }

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "var(--bg)",
        }}
      >
        <div className="t-body-sm" style={{ color: "var(--text-2)" }}>
          Loading…
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "var(--bg)",
          padding: "var(--s-6)",
        }}
      >
        <div style={{ maxWidth: 400, textAlign: "center" }}>
          <h1 className="t-heading">Unable to sign in</h1>
          <p className="t-body-sm" style={{ marginTop: "var(--s-2)", color: "var(--text-2)" }}>
            {error ?? "Could not connect to GovPreneurs. Please try again."}
          </p>
          <button
            onClick={refetch}
            className="btn btn-primary"
            style={{ marginTop: "var(--s-5)" }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <CommandBarProvider>
      <AppShell>
        <Outlet />
      </AppShell>
    </CommandBarProvider>
  );
}
