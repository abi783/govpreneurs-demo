import { useState, type ReactNode } from "react";
import * as Collapsible from "@radix-ui/react-collapsible";
import { ChevronRight } from "lucide-react";

export interface SectionProps {
  title?: string;
  t1Fields: ReactNode[];
  t2Fields: ReactNode[];
  t3Fields: ReactNode[];
  footerProgressText: string;
  footerUnlocksText: string;
}

export function Section({
  title,
  t1Fields,
  t2Fields,
  t3Fields,
  footerProgressText,
  footerUnlocksText,
}: SectionProps) {
  const [open, setOpen] = useState(false);

  return (
    <section className="bp-section">
      {title && <h2 className="bp-section-title">{title}</h2>}

      <div className="bp-section-group">
        {t1Fields.map((node, i) => (
          <div key={`t1-${i}`}>{node}</div>
        ))}
      </div>

      {t2Fields.length > 0 && (
        <>
          <div className="bp-section-divider" aria-hidden />
          <div className="bp-section-group">
            {t2Fields.map((node, i) => (
              <div key={`t2-${i}`}>{node}</div>
            ))}
          </div>
        </>
      )}

      {t3Fields.length > 0 && (
        <Collapsible.Root open={open} onOpenChange={setOpen}>
          <Collapsible.Trigger asChild>
            <button
              type="button"
              className="bp-disclosure-trigger"
              data-open={open ? "true" : "false"}
            >
              <ChevronRight size={16} className="bp-disclosure-chevron" aria-hidden />
              <span className="bp-disclosure-label">
                {open ? "Hide advanced fields" : "Show advanced fields"}
              </span>
              <span className="bp-disclosure-count">({t3Fields.length} hidden)</span>
            </button>
          </Collapsible.Trigger>
          <Collapsible.Content className="bp-disclosure-content">
            <div className="bp-section-group">
              {t3Fields.map((node, i) => (
                <div key={`t3-${i}`}>{node}</div>
              ))}
            </div>
          </Collapsible.Content>
        </Collapsible.Root>
      )}

      <footer className="bp-section-footer">
        <div className="bp-section-progress">
          <span className="bp-section-progress-label">Section progress: </span>
          {footerProgressText}
        </div>
        <div className="bp-section-unlocks">{footerUnlocksText}</div>
      </footer>
    </section>
  );
}
