import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowRight, Lock } from "lucide-react";
import { useDemoSession } from "@/lib/demoSession";

const ADMIN_PASSWORD = "Media@123";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — GovPreneurs Demo" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { setAdmin, mode } = useDemoSession();
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) {
      setAdmin();
      navigate({ to: "/home" });
      return;
    }
    setError("Incorrect password.");
  }

  return (
    <div className="demo-gate">
      <div className="demo-gate__brandstripe" aria-hidden="true" />
      <div className="demo-gate__card" role="dialog" aria-labelledby="admin-title">
        <div className="demo-gate__kicker">
          <span className="demo-gate__pill">INTERNAL · BYPASS</span>
        </div>
        <h1 id="admin-title" className="demo-gate__title">
          Admin access.
        </h1>
        <p className="demo-gate__sub">
          Enter the team password to bypass the booth lead form and explore the demo freely.
        </p>
        {mode === "admin" && (
          <p className="demo-gate__sub" style={{ color: "var(--blue-9)" }}>
            You're already in admin mode.
          </p>
        )}

        <form className="demo-gate__form" onSubmit={onSubmit} noValidate>
          <label className={`demo-gate__field${error ? " has-error" : ""}`}>
            <span className="demo-gate__label">Password</span>
            <input
              type="password"
              value={pw}
              onChange={(e) => {
                setPw(e.target.value);
                setError(null);
              }}
              autoFocus
              autoComplete="current-password"
              required
            />
            {error && <span className="demo-gate__error">{error}</span>}
          </label>

          <button type="submit" className="btn btn-primary demo-gate__submit">
            <Lock size={14} /> Enter admin mode
            <ArrowRight size={14} />
          </button>
        </form>

        <div className="demo-gate__footer">
          <span className="demo-gate__mono">internal use only</span>
        </div>
      </div>
    </div>
  );
}
