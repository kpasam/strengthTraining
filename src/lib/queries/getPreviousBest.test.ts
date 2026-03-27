import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMock = {
  select: vi.fn(),
};

const schemaMock = {
  workoutLogs: {
    userId: "workoutLogs.userId",
    exerciseId: "workoutLogs.exerciseId",
    reps: "workoutLogs.reps",
    date: "workoutLogs.date",
    completedAt: "workoutLogs.completedAt",
    weight: "workoutLogs.weight",
    weightUnit: "workoutLogs.weightUnit",
  },
};

vi.mock("@/db", () => ({
  db: dbMock,
  schema: schemaMock,
}));

function createChain(result: unknown, terminal: "get" | "all" = "get") {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    get: terminal === "get" ? vi.fn(() => result) : vi.fn(),
    all: terminal === "all" ? vi.fn(() => result) : vi.fn(),
  };
}

describe("getPreviousBest helpers", () => {
  beforeEach(() => {
    dbMock.select.mockReset();
  });

  it("parses the latest previous best and falls back to lbs when needed", async () => {
    dbMock.select.mockReturnValueOnce(
      createChain({
        weight: 315,
        weightUnit: null,
        reps: 3,
        date: "2026-03-20",
        variantFlags: '["pause"]',
        notes: null,
      })
    );

    const { getPreviousBest } = await import("./getPreviousBest");
    expect(getPreviousBest(1, 10, "2026-03-26")).toEqual({
      weight: 315,
      weightUnit: "lbs",
      reps: 3,
      date: "2026-03-20",
      variantFlags: ["pause"],
      notes: "",
    });
  });

  it("returns null when no best exists for the requested reps", async () => {
    dbMock.select.mockReturnValueOnce(createChain(undefined));

    const { getBestForReps } = await import("./getPreviousBest");
    expect(getBestForReps(1, 10, 5)).toBeNull();
  });

  it("deduplicates rep counts when collecting rep-specific bests", async () => {
    dbMock.select
      .mockReturnValueOnce(
        createChain({
          weight: 225,
          weightUnit: "lbs",
          reps: 5,
          date: "2026-03-01",
          variantFlags: "[]",
          notes: "",
        })
      )
      .mockReturnValueOnce(
        createChain({
          weight: 255,
          weightUnit: "lbs",
          reps: 3,
          date: "2026-03-15",
          variantFlags: '["tempo"]',
          notes: "smooth",
        })
      );

    const { getBestsForRepCounts } = await import("./getPreviousBest");
    expect(getBestsForRepCounts(1, 10, [5, 3, 5])).toEqual({
      3: {
        weight: 255,
        weightUnit: "lbs",
        reps: 3,
        date: "2026-03-15",
        variantFlags: ["tempo"],
        notes: "smooth",
      },
      5: {
        weight: 225,
        weightUnit: "lbs",
        reps: 5,
        date: "2026-03-01",
        variantFlags: [],
        notes: "",
      },
    });
    expect(dbMock.select).toHaveBeenCalledTimes(2);
  });

  it("returns the last used unit or defaults to lbs", async () => {
    dbMock.select.mockReturnValueOnce(createChain({ weightUnit: "kg" }));

    const { getLastUsedUnit } = await import("./getPreviousBest");
    expect(getLastUsedUnit(1, 10)).toBe("kg");

    dbMock.select.mockReset();
    dbMock.select.mockReturnValueOnce(createChain(undefined));
    expect(getLastUsedUnit(1, 10)).toBe("lbs");
  });
});
