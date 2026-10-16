interface ProgressBarProps {
  value: number; // 0–100
  size?: "sm" | "md";
  className?: string;
}

function progressColor(value: number): string {
  if (value <= 25) return "linear-gradient(90deg, #b91c1c, #ef4444)";
  if (value <= 50) return "linear-gradient(90deg, #c2410c, #f97316)";
  if (value <= 75) return "linear-gradient(90deg, #1d4ed8, #3b82f6)";
  return "linear-gradient(90deg, var(--green-mid), var(--green-text))";
}

export function ProgressBar({ value, size = "md", className = "" }: ProgressBarProps) {
  const height = size === "sm" ? "h-1" : "h-1.5";
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div
      className={`w-full ${height} rounded-full bg-white/[0.06] overflow-hidden ${className}`}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${clamped}%`, background: progressColor(clamped) }}
      />
    </div>
  );
}
