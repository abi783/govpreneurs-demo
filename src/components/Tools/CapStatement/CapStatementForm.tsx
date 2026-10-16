import { useRef } from "react";
import { ArrowLeft, ArrowRight, FileText, Info, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { CapStmtState, CapStmtStep } from "@/lib/tools/capStatement.types";
import { CAPSTMT_STEPS } from "@/lib/tools/capStatement.types";

interface TextField {
  key: keyof CapStmtState;
  label: string;
  tip: string;
  placeholder: string;
  maxLength?: number;
  type?: "text" | "number" | "tel" | "email";
  textarea?: boolean;
  counter?: boolean;
  full?: boolean;
}

const STEP_LABELS: Record<CapStmtStep, string> = {
  company: "Company Info",
  branding: "Branding",
  competencies: "Competencies",
  certifications: "Certifications",
  contact: "Contact",
};

const COMPANY_FIELDS: TextField[] = [
  {
    key: "legalName",
    label: "Registered Company Name",
    tip: "The exact legal name as registered with your state and SAM.gov.",
    placeholder: "Your registered business name",
    maxLength: 120,
  },
  {
    key: "dba",
    label: "DBA (if any)",
    tip: "Doing Business As — the trade name your business uses publicly if different from the legal name.",
    placeholder: "Trade name (if different from legal name)",
    maxLength: 120,
  },
  {
    key: "yearInc",
    label: "Year of Incorporation",
    tip: "The year your business was legally formed.",
    placeholder: "Year your business was formed",
    type: "number",
  },
  {
    key: "stateInc",
    label: "State of Incorporation",
    tip: "The US state where your business was legally formed.",
    placeholder: "U.S. state where the business is registered",
    maxLength: 60,
  },
  {
    key: "corpType",
    label: "Corporation Type",
    tip: "Legal structure — LLC, C-Corp, S-Corp, Sole Proprietorship, etc.",
    placeholder: "LLC, S-Corp, C-Corp, Sole Proprietor…",
    maxLength: 40,
  },
  {
    key: "uei",
    label: "UEI Number",
    tip: "Unique Entity ID — a 12-character ID assigned by SAM.gov. Replaced the old DUNS number.",
    placeholder: "12-character ID issued by SAM.gov",
    maxLength: 12,
  },
  {
    key: "cage",
    label: "CAGE Code",
    tip: "Commercial and Government Entity Code — 5-character ID assigned by the Defense Logistics Agency.",
    placeholder: "5-character CAGE code",
    maxLength: 5,
    full: true,
  },
];

const COMPETENCIES_FIELDS: TextField[] = [
  {
    key: "competencies",
    label: "Core Competencies",
    tip: "One per line. The services or capabilities you deliver.",
    placeholder: "List each on a new line — the core services or capabilities you deliver",
    maxLength: 1500,
    textarea: true,
    counter: true,
  },
  {
    key: "differentiators",
    label: "Differentiators",
    tip: "One per line. What sets you apart from competitors — past performance, certifications, response times, proprietary tech.",
    placeholder:
      "List each on a new line — what sets you apart (past performance, certifications, response times, in-house expertise, geographic reach…)",
    maxLength: 1500,
    textarea: true,
    counter: true,
  },
];

const CERTIFICATION_FIELDS: TextField[] = [
  {
    key: "fedCerts",
    label: "Federal Small Business Certifications",
    tip: "SBA programs you're certified under: 8(a), HUBZone, WOSB, EDWOSB, SDVOSB, VOSB.",
    placeholder: "e.g., 8(a) Certified, WOSB",
    maxLength: 500,
    counter: true,
  },
  {
    key: "vehicles",
    label: "Contract Vehicles (Federal and State)",
    tip: "GSA Schedules, IDIQs, BPAs, and other pre-negotiated contract vehicles you hold.",
    placeholder: "Pre-negotiated contracts you hold — GSA Schedules, IDIQs, BPAs",
    maxLength: 500,
    counter: true,
  },
  {
    key: "stateCerts",
    label: "State Certifications",
    tip: "State-level small/minority/woman/veteran business certifications.",
    placeholder: "e.g., California Small Business (SB), New York MWBE",
    maxLength: 500,
    counter: true,
  },
  {
    key: "localAgencies",
    label: "Local, Quasi, and Non-Government Agencies Served",
    tip: "City, county, and quasi-government agencies you've worked with.",
    placeholder: "Local, county, or quasi-government agencies you've worked with",
    maxLength: 500,
    counter: true,
  },
  {
    key: "clients",
    label: "Major Clients (Commercial and Government)",
    tip: "Notable past performance — agencies and commercial clients you've delivered for.",
    placeholder: "Notable government or commercial clients you've delivered for",
    maxLength: 500,
    counter: true,
  },
  {
    key: "naics",
    label: "NAICS Codes (Optional)",
    tip: "6-digit NAICS codes that match your services. Find yours at census.gov/naics.",
    placeholder: "e.g., 541511, 541512, 518210 (optional — 6-digit codes separated by commas)",
    maxLength: 200,
    counter: true,
  },
  {
    key: "partners",
    label: "Partners and Authorized Resellers",
    tip: "Vendor partnerships, reseller agreements, or strategic alliances.",
    placeholder: "Vendor partnerships, reseller relationships, or strategic alliances",
    maxLength: 500,
    counter: true,
  },
  {
    key: "clearances",
    label: "Staff Clearances and Certifications",
    tip: "Security clearances and professional certifications your team holds.",
    placeholder: "Active clearances and professional certifications held by your team",
    maxLength: 500,
    counter: true,
  },
];

const CONTACT_FIELDS: TextField[] = [
  {
    key: "contactName",
    label: "Contact Person's Name",
    tip: "Primary point of contact for procurement inquiries.",
    placeholder: "Primary point of contact",
    maxLength: 50,
    counter: true,
  },
  {
    key: "contactPhone",
    label: "Phone Number",
    tip: "Direct business phone line.",
    placeholder: "e.g., (555) 123-4567",
    maxLength: 30,
    type: "tel",
  },
  {
    key: "contactEmail",
    label: "Email Address",
    tip: "Business email. Avoid personal Gmail/Yahoo when possible — buyers prefer domain emails.",
    placeholder: "Business email address",
    maxLength: 100,
    type: "email",
    counter: true,
  },
  {
    key: "contactWebsite",
    label: "Website",
    tip: "Your business website. Buyers visit this to vet you.",
    placeholder: "yourbusiness.com",
    maxLength: 120,
  },
  {
    key: "contactAddress",
    label: "Business Address",
    tip: "Physical business address — must match SAM.gov registration.",
    placeholder: "Street, city, state, ZIP — must match SAM.gov registration",
    maxLength: 200,
    full: true,
  },
];

function Field({
  field,
  value,
  onChange,
}: {
  field: TextField;
  value: string;
  onChange: (v: string) => void;
}) {
  const count = value.length;
  const max = field.maxLength ?? 0;
  const warn = max > 0 && count > max * 0.85 && count <= max;
  const over = max > 0 && count > max;
  return (
    <div className={`cs-field${field.full ? " cs-full" : ""}`}>
      <label className="cs-label">
        {field.label}
        <span className="cs-info" data-tip={field.tip}>
          <Info size={11} aria-hidden />
        </span>
      </label>
      {field.textarea ? (
        <textarea
          className="cs-textarea cs-big"
          value={value}
          maxLength={field.maxLength}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          type={field.type ?? "text"}
          className="cs-input"
          value={value}
          maxLength={field.maxLength}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {field.counter && field.maxLength && (
        <div className={`cs-counter${warn ? " warn" : ""}${over ? " over" : ""}`}>
          {count}/{field.maxLength}
        </div>
      )}
    </div>
  );
}

interface CapStatementFormProps {
  state: CapStmtState;
  onChange: (patch: Partial<CapStmtState>) => void;
  onLogoUpload: (file: File) => void;
  onReset: () => void;
  step: number;
  onStepChange: (i: number) => void;
  onGenerate: () => void;
}

export function CapStatementForm({
  state,
  onChange,
  onLogoUpload,
  onReset,
  step,
  onStepChange,
  onGenerate,
}: CapStatementFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentKey = CAPSTMT_STEPS[step];

  const renderFields = (fields: TextField[]) =>
    fields.map((f) => (
      <Field
        key={f.key}
        field={f}
        value={state[f.key]}
        onChange={(v) => onChange({ [f.key]: v })}
      />
    ));

  return (
    <div className="cs-card">
      <div
        className="cs-head"
        style={{ display: "flex", justifyContent: "flex-end", marginBottom: "var(--s-3)" }}
      >
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          style={{ color: "var(--urg-7)", borderColor: "var(--urg-3)", whiteSpace: "nowrap" }}
          onClick={onReset}
        >
          <Trash2 size={14} aria-hidden /> Reset Form
        </button>
      </div>

      <div className="cs-steps">
        {CAPSTMT_STEPS.map((s, i) => (
          <button
            key={s}
            type="button"
            className={`cs-step${i === step ? " active" : ""}`}
            onClick={() => onStepChange(i)}
          >
            {STEP_LABELS[s]}
          </button>
        ))}
      </div>

      {currentKey === "company" && (
        <div className="cs-step-pane">
          <div className="cs-grid">{renderFields(COMPANY_FIELDS)}</div>
          <div className="cs-nav">
            <Button variant="primary" onClick={() => onStepChange(step + 1)}>
              Next <ArrowRight size={16} aria-hidden />
            </Button>
          </div>
        </div>
      )}

      {currentKey === "branding" && (
        <div className="cs-step-pane">
          <div className="cs-grid">
            <div className="cs-field cs-full">
              <label className="cs-label">
                Company Branding or Slogan
                <span
                  className="cs-info"
                  data-tip="A short tagline or slogan that captures your brand identity."
                >
                  <Info size={11} aria-hidden />
                </span>
              </label>
              <input
                type="text"
                className="cs-input"
                value={state.slogan}
                maxLength={200}
                placeholder="A short tagline or value statement"
                onChange={(e) => onChange({ slogan: e.target.value })}
              />
              <div className="cs-counter">{state.slogan.length}/200</div>
            </div>
            <div className="cs-field cs-full">
              <label className="cs-label">
                Summary Description of the Company
                <span
                  className="cs-info"
                  data-tip="2-3 sentences describing what your company does, who it serves, and key strengths."
                >
                  <Info size={11} aria-hidden />
                </span>
              </label>
              <textarea
                className="cs-textarea cs-big"
                value={state.summary}
                maxLength={1000}
                placeholder="Two or three sentences on what your business does, who it serves, and what makes it credible to government buyers."
                onChange={(e) => onChange({ summary: e.target.value })}
              />
              <div className="cs-counter">{state.summary.length}/1000</div>
            </div>
            <div className="cs-field">
              <label className="cs-label">
                Upload Company Logo
                <span
                  className="cs-info"
                  data-tip="PNG or JPG. Shown in the top-right of the PDF header."
                >
                  <Info size={11} aria-hidden />
                </span>
              </label>
              <label className={`cs-file${state.logoName ? " has-file" : ""}`}>
                <Upload size={18} aria-hidden />
                <span>{state.logoName || "Choose File · No file chosen"}</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onLogoUpload(f);
                  }}
                />
              </label>
            </div>
            <div className="cs-field">
              <label className="cs-label">
                Primary Color
                <span
                  className="cs-info"
                  data-tip="Main brand color — used in the PDF header and accents."
                >
                  <Info size={11} aria-hidden />
                </span>
              </label>
              <div className="cs-color-row">
                <div className="cs-color-swatch" style={{ background: state.primaryColor }}>
                  <input
                    type="color"
                    value={state.primaryColor}
                    onChange={(e) => onChange({ primaryColor: e.target.value })}
                  />
                </div>
                <span className="cs-color-hex">{state.primaryColor.toUpperCase()}</span>
              </div>
            </div>
            <div className="cs-field">
              <label className="cs-label">
                Secondary Color
                <span
                  className="cs-info"
                  data-tip="Accent color — used for the stripe under the header and bullets."
                >
                  <Info size={11} aria-hidden />
                </span>
              </label>
              <div className="cs-color-row">
                <div className="cs-color-swatch" style={{ background: state.secondaryColor }}>
                  <input
                    type="color"
                    value={state.secondaryColor}
                    onChange={(e) => onChange({ secondaryColor: e.target.value })}
                  />
                </div>
                <span className="cs-color-hex">{state.secondaryColor.toUpperCase()}</span>
              </div>
            </div>
          </div>
          <div className="cs-nav">
            <Button variant="secondary" onClick={() => onStepChange(step - 1)}>
              <ArrowLeft size={16} aria-hidden /> Prev
            </Button>
            <Button variant="primary" onClick={() => onStepChange(step + 1)}>
              Next <ArrowRight size={16} aria-hidden />
            </Button>
          </div>
        </div>
      )}

      {currentKey === "competencies" && (
        <div className="cs-step-pane">
          <div className="cs-grid cs-full">{renderFields(COMPETENCIES_FIELDS)}</div>
          <div className="cs-nav">
            <Button variant="secondary" onClick={() => onStepChange(step - 1)}>
              <ArrowLeft size={16} aria-hidden /> Prev
            </Button>
            <Button variant="primary" onClick={() => onStepChange(step + 1)}>
              Next <ArrowRight size={16} aria-hidden />
            </Button>
          </div>
        </div>
      )}

      {currentKey === "certifications" && (
        <div className="cs-step-pane">
          <div className="cs-grid cs-full">{renderFields(CERTIFICATION_FIELDS)}</div>
          <div className="cs-nav">
            <Button variant="secondary" onClick={() => onStepChange(step - 1)}>
              <ArrowLeft size={16} aria-hidden /> Prev
            </Button>
            <Button variant="primary" onClick={() => onStepChange(step + 1)}>
              Next <ArrowRight size={16} aria-hidden />
            </Button>
          </div>
        </div>
      )}

      {currentKey === "contact" && (
        <div className="cs-step-pane">
          <div className="cs-grid cs-full">{renderFields(CONTACT_FIELDS)}</div>
          <div className="cs-nav">
            <Button variant="secondary" onClick={() => onStepChange(step - 1)}>
              <ArrowLeft size={16} aria-hidden /> Prev
            </Button>
            <Button variant="brand" onClick={onGenerate}>
              <FileText size={16} aria-hidden /> Generate Capability Statement
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
