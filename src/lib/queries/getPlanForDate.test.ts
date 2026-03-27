import { beforeEach, describe, expect, it, vi } from "vitest";

const dbMock = {
  select: vi.fn(),
};

const schemaMock = {
  workoutPlans: { id: "workoutPlans.id", date: "workoutPlans.date" },
  workoutGroups: {
    id: "workoutGroups.id",
    planId: "workoutGroups.planId",
    sortOrder: "workoutGroups.sortOrder",
  },
  workoutGroupExercises: {
    id: "workoutGroupExercises.id",
    groupId: "workoutGroupExercises.groupId",
    exerciseId: "workoutGroupExercises.exerciseId",
    variantFlags: "workoutGroupExercises.variantFlags",
    prescribedReps: "workoutGroupExercises.prescribedReps",
    prescribedNotes: "workoutGroupExercises.prescribedNotes",
    isAccessory: "workoutGroupExercises.isAccessory",
    sortOrder: "workoutGroupExercises.sortOrder",
  },
  exercises: {
    id: "exercises.id",
    canonicalName: "exercises.canonicalName",
  },
};

vi.mock("@/db", () => ({
  db: dbMock,
  schema: schemaMock,
}));

function createChain(result: unknown, terminal: "get" | "all") {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    get: terminal === "get" ? vi.fn(() => result) : vi.fn(),
    all: terminal === "all" ? vi.fn(() => result) : vi.fn(),
  };
}

describe("getPlanForDate", () => {
  beforeEach(() => {
    dbMock.select.mockReset();
  });

  it("returns null when there is no plan for the date", async () => {
    dbMock.select.mockReturnValueOnce(createChain(undefined, "get"));

    const { getPlanForDate } = await import("./getPlanForDate");
    expect(getPlanForDate("2026-03-26")).toBeNull();
  });

  it("hydrates groups and exercises with parsed JSON/default values", async () => {
    dbMock.select
      .mockReturnValueOnce(createChain({ id: 11, date: "2026-03-26" }, "get"))
      .mockReturnValueOnce(
        createChain(
          [
            { id: 21, groupLabel: "A", prescribedSets: null, sortOrder: 2 },
            { id: 22, groupLabel: "B", prescribedSets: 5, sortOrder: 3 },
          ],
          "all"
        )
      )
      .mockReturnValueOnce(
        createChain(
          [
            {
              id: 31,
              exerciseId: 41,
              canonicalName: "bench press",
              variantFlags: '["pause"]',
              prescribedReps: "5,5,5",
              prescribedNotes: null,
              isAccessory: 0,
              sortOrder: 1,
            },
          ],
          "all"
        )
      )
      .mockReturnValueOnce(
        createChain(
          [
            {
              id: 32,
              exerciseId: 42,
              canonicalName: "row",
              variantFlags: null,
              prescribedReps: "12",
              prescribedNotes: "controlled",
              isAccessory: 1,
              sortOrder: 4,
            },
          ],
          "all"
        )
      );

    const { getPlanForDate } = await import("./getPlanForDate");
    expect(getPlanForDate("2026-03-26")).toEqual({
      planId: 11,
      date: "2026-03-26",
      groups: [
        {
          id: 21,
          groupLabel: "A",
          prescribedSets: 3,
          sortOrder: 2,
          exercises: [
            {
              id: 31,
              exerciseId: 41,
              canonicalName: "bench press",
              variantFlags: ["pause"],
              prescribedReps: "5,5,5",
              prescribedNotes: "",
              isAccessory: false,
              sortOrder: 1,
            },
          ],
        },
        {
          id: 22,
          groupLabel: "B",
          prescribedSets: 5,
          sortOrder: 3,
          exercises: [
            {
              id: 32,
              exerciseId: 42,
              canonicalName: "row",
              variantFlags: [],
              prescribedReps: "12",
              prescribedNotes: "controlled",
              isAccessory: true,
              sortOrder: 4,
            },
          ],
        },
      ],
    });
  });
});
