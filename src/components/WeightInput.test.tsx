import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { WeightInput } from "./WeightInput";

describe("WeightInput", () => {
  it("increments, decrements, parses input, and toggles units", () => {
    const onChange = vi.fn();
    const onUnitChange = vi.fn();
    Object.defineProperty(window.navigator, "vibrate", {
      configurable: true,
      value: vi.fn(),
    });

    render(
      <WeightInput value={10} unit="lbs" onChange={onChange} onUnitChange={onUnitChange} />
    );

    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[1]);
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "137.5" } });
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "lbs" }));

    expect(onChange).toHaveBeenNthCalledWith(1, 5);
    expect(onChange).toHaveBeenNthCalledWith(2, 15);
    expect(onChange).toHaveBeenNthCalledWith(3, 137.5);
    expect(onChange).toHaveBeenNthCalledWith(4, null);
    expect(onUnitChange).toHaveBeenCalledWith("kg");
    expect(window.navigator.vibrate).toHaveBeenCalledTimes(2);
  });

  it("uses kilogram increments and never goes below zero", () => {
    const onChange = vi.fn();

    render(
      <WeightInput value={1} unit="kg" onChange={onChange} onUnitChange={vi.fn()} />
    );

    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[0]);
    fireEvent.click(buttons[1]);

    expect(onChange).toHaveBeenNthCalledWith(1, 0);
    expect(onChange).toHaveBeenNthCalledWith(2, 3.5);
  });
});
