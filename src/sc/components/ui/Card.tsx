import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "glass" | "glass-dark" | "green" | "gold";
}

export function Card({ variant = "glass", className = "", children, ...props }: CardProps) {
  const variants = {
    glass: "glass",
    "glass-dark": "glass-dark",
    green: "bg-[rgba(0,79,45,0.2)] border border-[rgba(0,166,90,0.2)] border-t-[rgba(0,166,90,0.35)]",
    gold: "bg-[rgba(180,151,90,0.06)] border border-[rgba(180,151,90,0.18)] border-t-[rgba(180,151,90,0.28)]",
  };

  return (
    <div
      className={`rounded-[var(--radius-lg)] ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
