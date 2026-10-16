import {
  type OpportunityFilters,
  type MultiFacet,
  removeValue,
} from "../../lib/opportunityFilters";
import {
  agencyLabel,
  dueWindowLabel,
  noticeTypeLabel,
  setAsideLabel,
  vehicleLabel,
} from "../../lib/vocab/filterOptions";
import { stateName } from "../../lib/vocab/usStates";
import { OPTION_GLOSS } from "../../lib/filterGlosses";

export type ActiveChip = {
  key: string;
  label: string;
  onRemove: () => void;
};

function fmtMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `$${Math.round(n / 1_000)}K`;
  return `$${n}`;
}

export function buildActiveChips(
  f: OpportunityFilters,
  set: (next: OpportunityFilters) => void,
): ActiveChip[] {
  const out: ActiveChip[] = [];
  const removeVal = (facet: MultiFacet, v: string) => () => set(removeValue(f, facet, v));

  f.states.forEach((id) =>
    out.push({ key: `st:${id}`, label: stateName(id), onRemove: removeVal("states", id) }),
  );
  f.cities.forEach((id) =>
    out.push({ key: `ct:${id}`, label: id, onRemove: removeVal("cities", id) }),
  );
  f.setAsides.forEach((id) =>
    out.push({
      key: `sa:${id}`,
      label: setAsideLabel(id),
      onRemove: removeVal("setAsides", id),
    }),
  );
  if (f.valueRange.min !== null || f.valueRange.max !== null) {
    const lo = f.valueRange.min ?? null;
    const hi = f.valueRange.max ?? null;
    const label =
      lo !== null && hi !== null
        ? `${fmtMoney(lo)}–${fmtMoney(hi)}`
        : lo !== null
          ? `≥ ${fmtMoney(lo)}`
          : `≤ ${fmtMoney(hi!)}`;
    out.push({
      key: "vr",
      label,
      onRemove: () => set({ ...f, valueRange: { min: null, max: null } }),
    });
  }
  f.dueWindow
    .filter((v) => v !== "any")
    .forEach((id) =>
      out.push({
        key: `dw:${id}`,
        label: dueWindowLabel(id),
        onRemove: removeVal("dueWindow", id),
      }),
    );
  f.naics.forEach((id) =>
    out.push({ key: `n:${id}`, label: `NAICS ${id}`, onRemove: removeVal("naics", id) }),
  );
  f.psc.forEach((id) =>
    out.push({ key: `p:${id}`, label: `PSC ${id}`, onRemove: removeVal("psc", id) }),
  );
  f.noticeTypes.forEach((id) =>
    out.push({
      key: `nt:${id}`,
      label: noticeTypeLabel(id),
      onRemove: removeVal("noticeTypes", id),
    }),
  );
  f.agencies.forEach((id) =>
    out.push({ key: `ag:${id}`, label: agencyLabel(id), onRemove: removeVal("agencies", id) }),
  );
  f.popStates.forEach((id) =>
    out.push({ key: `pp:${id}`, label: `PoP ${id}`, onRemove: removeVal("popStates", id) }),
  );
  // County PoP filter is hidden for now — no county data source from HigherGov.
  f.popZips.forEach((id) =>
    out.push({ key: `pz:${id}`, label: id, onRemove: removeVal("popZips", id) }),
  );
  if (f.postedWithin != null)
    out.push({
      key: "pw",
      label: `Posted ≤ ${f.postedWithin}d`,
      onRemove: () => set({ ...f, postedWithin: null }),
    });
  f.vehicles.forEach((id) =>
    out.push({
      key: `vh:${id}`,
      label: vehicleLabel(id),
      onRemove: removeVal("vehicles", id),
    }),
  );
  (["excludeNoBid", "favoritesOnly", "civilianOnly", "dodOnly"] as const).forEach((k) => {
    if (f.toggles[k]) {
      out.push({
        key: `t:${k}`,
        label: OPTION_GLOSS[`toggles:${k}`]?.split(".")[0] ?? k,
        onRemove: () => set({ ...f, toggles: { ...f.toggles, [k]: false } }),
      });
    }
  });

  return out;
}
