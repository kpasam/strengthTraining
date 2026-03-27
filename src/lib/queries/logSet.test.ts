import { beforeEach, describe, expect, it, vi } from "vitest";

const insertValuesMock = vi.fn();
const updateSetMock = vi.fn();
const deleteWhereMock = vi.fn();

const dbMock = {
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

const schemaMock = {
  workoutLogs: {
    id: "workoutLogs.id",
  },
};

vi.mock("@/db", () => ({
  db: dbMock,
  schema: schemaMock,
}));

describe("logSet query helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("serializes variant flags and timestamps when inserting a log", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-26T18:45:00Z"));
    dbMock.insert.mockReturnValue({
      values: insertValuesMock.mockReturnValue({
        returning: vi.fn().mockReturnValue({
          get: vi.fn(() => ({ id: 1 })),
        }),
      }),
    });

    const { logSet } = await import("./logSet");
    expect(
      logSet({
        userId: 1,
        date: "2026-03-26",
        exerciseId: 9,
        variantFlags: ["pause"],
        groupLabel: "A",
        setNumber: 2,
        weight: 225,
        weightUnit: "lbs",
        reps: 5,
        duration: null,
        rpe: 8,
        notes: "smooth",
      })
    ).toEqual({ id: 1 });

    expect(insertValuesMock).toHaveBeenCalledWith(
      expect.objectContaining({
        variantFlags: '["pause"]',
        completedAt: "2026-03-26T18:45:00.000Z",
      })
    );
    vi.useRealTimers();
  });

  it("updates mutable fields and deletes logs by id", async () => {
    dbMock.update.mockReturnValue({
      set: updateSetMock.mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockReturnValue({
            get: vi.fn(() => ({ id: 4, weight: 185 })),
          }),
        }),
      }),
    });
    dbMock.delete.mockReturnValue({
      where: deleteWhereMock.mockReturnValue({
        run: vi.fn(),
      }),
    });

    const { updateLog, deleteLog } = await import("./logSet");
    expect(updateLog(4, { weight: 185, notes: "clean" })).toEqual({
      id: 4,
      weight: 185,
    });
    expect(updateSetMock).toHaveBeenCalledWith(
      expect.objectContaining({
        weight: 185,
        notes: "clean",
      })
    );

    deleteLog(4);
    expect(deleteWhereMock).toHaveBeenCalledTimes(1);
  });
});
