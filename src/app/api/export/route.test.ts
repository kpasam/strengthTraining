import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const cookiesMock = vi.fn();
const dbMock = { select: vi.fn() };
const schemaMock = {
  workoutLogs: {
    id: "workoutLogs.id",
    date: "workoutLogs.date",
    groupLabel: "workoutLogs.groupLabel",
    exerciseId: "workoutLogs.exerciseId",
    setNumber: "workoutLogs.setNumber",
    weight: "workoutLogs.weight",
    weightUnit: "workoutLogs.weightUnit",
    reps: "workoutLogs.reps",
    duration: "workoutLogs.duration",
    rpe: "workoutLogs.rpe",
    notes: "workoutLogs.notes",
    variantFlags: "workoutLogs.variantFlags",
    completedAt: "workoutLogs.completedAt",
    userId: "workoutLogs.userId",
  },
  exercises: {
    id: "exercises.id",
    canonicalName: "exercises.canonicalName",
  },
};

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

vi.mock("@/db", () => ({
  db: dbMock,
  schema: schemaMock,
}));

function createChain(result: unknown) {
  return {
    from: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    all: vi.fn(() => result),
  };
}

describe("GET /api/export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.select.mockReset();
  });

  it("returns 401 when the user is not authenticated", async () => {
    cookiesMock.mockResolvedValue({
      get: vi.fn(() => undefined),
    });

    const { GET } = await import("./route");
    const response = await GET(new NextRequest("http://localhost/api/export"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("exports csv rows with escaped values", async () => {
    cookiesMock.mockResolvedValue({
      get: vi.fn(() => ({ value: "9" })),
    });
    dbMock.select.mockReturnValueOnce(
      createChain([
        {
          id: 1,
          date: "2026-03-26",
          groupLabel: "A",
          exerciseName: 'bench "press"',
          setNumber: 1,
          weight: 225,
          weightUnit: "lbs",
          reps: 5,
          duration: "",
          rpe: 8,
          notes: 'felt "great"',
          variantFlags: '["pause"]',
          completedAt: "2026-03-26T10:00:00Z",
        },
      ])
    );

    const { GET } = await import("./route");
    const response = await GET(new NextRequest("http://localhost/api/export?format=csv"));
    const body = await response.text();

    expect(response.headers.get("Content-Type")).toBe("text/csv");
    expect(body).toContain("id,date,groupLabel,exerciseName");
    expect(body).toContain('"bench ""press"""');
    expect(body).toContain('"felt ""great"""');
  });

  it("exports json when requested", async () => {
    cookiesMock.mockResolvedValue({
      get: vi.fn(() => ({ value: "9" })),
    });
    dbMock.select.mockReturnValueOnce(createChain([{ id: 1, date: "2026-03-26" }]));

    const { GET } = await import("./route");
    const response = await GET(new NextRequest("http://localhost/api/export?format=json"));

    expect(response.headers.get("Content-Disposition")).toContain("gym_tracker_export.json");
    await expect(response.json()).resolves.toEqual([{ id: 1, date: "2026-03-26" }]);
  });
});
