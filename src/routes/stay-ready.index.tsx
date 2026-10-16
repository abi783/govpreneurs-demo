import { createFileRoute, useRouter } from "@tanstack/react-router";
import { StayReadyOverview } from "../components/StayReady/StayReadyOverview";
import { usePageMeta } from "../components/Layout/page-meta";

export const Route = createFileRoute("/stay-ready/")({
  head: () => ({
    meta: [
      { title: "Stay Ready — GovPreneurs" },
      {
        name: "description",
        content:
          "Track upcoming renewals and obligations — SAM, certifications, and insurance — with proactive reminders so you stay bid-ready.",
      },
    ],
  }),
  component: StayReadyIndexPage,
  errorComponent: StayReadyErrorComponent,
});

function StayReadyIndexPage() {
  usePageMeta({});
  return <StayReadyOverview />;
}

function StayReadyErrorComponent({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const router = useRouter();
  console.error(error);
  return (
    <div style={{ padding: "var(--s-6)", maxWidth: 520 }}>
      <h2 className="t-heading">Stay Ready didn't load</h2>
      <p className="t-body-sm" style={{ marginTop: "var(--s-2)" }}>
        Something went wrong rendering this page. You can retry without leaving the app.
      </p>
      <div style={{ marginTop: "var(--s-4)", display: "flex", gap: "var(--s-2)" }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            router.invalidate();
            reset();
          }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
