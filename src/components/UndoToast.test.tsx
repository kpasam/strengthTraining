import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UndoToast } from "./UndoToast";

describe("UndoToast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls undo immediately and auto-dismisses after 4 seconds", () => {
    const onUndo = vi.fn();
    const onDismiss = vi.fn();

    render(
      <UndoToast message="Set logged" onUndo={onUndo} onDismiss={onDismiss} />
    );

    fireEvent.click(screen.getByRole("button", { name: "UNDO" }));
    expect(onUndo).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(4000);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
