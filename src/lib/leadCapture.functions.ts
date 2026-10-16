// HighLevel Private Integration Token — client-side for demo/lead capture.
const HIGHLEVEL_PIT = "pit-88639f86-97c6-42b1-a11f-ffbf863c3fc1";
const HIGHLEVEL_LOCATION_ID = "rEcdYyuzHN5a3S0PlbRj";
const HIGHLEVEL_URL = "https://services.leadconnectorhq.com/contacts/";

export interface LeadInput {
  firstName: string;
  lastName: string;
  businessName: string;
  email: string;
  phone: string; // raw user input, server normalizes to E.164
}

function normalizePhone(raw: string): string {
  const digits = (raw || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

function validate(input: LeadInput): LeadInput {
  const firstName = (input.firstName || "").trim();
  const lastName = (input.lastName || "").trim();
  const businessName = (input.businessName || "").trim();
  const email = (input.email || "").trim().toLowerCase();
  const phone = (input.phone || "").trim();
  if (!firstName || firstName.length > 80) throw new Error("First name is required.");
  if (!lastName || lastName.length > 80) throw new Error("Last name is required.");
  if (!businessName || businessName.length > 160) throw new Error("Business name is required.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) throw new Error("Valid email is required.");
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) throw new Error("Valid phone is required.");
  return { firstName, lastName, businessName, email, phone };
}

export async function submitLead(data: LeadInput): Promise<
  | { ok: true; duplicate: boolean }
  | { ok: false; status: number; error: string }
> {
  const validated = validate(data);
  const body = {
    firstName: validated.firstName,
    lastName: validated.lastName,
    name: `${validated.firstName} ${validated.lastName}`,
    email: validated.email,
    phone: normalizePhone(validated.phone),
    companyName: validated.businessName,
    locationId: HIGHLEVEL_LOCATION_ID,
    source: "VETS26 Booth Demo",
    tags: ["vets26", "booth-demo"],
  };

  try {
    const res = await fetch(HIGHLEVEL_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${HIGHLEVEL_PIT}`,
        Version: "2021-07-28",
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    let parsed: unknown = null;
    try { parsed = text ? JSON.parse(text) : null; } catch { /* keep text */ }

    if (!res.ok) {
      // Duplicate contact is acceptable — booth visitor may have signed up before.
      const isDuplicate = res.status === 400 && /duplicate|already exists/i.test(text);
      if (isDuplicate) {
        return { ok: true, duplicate: true } as const;
      }
      console.error("HighLevel lead capture failed", res.status, text);
      return { ok: false, status: res.status, error: (parsed as { message?: string })?.message || text || "HighLevel request failed" } as const;
    }

    return { ok: true, duplicate: false } as const;
  } catch (err) {
    console.error("HighLevel lead capture threw", err);
    return { ok: false, status: 0, error: err instanceof Error ? err.message : "Network error" } as const;
  }
}
