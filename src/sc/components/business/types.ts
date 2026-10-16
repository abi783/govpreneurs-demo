/** Client-side shapes returned by GET /api/portal/[locationId]/business-profile. */

export interface ApiProvenance {
  type: string;
  sourceLabel: string | null;
  locator: string | null;
  quote: string | null;
  excerpt: { before?: string; span: string; after?: string } | null;
  retrievedAt: string | null;
  conversation: {
    channel?: string;
    title?: string;
    occurred_at?: string;
    turns?: Array<{ id: string; speaker: string; role: string; at?: string; text: string }>;
    cited_turn_id?: string;
    attested?: boolean;
    learning?: string;
    learning_by?: string;
  } | null;
  unavailable: { reason?: string; used_in_analysis?: boolean } | null;
}

export interface ApiField {
  fieldKey: string;
  value: unknown;
  state: string;
  origin: string;
  freshnessLabel: string;
  errorMessage?: string | null;
  provenance: ApiProvenance | null;
}

export interface ProfileResponse {
  fields: ApiField[];
  counter: { answered: number; total: number };
  onboarding: {
    cohort: string;
    callAt: string | null;
    mentorName: string | null;
    llcUploadedAt: string | null;
    profileDueAt: string | null;
  };
  /** Live SuccessCenter columns — shared with the portal home's cards. */
  media: { photoUrl: string | null; logoUrl: string | null };
}
