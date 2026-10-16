import { useState, type FormEvent } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { submitLead } from "@/lib/leadCapture.functions";
import { useDemoSession } from "@/lib/demoSession";

interface Errors {
  firstName?: string;
  lastName?: string;
  businessName?: string;
  email?: string;
  phone?: string;
  form?: string;
}

function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

function validate(values: {
  firstName: string;
  lastName: string;
  businessName: string;
  email: string;
  phone: string;
}): Errors {
  const e: Errors = {};
  if (!values.firstName.trim()) e.firstName = "Required";
  if (!values.lastName.trim()) e.lastName = "Required";
  if (!values.businessName.trim()) e.businessName = "Required";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) e.email = "Enter a valid email";
  const digits = values.phone.replace(/\D/g, "");
  if (digits.length !== 10) e.phone = "Enter a 10-digit US phone";
  return e;
}

export function LeadFormGate() {
  const { setLead } = useDemoSession();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [attempts, setAttempts] = useState(0);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const values = { firstName, lastName, businessName, email, phone };
    const v = validate(values);
    setErrors(v);
    if (Object.keys(v).length > 0) return;

    setSubmitting(true);
    try {
      const res = await submitLead(values);
      if (res.ok) {
        setLead(values);
        return;
      }
      // Failure: on second attempt, let them through anyway (booth wifi flake).
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      if (nextAttempts >= 2) {
        console.warn("[demo] Letting visitor through after 2 failed lead submissions.", res);
        setLead(values);
        return;
      }
      setErrors({ form: "We couldn't reach our CRM. Tap Start the demo again to retry." });
    } catch (err) {
      console.error("[demo] submit threw", err);
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      if (nextAttempts >= 2) {
        setLead(values);
        return;
      }
      setErrors({ form: "Network hiccup. Tap Start the demo again to retry." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="demo-gate">
      <div className="demo-gate__brandstripe" aria-hidden="true" />
      <div className="demo-gate__card" role="dialog" aria-labelledby="demo-gate-title">
        <div className="demo-gate__kicker">
          <span className="demo-gate__pill">LIVE DEMO · VETS26</span>
        </div>
        <h1 id="demo-gate-title" className="demo-gate__title">
          Welcome to GovPreneurs.
        </h1>
        <p className="demo-gate__sub">
          A guided preview of how AI helps small businesses discover, qualify, and win federal
          work. Tell us who you are and we'll open the demo.
        </p>

        <form className="demo-gate__form" onSubmit={onSubmit} noValidate>
          <div className="demo-gate__row">
            <Field label="First name" error={errors.firstName}>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
                maxLength={80}
                required
              />
            </Field>
            <Field label="Last name" error={errors.lastName}>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name"
                maxLength={80}
                required
              />
            </Field>
          </div>

          <Field label="Business name" error={errors.businessName}>
            <input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              autoComplete="organization"
              maxLength={160}
              required
            />
          </Field>

          <Field label="Work email" error={errors.email}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              maxLength={200}
              required
            />
          </Field>

          <Field label="Phone" error={errors.phone}>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              autoComplete="tel"
              inputMode="numeric"
              placeholder="(555) 123-4567"
              required
            />
          </Field>

          {errors.form && <div className="demo-gate__formerror">{errors.form}</div>}

          <button type="submit" className="btn btn-primary demo-gate__submit" disabled={submitting}>
            {submitting ? "Opening demo…" : "Start the demo"}
            {!submitting && <ArrowRight size={14} />}
          </button>
          <div className="demo-gate__legal">
            <ShieldCheck size={11} />
            <span>We'll only use this to follow up after the show.</span>
          </div>
        </form>

        <div className="demo-gate__footer">
          <span className="demo-gate__mono">vets26 · booth demo</span>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`demo-gate__field${error ? " has-error" : ""}`}>
      <span className="demo-gate__label">{label}</span>
      {children}
      {error && <span className="demo-gate__error">{error}</span>}
    </label>
  );
}
