// @vitest-environment jsdom
import { useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { FilterPanel, RangeField } from "./FilterPanel";
import { ANY_RANGE } from "../../lib/filters/range";

Element.prototype.scrollTo = () => {};
afterEach(cleanup);

const range = (value = ANY_RANGE) => (
  <RangeField
    label="Size"
    kind="money"
    value={value}
    onChange={() => {}}
    presets={[]}
    minLabel="From"
    maxLabel="To"
    sayPrefix="Between"
  />
);

describe("RangeField read-back", () => {
  it("is not shown when no range is set", () => {
    render(range());
    expect(screen.queryByText(/No limit/)).toBeNull();
  });
});

function Harness() {
  const [open, setOpen] = useState(false);
  const [n, setN] = useState(0);
  return (
    <div>
      <button onClick={() => setOpen(true)}>Filters</button>
      <button onClick={() => setN(n + 1)}>rerender {n}</button>
      {/* a new onClose every render, as the pages do */}
      <FilterPanel
        open={open}
        onClose={() => setOpen(false)}
        kicker="k"
        title="t"
        subtitle="s"
        sections={[{ id: "a", label: "A", count: 0 }]}
        active="a"
        onSection={() => {}}
        chips={[]}
        onRemoveChip={() => {}}
        onClearAll={() => {}}
        applyLabel="Show"
        variant="centered"
      >
        <input aria-label="inside" />
      </FilterPanel>
    </div>
  );
}

describe("FilterPanel Escape", () => {
  it("closes from a text input and returns focus to the trigger", () => {
    render(<Harness />);
    const trigger = screen.getByRole("button", { name: "Filters" });
    trigger.focus();
    fireEvent.click(trigger);
    const input = screen.getByLabelText("inside");
    input.focus();
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.getByRole("dialog", { hidden: true }).className).toContain("is-hidden");
    expect(document.activeElement).toBe(trigger);
  });

  it("does not pull focus back to Close when the page re-renders", () => {
    render(<Harness />);
    const trigger = screen.getByRole("button", { name: "Filters" });
    fireEvent.click(trigger);
    const input = screen.getByLabelText("inside");
    input.focus();
    fireEvent.click(screen.getByRole("button", { name: /rerender/, hidden: true }));
    expect(document.activeElement).toBe(input);
  });
});
