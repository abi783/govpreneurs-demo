// @vitest-environment jsdom
//
// The opportunities page holds contracts only: forecasts, small orders (DIBBS)
// and grants are not on it. So the filters menu has no "Opportunity type"
// section at all.
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { AdvancedFiltersPanel } from "./AdvancedFiltersPanel";
import { emptyFilters } from "../../lib/opportunityFilters";

afterEach(cleanup);

describe("AdvancedFiltersPanel — no opportunity type", () => {
  it("has no Opportunity type section and no type options", () => {
    render(<AdvancedFiltersPanel filters={emptyFilters()} onChange={vi.fn()} opps={[]} />);

    expect(screen.queryByText(/Opportunity type/i)).toBeNull();
    for (const name of [/^Contracts/, /^Grants/, /Forecasts/, /Product Buys/]) {
      expect(screen.queryByRole("option", { name })).toBeNull();
    }
    // The menu still renders its other sections.
    expect(screen.getAllByRole("option").length).toBeGreaterThan(0);
  });
});
