import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const cookiesMock = vi.fn();
const logSetMock = vi.fn();
const deleteLogMock = vi.fn();
const updateLogMock = vi.fn();

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

vi.mock("@/lib/queries/logSet", () => ({
  logSet: logSetMock,
  deleteLog: deleteLogMock,
  updateLog: updateLogMock,
}));

describe("log route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects unauthenticated POST requests", async () => {
    cookiesMock.mockResolvedValue({
      get: vi.fn(() => undefined),
    });

    const { POST } = await import("./route");
    const response = await POST(
      new NextRequest("http://localhost/api/log", {
        method: "POST",
        body: JSON.stringify({}),
      })
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("logs a set with normalized defaults", async () => {
    cookiesMock.mockResolvedValue({
      get: vi.fn(() => ({ value: "3" })),
    });
    logSetMock.mockReturnValue({ id: 9 });

    const { POST } = await import("./route");
    const response = await POST(
      new NextRequest("http://localhost/api/log", {
        method: "POST",
        body: JSON.stringify({
          date: "2026-03-26",
          exerciseId: 11,
          groupLabel: "A",
          setNumber: 2,
        }),
      })
    );

    expect(logSetMock).toHaveBeenCalledWith({
      userId: 3,
      date: "2026-03-26",
      exerciseId: 11,
      variantFlags: [],
      groupLabel: "A",
      setNumber: 2,
      weight: null,
      weightUnit: "lbs",
      reps: null,
      duration: null,
      rpe: null,
      notes: "",
    });
    await expect(response.json()).resolves.toEqual({
      success: true,
      log: { id: 9 },
    });
  });

  it("requires an id for log updates", async () => {
    const { PUT } = await import("./route");
    const response = await PUT(
      new NextRequest("http://localhost/api/log", {
        method: "PUT",
        body: JSON.stringify({ weight: 100 }),
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      success: false,
      error: "Missing ID",
    });
  });

  it("updates and deletes logs", async () => {
    updateLogMock.mockReturnValue({ id: 4, weight: 185 });

    const { PUT, DELETE } = await import("./route");
    const updateResponse = await PUT(
      new NextRequest("http://localhost/api/log", {
        method: "PUT",
        body: JSON.stringify({
          id: 4,
          weight: 185,
          weightUnit: "kg",
          reps: 4,
          duration: "00:20",
          rpe: 8,
          notes: "clean",
        }),
      })
    );

    expect(updateLogMock).toHaveBeenCalledWith(4, {
      weight: 185,
      weightUnit: "kg",
      reps: 4,
      duration: "00:20",
      rpe: 8,
      notes: "clean",
    });
    await expect(updateResponse.json()).resolves.toEqual({
      success: true,
      log: { id: 4, weight: 185 },
    });

    const deleteResponse = await DELETE(
      new NextRequest("http://localhost/api/log", {
        method: "DELETE",
        body: JSON.stringify({ id: 4 }),
      })
    );

    expect(deleteLogMock).toHaveBeenCalledWith(4);
    await expect(deleteResponse.json()).resolves.toEqual({ success: true });
  });
});
