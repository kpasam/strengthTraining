import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMock = {
  select: vi.fn(),
};

const schemaMock = {
  workoutLogs: {
    userId: "workoutLogs.userId",
    exerciseId: "workoutLogs.exerciseId",
    date: "workoutLogs.date",
    setNumber: "workoutLogs.setNumber",
  },
};

vi.mock("@/db", () => ({
  db: dbMock,
  schema: schemaMock,
}));

function createChain(result: unknown) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    all: vi.fn(() => result),
  };
}

describe("getExerciseHistory", () => {
  beforeEach(() => {
    dbMock.select.mockReset();
  });

  it("groups history entries by date and normalizes optional fields", async () => {
    dbMock.select.mockReturnValueOnce(
      createChain([
        {
          id: 1,
          date: "2026-03-25",
          setNumber: 1,
          weight: 100,
          weightUnit: null,
          reps: 5,
          duration: null,
          rpe: null,
          notes: null,
          variantFlags: '["pause"]',
        },
        {
          id: 2,
          date: "2026-03-25",
          setNumber: 2,
          weight: 105,
          weightUnit: "kg",
          reps: 5,
          duration: "00:30",
          rpe: 8,
          notes: "strong",
          variantFlags: "[]",
        },
        {
          id: 3,
          date: "2026-03-20",
          setNumber: 1,
          weight: null,
          weightUnit: "lbs",
          reps: null,
          duration: null,
          rpe: null,
          notes: "",
          variantFlags: null,
        },
      ])
    );

    const { getExerciseHistory } = await import("./getExerciseHistory");
    expect(getExerciseHistory(1, 99)).toEqual([
      {
        date: "2026-03-25",
        sets: [
          {
            id: 1,
            date: "2026-03-25",
            setNumber: 1,
            weight: 100,
            weightUnit: "lbs",
            reps: 5,
            duration: null,
            rpe: null,
            notes: "",
            variantFlags: ["pause"],
          },
          {
            id: 2,
            date: "2026-03-25",
            setNumber: 2,
            weight: 105,
            weightUnit: "kg",
            reps: 5,
            duration: "00:30",
            rpe: 8,
            notes: "strong",
            variantFlags: [],
          },
        ],
      },
      {
        date: "2026-03-20",
        sets: [
          {
            id: 3,
            date: "2026-03-20",
            setNumber: 1,
            weight: null,
            weightUnit: "lbs",
            reps: null,
            duration: null,
            rpe: null,
            notes: "",
            variantFlags: [],
          },
        ],
      },
    ]);
  });

  it("returns today logs with or without exercise filtering", async () => {
    const allLogs = [{ id: 1, setNumber: 1 }, { id: 2, setNumber: 2 }];
    const filteredLogs = [{ id: 3, setNumber: 1 }];
    dbMock.select
      .mockReturnValueOnce(createChain(allLogs))
      .mockReturnValueOnce(createChain(filteredLogs));

    const { getTodayLogs } = await import("./getExerciseHistory");
    expect(getTodayLogs(1, "2026-03-26")).toEqual(allLogs);
    expect(getTodayLogs(1, "2026-03-26", 88)).toEqual(filteredLogs);
  });
});
