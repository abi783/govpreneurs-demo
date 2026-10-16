export interface TaskProgress {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  completedBy: string | null;
  autoCheckType: string | null;
}

export interface SectionProgress {
  id: string;
  title: string;
  subtitle: string | null;
  sortOrder: number;
  tasks: TaskProgress[];
  completedCount: number;
  totalCount: number;
  percentage: number;
}

export interface GlobalSettings {
  csm1Name: string | null;
  csm1Email: string | null;
  csm1CalLink: string | null;
  csm1CalEmbed: string | null;
  csm1Title: string | null;
  csm1Avatar: string | null;
  csm1Bio: string | null;
  csm2Name: string | null;
  csm2Email: string | null;
  csm2CalLink: string | null;
  csm2CalEmbed: string | null;
  csm2Title: string | null;
  csm2Avatar: string | null;
  csm2Bio: string | null;
  amaLink: string | null;
  amaSchedule: string | null;
  amaTitle: string | null;
  amaDescription: string | null;
  amaPillLabel: string | null;
  affiliateCommission: string | null;
  affiliateDescription: string | null;
  affiliateLink: string | null;
  meetingRecapsDescription: string | null;
  meetingRecapsLink: string | null;
  facebookGroupDescription: string | null;
  facebookGroupLink: string | null;
  successTeamLocationId: string | null;
  socialFacebook: string | null;
  socialTwitter: string | null;
  socialYoutube: string | null;
  socialLinkedin: string | null;
  socialInstagram: string | null;
}

export interface PortalData {
  center: {
    id: string;
    ghlLocationId: string;
    accountName: string;
  };
  globalSettings: GlobalSettings;
  sections: SectionProgress[];
  overallPercentage: number;
  activePlaybook: ActivePlaybook | null;
}

export interface ActivePlaybook {
  id: string;
  assignmentId: string;
  title: string;
  description: string | null;
  /** The mentor's original document, when the plan was imported from one. */
  sourceDocUrl: string | null;
  sourceDocName: string | null;
  currentStepIndex: number;
  stepStatuses: Record<string, string>;
  /** Member-uploaded PDFs per step id (mentor enabled the upload). */
  stepUploads: Record<string, { url: string; name: string; uploadedAt: string }>;
  steps: {
    id: string;
    title: string;
    content: string;
    videoUrl: string | null;
    resourceUrl: string | null;
    /** Mentor-attached PDF shown as a 📎 link on the step. */
    attachmentUrl: string | null;
    attachmentName: string | null;
    /** When true the member sees an "Upload PDF" control on this step. */
    allowMemberUpload: boolean;
    sortOrder: number;
  }[];
}

