import { Check } from "lucide-react";

const STEPS = [
  { id: 1, label: "Sources" },
  { id: 2, label: "Generate" },
  { id: 3, label: "Review & edit" },
  { id: 4, label: "Export" },
] as const;

export function BuilderStepper({ current }: { current: 1 | 2 | 3 | 4 }) {
  return (
    <ol className="cs-stepper" role="list">
      {STEPS.map((s) => {
        const state = s.id < current ? "done" : s.id === current ? "current" : "todo";
        return (
          <li key={s.id} className={`cs-step is-${state}`}>
            <span className="cs-step-dot">
              {state === "done" ? <Check size={11} strokeWidth={3} /> : s.id}
            </span>
            <span className="cs-step-label">{s.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
