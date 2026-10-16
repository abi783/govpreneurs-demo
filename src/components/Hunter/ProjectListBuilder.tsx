// Repeating per-project sub-form for `project_list`-shaped enrichment asks
// (#6/Task 7) — the "past performance" field. Each project collects a
// description, sector, value band, and rough timing, and submit composes the
// gold-standard tuple string the backend expects: `desc (sector, $value, when); …`.
import { useState } from "react";
import { Chip } from "@/components/ui";
import type { ProfileAsk } from "../../lib/hunterChat";

const SECTORS = ["federal", "state", "local", "commercial"] as const;
const VALUE_BANDS = ["Under $100K", "$100K–$500K", "$500K–$1M", "$1M–$5M", "$5M+"];

export interface Project {
  desc: string;
  sector: (typeof SECTORS)[number];
  value: string;
  when: string;
}

const emptyProject = (): Project => ({
  desc: "",
  sector: "federal",
  value: VALUE_BANDS[0],
  when: "",
});

function composeProject(p: Project): string {
  return `${p.desc.trim()} (${p.sector}, ${p.value}, ${p.when.trim()})`;
}

/** Parses the gold-standard `desc (sector, $value, when); …` tuple string back
 *  into `Project`s — the inverse of `composeProject` — so a follow-up (F2) can
 *  seed the builder with the member's prior projects instead of discarding them.
 *  A tuple that doesn't parse (unexpected shape) is skipped rather than thrown. */
export function parseProjects(value: string): Project[] {
  if (!value.trim()) return [];
  return value
    .split(";")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk): Project | null => {
      const m = /^(.*)\(([^,]+),\s*([^,]+),\s*([^)]+)\)\s*$/.exec(chunk);
      if (!m) return null;
      const [, desc, sector, value, when] = m;
      const sectorTrim = sector.trim();
      const matchedSector = SECTORS.find((s) => s === sectorTrim);
      return {
        desc: desc.trim(),
        sector: matchedSector ?? SECTORS[0],
        value: value.trim(),
        when: when.trim(),
      };
    })
    .filter((p): p is Project => p !== null);
}

export function ProjectListBuilder({
  ask,
  onSubmit,
  initialProjects,
}: {
  ask: ProfileAsk;
  onSubmit: (value: string) => void;
  /** Seed prior projects from a thin answer (F2) — the member adds another; the
   *  resubmitted value is the union superset, not a replacement. */
  initialProjects?: Project[];
}) {
  const [projects, setProjects] = useState<Project[]>(initialProjects ?? []);
  const [draft, setDraft] = useState<Project>(emptyProject());

  const addProject = () => {
    if (!draft.desc.trim() || !draft.when.trim()) return;
    setProjects((prev) => [...prev, draft]);
    setDraft(emptyProject());
  };

  const canSubmit = projects.length > 0 || (draft.desc.trim() && draft.when.trim());

  const submit = () => {
    const all = draft.desc.trim() && draft.when.trim() ? [...projects, draft] : projects;
    onSubmit(all.map(composeProject).join("; "));
  };

  return (
    <div>
      {projects.length > 0 && (
        <div className="hunter-list-builder__chips">
          {projects.map((p, i) => (
            <Chip
              key={`${p.desc}-${i}`}
              variant="filter"
              label={composeProject(p)}
              onRemove={() => setProjects((prev) => prev.filter((_, idx) => idx !== i))}
            />
          ))}
        </div>
      )}
      <div className="hunter-project-builder__item">
        <input
          type="text"
          className="hunter-learn__input hunter-project-builder__desc"
          placeholder="What did you do, and for whom?"
          value={draft.desc}
          onChange={(e) => setDraft({ ...draft, desc: e.target.value })}
          aria-label={ask.label}
        />
        <div className="hunter-project-builder__row">
          <select
            className="hunter-learn__input"
            value={draft.sector}
            onChange={(e) => setDraft({ ...draft, sector: e.target.value as Project["sector"] })}
            aria-label="Sector"
          >
            {SECTORS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            className="hunter-learn__input"
            value={draft.value}
            onChange={(e) => setDraft({ ...draft, value: e.target.value })}
            aria-label="Contract value"
          >
            {VALUE_BANDS.map((band) => (
              <option key={band} value={band}>
                {band}
              </option>
            ))}
          </select>
          <input
            type="text"
            className="hunter-learn__input"
            placeholder="Roughly when?"
            value={draft.when}
            onChange={(e) => setDraft({ ...draft, when: e.target.value })}
            aria-label="When"
          />
        </div>
      </div>
      <div className="hunter-learn__actions">
        <button
          type="button"
          className="hunter-learn__btn"
          disabled={!draft.desc.trim() || !draft.when.trim()}
          onClick={addProject}
        >
          Add another project
        </button>
        <button
          type="button"
          className="hunter-learn__btn hunter-learn__btn--primary"
          disabled={!canSubmit}
          onClick={submit}
        >
          Done
        </button>
      </div>
    </div>
  );
}
