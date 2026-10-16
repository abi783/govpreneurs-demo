// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { BuyerLaneSwitch } from "./BuyerLaneSwitch";

afterEach(cleanup);

describe("BuyerLaneSwitch", () => {
  it("is a radio group of three lanes with exactly one checked", () => {
    render(<BuyerLaneSwitch lane="federal" onChange={() => {}} />);
    screen.getByRole("radiogroup", { name: "Who is buying?" });
    const radios = screen.getAllByRole("radio");
    expect(radios.map((r) => r.textContent)).toEqual(["All buyers", "Federal", "State and local"]);
    expect(radios.map((r) => r.getAttribute("aria-checked"))).toEqual(["false", "true", "false"]);
    expect(screen.getByRole("radio", { name: "Federal" }).className).toContain("is-on");
  });

  it("reports a new lane, and nothing for the lane already on", () => {
    const onChange = vi.fn();
    render(<BuyerLaneSwitch lane="all" onChange={onChange} />);
    fireEvent.click(screen.getByRole("radio", { name: "State and local" }));
    expect(onChange).toHaveBeenCalledWith("sled");
    fireEvent.click(screen.getByRole("radio", { name: "All buyers" }));
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
