// Grant's name on what is his, inside Ava (the prototype shared these with
// Grant's own page). Small, so Ava does not depend on the Grant page's files.

import { Sparkles } from "lucide-react";

/** "Grant · the bid call": whose words these are. */
export function GrantAttr({ subtitle }: { subtitle?: string }) {
  return (
    <span className="ava-grantattr">
      <Sparkles size={13} strokeWidth={2} aria-hidden />
      Grant{subtitle ? <span className="ava-grantattr__sub"> · {subtitle}</span> : null}
    </span>
  );
}

/** Where the buyer states a rule: a quiet chip with the clause, such as "§1.2". */
export function RefChip({ label }: { label: string }) {
  return (
    <span className="ava-refchip mono" title={`Where the buyer states it: ${label}`}>
      {label}
    </span>
  );
}
