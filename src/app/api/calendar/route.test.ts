import { beforeEach, describe, expect, it, vi } from "vitest";

const cookiesMock = vi.fn();
const dbMock = { select: vi.fn() };
const schemaMock = {
  workoutLogs: {
    date: "workoutLogs.date",
    exerciseId: "workoutLogs.exerciseId",
    groupLabel: "workoutLogs.groupLabel",
    userId: "workoutLogs.userId",
  },
  exercises: {
    id: "exercises.id",
    canonicalName: "exercises.canonicalName",
  },
  workoutCompletions: {
    date: "workoutCompletions.date",
    userId: "workoutCompletions.userId",
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

describe("GET /api/calendar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.select.mockReset();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-26T12:00:00-07:00"));
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

  it("aggregates workout days, completions, and summary counts", async () => {
    cookiesMock.mockResolvedValue({
      get: vi.fn(() => ({ value: "5" })),
    });
    dbMock.select
      .mockReturnValueOnce(
        createChain([
          { date: "2026-03-24", exerciseId: 10, groupLabel: "A", canonicalName: "bench press" },
          { date: "2026-03-24", exerciseId: 10, groupLabel: "A", canonicalName: "bench press" },
          { date: "2026-03-24", exerciseId: 11, groupLabel: "B", canonicalName: "row" },
          { date: "2026-01-10", exerciseId: 12, groupLabel: "A", canonicalName: "squat" },
        ])
      )
      .mockReturnValueOnce(
        createChain([
          { date: "2026-03-25" },
        ])
      );

    const { GET } = await import("./route");
    const response = await GET();

    await expect(response.json()).resolves.toEqual({
      workoutDays: [
        {
          date: "2026-01-10",
          totalSets: 1,
          exercises: ["squat"],
          groups: ["A"],
        },
        {
          date: "2026-03-24",
          totalSets: 3,
          exercises: ["bench press", "row"],
          groups: ["A", "B"],
        },
        {
          date: "2026-03-25",
          totalSets: 0,
          exercises: [],
          groups: [],
        },
      ],
      weekCount: 2,
      yearCount: 3,
    });
  });
});
