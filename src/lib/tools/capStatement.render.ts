// HTML preview rendering — ported near-verbatim from caps-builder.js's
// renderClassic/renderModern/renderExecutive. Produces an HTML string that is
// injected via dangerouslySetInnerHTML into the scoped .cs-page container,
// which keeps the three templates' layouts pixel-faithful to the original.
import type { CapStmtState, CapStmtTemplate } from "@/lib/tools/capStatement.types";

function escapeHtml(s: string | undefined): string {
  return String(s || "").replace(/[&<>"']/g, (c) => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return map[c];
  });
}

function bulletList(s: string | undefined): string {
  if (!s) return "";
  const items = String(s)
    .split(/\r?\n/)
    .map((l) => l.replace(/^[\s•\-*]+/, "").trim())
    .filter(Boolean);
  if (!items.length) return "";
  return `<ul>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>`;
}

function commaPills(s: string | undefined): string {
  if (!s) return "";
  const items = String(s)
    .split(/\s*,\s*/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (!items.length) return "";
  return `<div class="cs-pill-row">${items.map((i) => `<span class="cs-pill">${escapeHtml(i)}</span>`).join("")}</div>`;
}

function kvRows(rows: (readonly [string, string] | false | "" | undefined)[]): string {
  const filtered = rows.filter(Boolean) as [string, string][];
  if (!filtered.length) return "";
  return `<dl>${filtered.map(([k, v]) => `<dt>${escapeHtml(k)}:</dt><dd>${escapeHtml(v)}</dd>`).join("")}</dl>`;
}

function kvRowsNoColon(rows: (readonly [string, string] | false | "" | undefined)[]): string {
  const filtered = rows.filter(Boolean) as [string, string][];
  if (!filtered.length) return "";
  return `<dl>${filtered.map(([k, v]) => `<dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd>`).join("")}</dl>`;
}

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "");
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [5, 26, 83];
}

export function darken(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  return `rgb(${Math.round(rgb[0] * (1 - amount))},${Math.round(rgb[1] * (1 - amount))},${Math.round(rgb[2] * (1 - amount))})`;
}
export function lighten(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  return `rgb(${Math.round(rgb[0] + (255 - rgb[0]) * amount)},${Math.round(rgb[1] + (255 - rgb[1]) * amount)},${Math.round(rgb[2] + (255 - rgb[2]) * amount)})`;
}

function renderClassic(P: CapStmtState): string {
  const title = (P.legalName || P.dba || "Your Company").toUpperCase();
  const logoHtml = P.logoDataUrl
    ? `<img class="cs-page-logo" src="${P.logoDataUrl}" alt="logo">`
    : "";

  const sections: string[] = [];
  const companyRows = kvRows([
    P.uei && (["UEI", P.uei] as const),
    P.cage && (["CAGE Code", P.cage] as const),
    P.yearInc && (["Year Incorporated", P.yearInc] as const),
    P.stateInc && (["State Incorporated", P.stateInc] as const),
    P.corpType && (["Corporation Type", P.corpType] as const),
    P.dba && (["DBA", P.dba] as const),
    P.naics && (["NAICS Codes", P.naics] as const),
  ]);
  if (companyRows)
    sections.push(`<div class="cs-page-section"><h4>Company Information</h4>${companyRows}</div>`);

  if (P.summary || P.slogan) {
    sections.push(
      `<div class="cs-page-section"><h4>Company Overview</h4>${
        P.slogan ? `<div class="pull">"${escapeHtml(P.slogan)}"</div>` : ""
      }${P.summary ? `<p>${escapeHtml(P.summary)}</p>` : ""}</div>`,
    );
  }
  if (P.competencies)
    sections.push(
      `<div class="cs-page-section"><h4>Core Competencies</h4>${bulletList(P.competencies)}</div>`,
    );
  if (P.differentiators)
    sections.push(
      `<div class="cs-page-section"><h4>Differentiators</h4>${bulletList(P.differentiators)}</div>`,
    );

  const certRows = kvRows([
    P.fedCerts && (["Federal SB Certifications", P.fedCerts] as const),
    P.stateCerts && (["State Certifications", P.stateCerts] as const),
    P.vehicles && (["Contract Vehicles", P.vehicles] as const),
    P.clearances && (["Clearances", P.clearances] as const),
  ]);
  if (certRows)
    sections.push(
      `<div class="cs-page-section"><h4>Certifications &amp; Clearances</h4>${certRows}</div>`,
    );

  const clientRows = kvRows([
    P.clients && (["Major Clients", P.clients] as const),
    P.localAgencies && (["Agencies Served", P.localAgencies] as const),
    P.partners && (["Partners", P.partners] as const),
  ]);
  if (clientRows)
    sections.push(`<div class="cs-page-section"><h4>Past Performance</h4>${clientRows}</div>`);

  const contactRows = kvRows([
    P.contactName && (["Contact", P.contactName] as const),
    P.contactPhone && (["Phone", P.contactPhone] as const),
    P.contactEmail && (["Email", P.contactEmail] as const),
    P.contactWebsite && (["Web", P.contactWebsite] as const),
    P.contactAddress && (["Address", P.contactAddress] as const),
  ]);
  if (contactRows)
    sections.push(`<div class="cs-page-section"><h4>Contact Information</h4>${contactRows}</div>`);

  return (
    `<div class="cs-page-hero">${logoHtml}<h3>${escapeHtml(title)}</h3><div class="sub">CAPABILITY STATEMENT</div></div>` +
    `<div class="cs-page-stripe"></div>` +
    `<div class="cs-page-body">${sections.join("")}</div>` +
    `<div class="cs-page-foot-stripe"></div>` +
    `<div class="cs-page-foot">${escapeHtml([P.contactPhone, P.contactEmail, P.contactWebsite].filter(Boolean).join("   ·   "))}</div>`
  );
}

function renderModern(P: CapStmtState): string {
  const name = P.legalName || P.dba || "Your Company";
  const logoHtml = P.logoDataUrl ? `<img src="${P.logoDataUrl}" alt="logo">` : "";

  const sideSections: string[] = [];
  sideSections.push(
    `<div class="cs-side-brand">${logoHtml}<div class="name">${escapeHtml(name)}</div>${
      P.slogan ? `<div class="slogan">${escapeHtml(P.slogan)}</div>` : ""
    }</div>`,
  );
  const companyRows = kvRowsNoColon([
    P.uei && (["UEI", P.uei] as const),
    P.cage && (["CAGE", P.cage] as const),
    P.yearInc && (["Founded", P.yearInc] as const),
    P.stateInc && (["State", P.stateInc] as const),
    P.corpType && (["Type", P.corpType] as const),
    P.dba && (["DBA", P.dba] as const),
  ]);
  if (companyRows)
    sideSections.push(`<div class="cs-side-section"><h5>Company</h5>${companyRows}</div>`);
  if (P.fedCerts)
    sideSections.push(
      `<div class="cs-side-section"><h5>Certifications</h5><p>${escapeHtml(P.fedCerts)}</p></div>`,
    );
  if (P.naics)
    sideSections.push(
      `<div class="cs-side-section"><h5>NAICS</h5><p>${escapeHtml(P.naics)}</p></div>`,
    );
  const contactRows = kvRowsNoColon([
    P.contactPhone && (["Phone", P.contactPhone] as const),
    P.contactEmail && (["Email", P.contactEmail] as const),
    P.contactWebsite && (["Web", P.contactWebsite] as const),
    P.contactAddress && (["Address", P.contactAddress] as const),
  ]);
  if (contactRows)
    sideSections.push(`<div class="cs-side-section"><h5>Contact</h5>${contactRows}</div>`);

  const mainSections: string[] = [];
  mainSections.push(
    `<div class="cs-main-head"><div class="kicker">Capability Statement</div><h3>${escapeHtml(name)}</h3></div>`,
  );
  if (P.summary)
    mainSections.push(
      `<div class="cs-main-section"><h4>Overview</h4><p>${escapeHtml(P.summary)}</p></div>`,
    );
  if (P.competencies)
    mainSections.push(
      `<div class="cs-main-section"><h4>Core Competencies</h4>${bulletList(P.competencies)}</div>`,
    );
  if (P.differentiators)
    mainSections.push(
      `<div class="cs-main-section"><h4>Differentiators</h4>${bulletList(P.differentiators)}</div>`,
    );
  if (P.vehicles)
    mainSections.push(
      `<div class="cs-main-section"><h4>Contract Vehicles</h4>${commaPills(P.vehicles)}</div>`,
    );
  if (P.clients || P.localAgencies || P.partners) {
    mainSections.push(
      `<div class="cs-main-section"><h4>Past Performance</h4>${
        P.clients ? `<p><strong>Clients:</strong> ${escapeHtml(P.clients)}</p>` : ""
      }${P.localAgencies ? `<p><strong>Agencies:</strong> ${escapeHtml(P.localAgencies)}</p>` : ""}${
        P.partners ? `<p><strong>Partners:</strong> ${escapeHtml(P.partners)}</p>` : ""
      }</div>`,
    );
  }
  if (P.clearances)
    mainSections.push(
      `<div class="cs-main-section"><h4>Clearances</h4><p>${escapeHtml(P.clearances)}</p></div>`,
    );

  return `<div class="cs-page-side">${sideSections.join("")}</div><div class="cs-page-main">${mainSections.join("")}</div>`;
}

function renderExecutive(P: CapStmtState): string {
  const title = P.legalName || P.dba || "Your Company";
  const logoHtml = P.logoDataUrl
    ? `<img class="cs-page-logo" src="${P.logoDataUrl}" alt="logo">`
    : "";

  const sections: string[] = [];
  const companyRows = kvRowsNoColon([
    P.uei && (["UEI", P.uei] as const),
    P.cage && (["CAGE", P.cage] as const),
    P.yearInc && (["Founded", P.yearInc] as const),
    P.stateInc && (["State", P.stateInc] as const),
    P.corpType && (["Type", P.corpType] as const),
    P.naics && (["NAICS", P.naics] as const),
  ]);
  if (companyRows)
    sections.push(`<div class="cs-page-section"><h4>Company Information</h4>${companyRows}</div>`);
  if (P.summary || P.slogan) {
    sections.push(
      `<div class="cs-page-section"><h4>Company Overview</h4>${
        P.slogan ? `<div class="pull">${escapeHtml(P.slogan)}</div>` : ""
      }${P.summary ? `<p>${escapeHtml(P.summary)}</p>` : ""}</div>`,
    );
  }
  if (P.competencies)
    sections.push(
      `<div class="cs-page-section"><h4>Core Competencies</h4>${bulletList(P.competencies)}</div>`,
    );
  if (P.differentiators)
    sections.push(
      `<div class="cs-page-section"><h4>Differentiators</h4>${bulletList(P.differentiators)}</div>`,
    );
  const certRows = kvRowsNoColon([
    P.fedCerts && (["Federal", P.fedCerts] as const),
    P.stateCerts && (["State", P.stateCerts] as const),
    P.vehicles && (["Vehicles", P.vehicles] as const),
    P.clearances && (["Cleared", P.clearances] as const),
  ]);
  if (certRows)
    sections.push(
      `<div class="cs-page-section"><h4>Certifications &amp; Clearances</h4>${certRows}</div>`,
    );
  const clientRows = kvRowsNoColon([
    P.clients && (["Clients", P.clients] as const),
    P.localAgencies && (["Agencies", P.localAgencies] as const),
    P.partners && (["Partners", P.partners] as const),
  ]);
  if (clientRows)
    sections.push(`<div class="cs-page-section"><h4>Past Performance</h4>${clientRows}</div>`);

  return (
    `<div class="cs-page-hero">${logoHtml}<h3>${escapeHtml(title)}</h3><div class="sub">CAPABILITY STATEMENT</div></div>` +
    `<div class="cs-page-stripe"></div>` +
    `<div class="cs-page-body">${sections.join("")}</div>` +
    `<div class="cs-page-foot">${escapeHtml([P.contactPhone, P.contactEmail, P.contactWebsite].filter(Boolean).join("   ·   "))}</div>`
  );
}

export interface RenderedPreview {
  html: string;
  primary: string;
  secondary: string;
  primaryDark: string;
  primaryLight: string;
}

export function renderTemplate(P: CapStmtState, tpl: CapStmtTemplate): RenderedPreview {
  const primary = P.primaryColor || "#051A53";
  const secondary = P.secondaryColor || (tpl === "executive" ? "#c8a96b" : "#f59e0b");
  const html =
    tpl === "classic" ? renderClassic(P) : tpl === "modern" ? renderModern(P) : renderExecutive(P);
  return {
    html,
    primary,
    secondary,
    primaryDark: darken(primary, 0.35),
    primaryLight: lighten(primary, 0.45),
  };
}
