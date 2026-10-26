// DEMO: the GovPreneurs staff member on the Success Center home's first card
// (production calls the slot "Program Specialist"). She is real: name, photo and
// bio are copied from the production Success Center (26 Oct 2026). Her title is
// "Compliance Mentor", as Karthik asked.

export const PROGRAM_SPECIALIST = {
  name: "Maryam Abd",
  title: "Compliance Mentor",
  avatarUrl: "/demo/people/maryam-abd.jpg",
  bio: "Expert in guiding small businesses through the complexities of government procurement, ensuring regulatory compliance to unlock federal market opportunities.",
} as const;

/**
 * DEMO: every "Book a call" in the demo books the sales advisor, not the mentor
 * (feedback, 25 Oct 2026). The name is made up on purpose: the real salesperson
 * stays off the public demo, with no photo.
 */
export const SALES_ADVISOR = {
  name: "Eric Hale",
  title: "GovPreneurs advisor",
} as const;
