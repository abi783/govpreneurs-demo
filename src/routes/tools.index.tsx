import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ClipboardList, FileText, Gauge, ListChecks, MapPin, Search, Trash2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import {
  deleteResult,
  getResults,
  getSummary,
  type ToolResultSummary,
  type ToolsSummary,
} from "@/lib/tools/api";
import { formatRelativeDate } from "@/lib/tools/results";
import { useToolsAccount } from "@/lib/tools/account";
import { appHref } from "@/lib/basepath";
import { toolsHead } from "@/lib/tools/toolsHead";

const DESCRIPTION =
  "7 free tools for small businesses entering federal contracting: demand check, NAICS search, HUBZone map, bid scorecard, and capability statement builder.";

export const Route = createFileRoute("/tools/")({
  head: () => {
    const head = toolsHead("Free Federal Contracting Tools — No Signup", DESCRIPTION);
    // Landing page title reads "... · GovPreneurs", not "... · GovPreneurs Tools".
    head.meta[0] = { title: "Free Federal Contracting Tools — No Signup · GovPreneurs" };
    return head;
  },
  component: ToolsLandingPage,
});

const compactNumber = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const compactUsd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

interface ToolCard {
  title: string;
  blurb: string;
  needs: string;
  href: string;
  external: boolean;
  icon: LucideIcon;
}

const TOOLS: ToolCard[] = [
  {
    title: "Demand check",
    blurb: "See how crowded your trade is and what a typical award pays.",
    needs: "Nothing to start",
    href: "/tools/demand",
    external: false,
    icon: Gauge,
  },
  {
    title: "NAICS search",
    blurb: "Find your code and the dollars behind it.",
    needs: "Nothing to start",
    href: "/tools/naics",
    external: false,
    icon: Search,
  },
  {
    title: "Bid readiness scorecard",
    blurb: "Ten questions, then exactly what to fix first.",
    needs: "A few minutes",
    href: "/tools/scorecard",
    external: false,
    icon: ListChecks,
  },
  {
    title: "Registration checklist",
    blurb: "The seven registrations, in the order that works.",
    needs: "Nothing to start",
    href: "/tools/registration-checklist",
    external: true,
    icon: ClipboardList,
  },
  {
    title: "Contracting officer checklist",
    blurb: "The 48 things a contracting officer checks.",
    needs: "A NAICS code",
    href: "/tools/co-checklist",
    external: true,
    icon: ClipboardList,
  },
  {
    title: "HUBZone map",
    blurb: "Is your address in a HUBZone? One search.",
    needs: "An address",
    href: "/tools/hubzone",
    external: true,
    icon: MapPin,
  },
  {
    title: "Capability statement builder",
    blurb: "A one-page PDF buyers expect, in ten minutes.",
    needs: "A few business details",
    href: "/tools/capability-statement",
    external: true,
    icon: FileText,
  },
];

function ReceiptLine({ summary }: { summary: ToolsSummary | null }) {
  if (!summary) {
    return (
      <div className="figure-tiles" style={{ marginTop: "var(--s-6)" }} aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="tool-skel" style={{ height: 44, borderRadius: "var(--r-md)" }} />
        ))}
      </div>
    );
  }
  const asOf = new Date(summary.asOf);
  const asOfLabel = Number.isNaN(asOf.getTime())
    ? summary.asOf
    : asOf.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      });

  const fy = summary.fiscalYears ?? [];
  const fyLabel = fy.length ? ` in ${fy.length === 1 ? `FY${fy[0]}` : `FY${fy[0]}–FY${fy[fy.length - 1]}`}` : "";
  const tiles = [
    { value: compactUsd.format(summary.totalObligated), label: `Awarded${fyLabel}` },
    { value: compactNumber.format(summary.totalAwards), label: `Awards${fyLabel}` },
    { value: summary.codes.toLocaleString(), label: "NAICS codes" },
    { value: compactNumber.format(summary.openOpps), label: "Open now" },
  ];

  return (
    <div style={{ marginTop: "var(--s-6)" }}>
      <div className="figure-tiles">
        {tiles.map((t) => (
          <div key={t.label}>
            <div className="figure-tile__value">{t.value}</div>
            <div className="figure-tile__label">{t.label}</div>
          </div>
        ))}
      </div>
      <p className="t-caption" style={{ marginTop: "var(--s-3)", color: "var(--n-8)" }}>
        As of {asOfLabel}
      </p>
    </div>
  );
}

function ResultChip({ color }: { color?: string }) {
  const token =
    color === "green"
      ? "var(--pos-7)"
      : color === "red"
        ? "var(--urg-7)"
        : color === "yellow"
          ? "var(--warn-7)"
          : "var(--n-6)";
  return (
    <span
      aria-hidden
      style={{
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: token,
        marginRight: "var(--s-2)",
        flexShrink: 0,
      }}
    />
  );
}

function RecentResultsSkeleton() {
  return (
    <div style={{ marginTop: "var(--s-8)" }} aria-hidden>
      <div className="t-heading">Your recent results</div>
      <div
        style={{
          marginTop: "var(--s-3)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--s-2)",
        }}
      >
        <span className="tool-skel" style={{ height: 52, borderRadius: "var(--r-md)" }} />
        <span className="tool-skel" style={{ height: 52, borderRadius: "var(--r-md)" }} />
      </div>
    </div>
  );
}

function RecentResults() {
  const { user, loading: accountLoading } = useToolsAccount();
  const [results, setResults] = useState<ToolResultSummary[] | null>(null);

  useEffect(() => {
    if (!user) return;
    getResults()
      .then((res) => setResults(res.results))
      .catch(() => setResults([]));
  }, [user]);

  if (accountLoading) return null;

  if (!user) {
    return (
      <p className="t-body-sm" style={{ color: "var(--n-8)", marginTop: "var(--s-8)" }}>
        Sign in to keep your results.
      </p>
    );
  }

  if (results === null) return <RecentResultsSkeleton />;

  if (results.length === 0) {
    return (
      <p className="t-body-sm" style={{ color: "var(--n-8)", marginTop: "var(--s-8)" }}>
        Your results will appear here after you run a tool.
      </p>
    );
  }

  const remove = async (id: string) => {
    setResults((prev) => (prev ? prev.filter((r) => r.id !== id) : prev));
    try {
      await deleteResult(id);
    } catch {
      /* best-effort; the row is already gone from view */
    }
  };

  return (
    <div style={{ marginTop: "var(--s-8)" }}>
      <div className="t-heading">Your recent results</div>
      <ul
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--s-2)",
          marginTop: "var(--s-3)",
        }}
      >
        {results.map((r) => (
          <li key={r.id}>
            <Card>
              <Card.Body
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "var(--s-3)",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div
                    className="t-body-sm"
                    style={{
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    <ResultChip color={r.color} />
                    {r.title ?? r.naics ?? r.tool}
                  </div>
                  <div className="t-caption" style={{ color: "var(--n-8)" }}>
                    {r.tool} · {formatRelativeDate(r.createdAt)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void remove(r.id)}
                  aria-label="Delete result"
                  className="btn btn-ghost btn-sm"
                  style={{ flexShrink: 0, padding: "var(--s-2)" }}
                >
                  <Trash2 size={14} aria-hidden />
                </button>
              </Card.Body>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ToolCardView({ tool }: { tool: ToolCard }) {
  const Icon = tool.icon;
  const body = (
    <Card interactive>
      <Card.Body style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <Icon size={20} aria-hidden style={{ color: "var(--blue-7)" }} />
        <div className="t-subheading" style={{ marginTop: "var(--s-3)" }}>
          {tool.title}
        </div>
        <p
          className="t-body-sm"
          style={{ color: "var(--n-8)", marginTop: "var(--s-1)", marginBottom: "var(--s-4)" }}
        >
          {tool.blurb}
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            // `auto` pins this row to the card's bottom edge so "Open →" sits on
            // one baseline across the grid whatever the blurb length.
            marginTop: "auto",
            paddingTop: "var(--s-3)",
            borderTop: "1px solid var(--border)",
          }}
        >
          <span className="t-caption" style={{ color: "var(--n-8)" }}>
            Needs: {tool.needs}
          </span>
          <span className="t-body-sm" style={{ color: "var(--blue-7)", fontWeight: 600 }}>
            Open →
          </span>
        </div>
      </Card.Body>
    </Card>
  );

  if (tool.external) {
    return (
      <a href={appHref(tool.href)} style={{ display: "block", textDecoration: "none" }}>
        {body}
      </a>
    );
  }
  return (
    <Link to={tool.href as "/tools/demand"} style={{ display: "block", textDecoration: "none" }}>
      {body}
    </Link>
  );
}

function ToolsLandingPage() {
  const [summary, setSummary] = useState<ToolsSummary | null>(null);

  useEffect(() => {
    getSummary()
      .then(setSummary)
      .catch(() => setSummary(null));
  }, []);

  return (
    <div>
      <div className="tool-band">
        <div
          className="tool-container"
          style={{ paddingTop: "var(--s-10)", paddingBottom: "var(--s-10)" }}
        >
          <p className="t-label" style={{ color: "var(--ai-7)", marginBottom: "var(--s-3)" }}>
            AI-powered · built on federal award records
          </p>
          <h1 className="tool-hero-title">
            Free tools for small businesses entering federal contracting
          </h1>
          <p className="t-body-lg" style={{ color: "var(--n-9)", marginTop: "var(--s-3)" }}>
            Free, no account to start. Your email unlocks the full snapshot and a PDF.
          </p>

          <ReceiptLine summary={summary} />
        </div>
      </div>

      <div style={{ marginTop: "var(--s-8)" }}>
        <div className="tool-card-grid">
          {TOOLS.map((tool) => (
            <ToolCardView key={tool.href} tool={tool} />
          ))}
        </div>

        <RecentResults />
      </div>
    </div>
  );
}
