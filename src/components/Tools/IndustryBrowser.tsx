import { useEffect, useState } from "react";
import {
  Megaphone,
  Code,
  Brush,
  Fan,
  Truck,
  HardHat,
  Shield,
  UtensilsCrossed,
  Stethoscope,
  Languages,
  ClipboardList,
  Briefcase,
  GraduationCap,
  TreePine,
  Wrench,
  Camera,
  Building2,
  Package,
  type LucideIcon,
} from "lucide-react";
import { Chip } from "@/components/ui/Chip";
import { industries, slugify, findIndustryBySlug, type IndustryCode } from "@/lib/tools/industries";
import { getNaicsByCodes, type NaicsStat } from "@/lib/tools/api";

const compactUsd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

// Fixed per-industry icon, keyed by name — a lookup here rather than in the
// JSON since the JSON's `icon` field is a tabler class we're deliberately
// dropping. Falls back to Building2 for anything unmapped.
const INDUSTRY_ICONS: Record<string, LucideIcon> = {
  "Marketing & Social Media": Megaphone,
  "IT & Software Development": Code,
  "Cleaning & Janitorial": Brush,
  HVAC: Fan,
  "Trucking & Logistics": Truck,
  "Construction & Trades": HardHat,
  "Security Services": Shield,
  "Food & Catering": UtensilsCrossed,
  Healthcare: Stethoscope,
  "Translation & Language Services": Languages,
  "Administrative & Virtual Assistant": ClipboardList,
  "Consulting & Strategy": Briefcase,
  "Training & Education": GraduationCap,
  "Landscaping & Grounds": TreePine,
  "Auto Repair & Fleet Maintenance": Wrench,
  "Photography & Media": Camera,
  "Property Management": Building2,
  "Wholesale & Distribution": Package,
};

interface IndustryBrowserProps {
  selectedSlug: string | null;
  onSelectSlug: (slug: string | null) => void;
  onSelectCode: (code: string) => void;
}

export function IndustryBrowser({
  selectedSlug,
  onSelectSlug,
  onSelectCode,
}: IndustryBrowserProps) {
  const selected = selectedSlug ? findIndustryBySlug(selectedSlug) : undefined;

  if (selected) {
    return (
      <IndustryDetail
        name={selected.name}
        codes={selected.codes}
        onBack={() => onSelectSlug(null)}
        onSelectCode={onSelectCode}
      />
    );
  }

  return (
    <div style={{ marginTop: "var(--s-6)" }}>
      <div className="t-label" style={{ color: "var(--n-8)", marginBottom: "var(--s-3)" }}>
        Or browse by industry
      </div>
      <div className="tool-industry-grid">
        {industries.map((industry) => {
          const Icon = INDUSTRY_ICONS[industry.name] ?? Building2;
          return (
            <button
              key={industry.name}
              type="button"
              className="option-card tool-industry-card"
              onClick={() => onSelectSlug(slugify(industry.name))}
            >
              <Icon size={20} aria-hidden style={{ color: "var(--blue-7)", flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div className="t-body-sm" style={{ fontWeight: 600 }}>
                  {industry.name}
                </div>
                <div
                  className="t-caption"
                  style={{
                    color: "var(--n-8)",
                    marginTop: 2,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {industry.sub}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function IndustryDetail({
  name,
  codes,
  onBack,
  onSelectCode,
}: {
  name: string;
  codes: IndustryCode[];
  onBack: () => void;
  onSelectCode: (code: string) => void;
}) {
  const [stats, setStats] = useState<Map<string, NaicsStat> | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStats(null);
    getNaicsByCodes(codes.map((c) => c.code))
      .then((res) => {
        if (cancelled) return;
        setStats(new Map(res.results.map((s) => [s.code, s])));
      })
      .catch(() => {
        if (!cancelled) setStats(new Map());
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  const rows = codes
    .map((c) => ({ code: c, stat: stats?.get(c.code) ?? null }))
    .sort((a, b) => (b.stat?.awardCount ?? -1) - (a.stat?.awardCount ?? -1));

  return (
    <div style={{ marginTop: "var(--s-6)" }}>
      <button
        type="button"
        onClick={onBack}
        className="t-body-sm"
        style={{
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          color: "var(--blue-7)",
          fontWeight: 600,
        }}
      >
        ← All industries
      </button>

      <div className="t-heading" style={{ marginTop: "var(--s-3)" }}>
        {name}
      </div>

      {!stats && (
        <div
          aria-hidden
          style={{
            marginTop: "var(--s-3)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--s-2)",
          }}
        >
          {codes.map((c) => (
            <span
              key={c.code}
              className="tool-skel"
              style={{ height: 64, borderRadius: "var(--r-sm)" }}
            />
          ))}
        </div>
      )}

      {stats && (
        <ul
          style={{
            marginTop: "var(--s-3)",
            display: "flex",
            flexDirection: "column",
            gap: "var(--s-2)",
          }}
        >
          {rows.map(({ code, stat }, i) => {
            const isMostActive = i === 0;
            const isStartHere = code.primary && i < 2;
            return (
              <li key={code.code}>
                <button
                  type="button"
                  onClick={() => onSelectCode(code.code)}
                  className="tool-industry-row"
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "var(--s-2)",
                      flexWrap: "wrap",
                    }}
                  >
                    <span className="tool-mono t-body-sm" style={{ fontWeight: 700 }}>
                      {code.code}
                    </span>
                    <span className="t-body-sm" style={{ fontWeight: 600 }}>
                      {code.title}
                    </span>
                    {isMostActive && (
                      <Chip variant="status" tone="pos">
                        Most active
                      </Chip>
                    )}
                    {isStartHere && !isMostActive && (
                      <Chip variant="status" tone="neutral">
                        Start here
                      </Chip>
                    )}
                  </div>
                  <p className="t-body-sm" style={{ color: "var(--n-8)", marginTop: 4 }}>
                    {code.desc}
                  </p>
                  {stat && (
                    <div
                      className="tool-mono t-caption"
                      style={{ marginTop: 6, color: "var(--n-8)" }}
                    >
                      {compactUsd.format(stat.obligated)} · {stat.awardCount.toLocaleString()}{" "}
                      awards ·{" "}
                      {stat.medianValue != null ? compactUsd.format(stat.medianValue) : "n/a"}{" "}
                      median
                    </div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
