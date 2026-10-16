import { useState } from "react";
import { LogOut, Sparkles } from "lucide-react";
import { useDemoSession } from "@/lib/demoSession";
import { LogoutConfirmModal } from "./LogoutConfirmModal";

export function DemoTopBar() {
  const { mode, lead, logout, hydrated } = useDemoSession();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!hydrated || !mode) return null;

  const visitorLabel =
    mode === "admin"
      ? "Admin mode"
      : lead?.firstName
        ? `${lead.firstName}${lead.lastName ? " " + lead.lastName.charAt(0) + "." : ""}`
        : "Guest";

  return (
    <>
      <div className="demo-bar" role="region" aria-label="Demo environment">
        <div className="demo-bar__left">
          <span className="demo-bar__pill" aria-hidden="true">
            <Sparkles size={11} /> LIVE DEMO
          </span>
          <span className="demo-bar__text">
            Every number, contact, and contract on this screen is{" "}
            <strong>illustrative sample data</strong> prepared for VETS26.
          </span>
        </div>
        <div className="demo-bar__right">
          <span className="demo-bar__visitor" title={mode === "admin" ? "Admin bypass" : "Booth visitor"}>
            {visitorLabel}
          </span>
          <button
            type="button"
            className="demo-bar__logout"
            onClick={() => setConfirmOpen(true)}
            aria-label="End demo session"
          >
            <LogOut size={12} />
            <span>End session</span>
          </button>
        </div>
      </div>
      <LogoutConfirmModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={() => {
          setConfirmOpen(false);
          logout();
          // Reset to landing — gate will re-mount.
          if (typeof window !== "undefined") {
            window.location.href = "/";
          }
        }}
        mode={mode}
      />
    </>
  );
}
