// DEMO: the member, as Ava reads her. The prototype read lib/mock/currentMember;
// the demo reads the story's persona.

import { PERSONA } from "../story/persona";

export const currentMember = {
  ownerName: PERSONA.ownerName,
  ownerFirstName: PERSONA.ownerFirstName,
  businessName: PERSONA.businessName,
} as const;
