// Deep routes of Small Orders. Owned by the small-orders sub-task of the explore area.
export const ROUTES: string[] = [
  // The three tabs of the board.
  "/small-orders?view=all",
  "/small-orders?view=saved",
  // Orders open to Amira: priced, new, amended, pending, set-aside, past price.
  "/small-orders/mp-101",
  "/small-orders/mp-103",
  "/small-orders/mp-109",
  "/small-orders/mp-111",
  "/small-orders/mp-112",
  "/small-orders/mp-114",
  // Ones not open to her, and each order behind a reason group.
  "/small-orders/restricted",
  "/small-orders/mp-121",
  "/small-orders/mp-123",
  "/small-orders/mp-125",
  "/small-orders/mp-126",
];
