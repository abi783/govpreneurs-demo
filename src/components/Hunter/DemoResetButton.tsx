import { RotateCcw } from "lucide-react";

export function DemoResetButton({ onReset }: { onReset: () => void }) {
  return (
    <button
      type="button"
      className="demo-reset"
      onClick={onReset}
      aria-label="Reset demo"
      title="Reset onboarding demo"
    >
      <RotateCcw size={11} />
      Reset demo
    </button>
  );
}
