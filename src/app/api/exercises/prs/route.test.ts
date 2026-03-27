import { beforeEach, describe, expect, it, vi } from "vitest";

const cookiesMock = vi.fn();
const dbMock = { select: vi.fn() };
const schemaMock = {
  workoutLogs: {
    exerciseId: "workoutLogs.exerciseId",
    weight: "workoutLogs.weight",
    weightUnit: "workoutLogs.weightUnit",
    reps: "workoutLogs.reps",
    date: "workoutLogs.date",
    variantFlags: "workoutLogs.variantFlags",
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
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    all: vi.fn(() => result),
  };
}

describe("GET /api/exercises/prs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.select.mockReset();
  });

  it("returns 401 when the user is not authenticated", async () => {
    cookiesMock.mockResolvedValue({
      get: vi.fn(() => undefined),
    });

    const { GET } = await import("./route");
    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("aggregates PRs, sessions, and total set counts per exercise", async () => {
    cookiesMock.mockResolvedValue({
      get: vi.fn(() => ({ value: "2" })),
    });
    dbMock.select.mockReturnValueOnce(
      createChain([
        {
          exerciseId: 9,
          canonicalName: "bench press",
          weight: 225,
          weightUnit: "lbs",
          reps: 5,
          date: "2026-03-01",
          variantFlags: "[]",
        },
        {
          exerciseId: 9,
          canonicalName: "bench press",
          weight: 245,
          weightUnit: "lbs",
          reps: 2,
          date: "2026-03-10",
          variantFlags: '["pause"]',
        },
        {
          exerciseId: 9,
          canonicalName: "bench press",
          weight: 235,
          weightUnit: "lbs",
          reps: 3,
          date: "2026-03-10",
          variantFlags: "[]",
        },
        {
          exerciseId: 4,
          canonicalName: "front squat",
          weight: null,
          weightUnit: null,
          reps: 8,
          date: "2026-02-05",
          variantFlags: "[]",
        },
      ])
    );

    const { GET } = await import("./route");
    const response = await GET();

    await expect(response.json()).resolves.toEqual({
      exercises: [
        {
          exerciseId: 9,
          canonicalName: "bench press",
          bestWeight: 245,
          bestWeightUnit: "lbs",
          repsAtBest: 2,
          bestDate: "2026-03-10",
          variantFlags: ["pause"],
          totalSessions: 2,
          totalSets: 3,
        },
        {
          exerciseId: 4,
          canonicalName: "front squat",
          bestWeight: null,
          bestWeightUnit: "lbs",
          repsAtBest: 8,
          bestDate: "2026-02-05",
          variantFlags: [],
          totalSessions: 1,
          totalSets: 1,
        },
      ],
    });
  });
});
