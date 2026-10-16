import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toolsHead } from "@/lib/tools/toolsHead";
import { getBrowseByCategory, type BrowseCategory } from "@/lib/tools/api";

const compactUsd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

// Client-side shim for /tools/demand/category/<slug> — the server
// (tools-host.ts's categoryHubHtml) renders the real SEO title/meta/JSON-LD
// for crawlers; this generic title is just a placeholder before the browse
// fetch resolves. Mirrors categoryHubHtml's ≤70-char candidate-fit rule
// exactly, so document.title matches what the server emitted for the same
// category once real hub data is in (see the useEffect below).
function hubTitle(category: string): string {
  const withSuffix = `Federal spending on ${category} · NAICS categories`;
  const baseTitle = `Federal spending on ${category}`;
  return (
    [withSuffix, baseTitle, category].find((candidate) => candidate.length <= 70) ??
    `${category.slice(0, 69)}…`
  );
}

export const Route = createFileRoute("/tools/demand_/category/$slug")({
  head: ({ params }) => toolsHead(hubTitle(params.slug), ""),
  component: CategoryHubPage,
});

function CategoryHubPage() {
  const { slug } = Route.useParams();
  const [categories, setCategories] = useState<BrowseCategory[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    getBrowseByCategory()
      .then((res) => {
        if (!cancelled) setCategories(res.categories);
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const hub = categories?.find((c) => c.slug === slug);

  useEffect(() => {
    if (hub) document.title = hubTitle(hub.category);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hub?.category]);

  if (categories === null) {
    return (
      <div className="tool-main">
        <span
          aria-hidden
          className="tool-skel"
          style={{ display: "block", height: 96, borderRadius: "var(--r-md)" }}
        />
      </div>
    );
  }

  if (!hub) {
    return (
      <div className="tool-main">
        <h1 className="tool-page-title">Category not found</h1>
        <p className="t-body" style={{ color: "var(--n-9)", marginTop: "var(--s-2)" }}>
          We couldn't find that NAICS category.
        </p>
        <p style={{ marginTop: "var(--s-4)" }}>
          <Link to="/tools/demand" className="t-body-sm">
            Browse all NAICS codes →
          </Link>
        </p>
      </div>
    );
  }

  const obligated = hub.codes.reduce((sum, c) => sum + c.obligated, 0);

  return (
    <div className="tool-main">
      <h1 className="tool-page-title">
        How much does the federal government spend on {hub.category}?
      </h1>
      <p className="t-body" style={{ color: "var(--n-9)", marginTop: "var(--s-2)" }}>
        {compactUsd.format(obligated)} across {hub.codes.length} NAICS codes
      </p>

      <ul
        style={{
          marginTop: "var(--s-4)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--s-1)",
          paddingLeft: 0,
          listStyle: "none",
        }}
      >
        {hub.codes.map((c) => (
          <li key={c.code}>
            <Link to="/tools/demand/$naics" params={{ naics: c.code }} className="t-body-sm">
              {c.title} · {compactUsd.format(c.obligated)}
            </Link>
          </li>
        ))}
      </ul>

      <p style={{ marginTop: "var(--s-5)" }}>
        <Link to="/tools/demand" className="t-body-sm">
          Demand check
        </Link>{" "}
        ·{" "}
        <Link to="/tools" className="t-body-sm">
          All tools
        </Link>
      </p>
    </div>
  );
}
