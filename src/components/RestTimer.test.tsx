import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RestTimer } from "./RestTimer";

describe("RestTimer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing when not running", () => {
    const { container } = render(<RestTimer running={false} onDismiss={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("counts down to completion and can be dismissed", () => {
    const onDismiss = vi.fn();
    render(<RestTimer running={true} onDismiss={onDismiss} initialSeconds={2} />);

    expect(screen.getByText("0:02")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText("0:01")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(screen.getByText("GO!")).toBeInTheDocument();
    expect(screen.getByText("Ready!")).toBeInTheDocument();

    fireEvent.click(screen.getByText("GO!"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
