import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BottomNav } from "./BottomNav";

const { usePathnameMock } = vi.hoisted(() => ({
  usePathnameMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: usePathnameMock,
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    className,
    children,
  }: {
    href: string;
    className?: string;
    children: unknown;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

describe("BottomNav", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("hides navigation on login, workout, and history routes", () => {
    const hiddenPaths = ["/login", "/workout/A", "/history/4"];

    for (const path of hiddenPaths) {
      usePathnameMock.mockReturnValue(path);
      const { container, unmount } = render(<BottomNav />);
      expect(container).toBeEmptyDOMElement();
      unmount();
    }
  });

  it("shows tabs and marks the active route", () => {
    usePathnameMock.mockReturnValue("/calendar");
    render(<BottomNav />);

    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("Exercises")).toBeInTheDocument();
    expect(screen.getByText("Calendar")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /calendar/i })).toHaveClass("text-[var(--accent-blue)]");
    expect(screen.getByRole("link", { name: /today/i })).toHaveClass("text-[var(--text-secondary)]");
  });
});
