import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { SignInPanel } from "@/components/Tools/SignInPanel";
import { useToolsAccount } from "@/lib/tools/account";
import { getSummary, type ToolsSummary } from "@/lib/tools/api";
import { formatRelativeDate } from "@/lib/tools/results";
import { appHref } from "@/lib/basepath";

const compactUsd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

interface CrossLink {
  label: string;
  to: string;
  external?: boolean;
}

interface ToolRailProps {
  /** "What you get" — 3 bullets specific to this tool. */
  bullets: string[];
  /** The user's last saved result for this tool (signed-in state only). */
  lastResult?: { title: string; createdAt: string } | null;
  crossLinks: CrossLink[];
  /** Hide the "Save your results / Sign in" card — the gate on screen already
   *  makes that ask; showing both duplicates it. */
  hideSignIn?: boolean;
}

function FigureTeaser() {
  const [summary, setSummary] = useState<ToolsSummary | null>(null);

  useEffect(() => {
    getSummary()
      .then(setSummary)
      .catch(() => setSummary(null));
  }, []);

  if (!summary) return null;

  return (
    <Card>
      <Card.Body>
        <div className="tool-mono t-body" style={{ fontWeight: 700 }}>
          {compactUsd.format(summary.totalObligated)} awarded · {summary.codes.toLocaleString()}{" "}
          NAICS codes
        </div>
        <div className="t-caption" style={{ marginTop: 4 }}>
          Counted from federal award records
        </div>
      </Card.Body>
    </Card>
  );
}

function AccountCard({
  lastResult,
  hideSignIn,
}: {
  lastResult: ToolRailProps["lastResult"];
  hideSignIn?: boolean;
}) {
  const { user, loading } = useToolsAccount();
  const [open, setOpen] = useState(false);

  if (loading) return null;

  if (!user) {
    if (hideSignIn) return null;
    return (
      <Card>
        <Card.Body>
          <div className="t-subheading">Save your results</div>
          <p className="t-body-sm" style={{ color: "var(--n-8)", marginTop: 4 }}>
            Free, no card required — keep your results across every tool.
          </p>
          <Modal.Root open={open} onOpenChange={setOpen}>
            <Modal.Trigger asChild>
              <Button variant="secondary" style={{ marginTop: "var(--s-3)", width: "100%" }}>
                Sign in
              </Button>
            </Modal.Trigger>
            <Modal.Content size="sm" className="tools-sign-in-modal">
              <Modal.Body>
                <SignInPanel
                  description="Save your results across tools — free, no card required."
                  emailButtonLabel="Send me a code"
                  onUnlocked={() => setOpen(false)}
                />
              </Modal.Body>
            </Modal.Content>
          </Modal.Root>
        </Card.Body>
      </Card>
    );
  }

  if (!lastResult) return null;

  return (
    <Card>
      <Card.Body>
        <div className="t-label">Your last result here</div>
        <div className="t-body-sm" style={{ fontWeight: 600, marginTop: 4 }}>
          {lastResult.title}
        </div>
        <div className="t-caption" style={{ color: "var(--n-8)", marginTop: 2 }}>
          {formatRelativeDate(lastResult.createdAt)}
        </div>
      </Card.Body>
    </Card>
  );
}

export function ToolRail({ bullets, lastResult, crossLinks, hideSignIn }: ToolRailProps) {
  return (
    <aside className="tool-rail">
      <Card>
        <Card.Body>
          <div className="t-label">What you get</div>
          <ul style={{ marginTop: "var(--s-2)", display: "flex", flexDirection: "column", gap: 8 }}>
            {bullets.map((b) => (
              <li
                key={b}
                className="t-body-sm"
                style={{ display: "flex", gap: 8, alignItems: "flex-start" }}
              >
                <span aria-hidden style={{ color: "var(--blue-7)", flexShrink: 0 }}>
                  •
                </span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </Card.Body>
      </Card>

      <FigureTeaser />

      <AccountCard lastResult={lastResult} hideSignIn={hideSignIn} />

      {crossLinks.length > 0 && (
        <Card>
          <Card.Body>
            <div className="t-label" style={{ marginBottom: "var(--s-2)" }}>
              More free tools
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {crossLinks.map((link) =>
                link.external ? (
                  <a
                    key={link.to}
                    href={appHref(link.to)}
                    className="t-body-sm"
                    style={{ color: "var(--blue-7)", fontWeight: 600 }}
                  >
                    {link.label} →
                  </a>
                ) : (
                  <Link
                    key={link.to}
                    to={link.to as "/tools"}
                    className="t-body-sm"
                    style={{ color: "var(--blue-7)", fontWeight: 600 }}
                  >
                    {link.label} →
                  </Link>
                ),
              )}
            </div>
          </Card.Body>
        </Card>
      )}
    </aside>
  );
}

export type { CrossLink };
