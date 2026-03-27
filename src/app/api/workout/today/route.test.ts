import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const cookiesMock = vi.fn();
const getPlanForDateMock = vi.fn();
const getPreviousBestMock = vi.fn();
const getLastUsedUnitMock = vi.fn();
const getBestsForRepCountsMock = vi.fn();
const getTodayLogsMock = vi.fn();
const dbMock = { select: vi.fn() };
const schemaMock = {
  users: {
    id: "users.id",
  },
};

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

vi.mock("@/lib/queries/getPlanForDate", () => ({
  getPlanForDate: getPlanForDateMock,
}));

vi.mock("@/lib/queries/getPreviousBest", () => ({
  getPreviousBest: getPreviousBestMock,
  getLastUsedUnit: getLastUsedUnitMock,
  getBestsForRepCounts: getBestsForRepCountsMock,
}));

vi.mock("@/lib/queries/getExerciseHistory", () => ({
  getTodayLogs: getTodayLogsMock,
}));

vi.mock("@/db", () => ({
  db: dbMock,
  schema: schemaMock,
}));

function createSelectChain(result: unknown) {
  return {
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    get: vi.fn(() => result),
  };
}

describe("GET /api/workout/today", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.select.mockReset();
  });

  it("returns 401 when the user is not authenticated", async () => {
    cookiesMock.mockResolvedValue({
      get: vi.fn(() => undefined),
    });

    const { GET } = await import("./route");
    const response = await GET(new NextRequest("http://localhost/api/workout/today"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns an empty plan payload when no workout is scheduled", async () => {
    cookiesMock.mockResolvedValue({
      get: vi.fn(() => ({ value: "7" })),
    });
    dbMock.select.mockReturnValueOnce(createSelectChain({ username: "kai" }));
    getPlanForDateMock.mockReturnValue(null);

    const { GET } = await import("./route");
    const response = await GET(
      new NextRequest("http://localhost/api/workout/today?date=2026-03-26")
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      plan: null,
      date: "2026-03-26",
      username: "kai",
    });
  });

  it("enriches workout groups with previous bests, rep bests, units, and filtered today logs", async () => {
    cookiesMock.mockResolvedValue({
      get: vi.fn(() => ({ value: "7" })),
    });
    dbMock.select.mockReturnValueOnce(createSelectChain({ username: "kai" }));
    getPlanForDateMock.mockReturnValue({
      planId: 10,
      date: "2026-03-26",
      groups: [
        {
          id: 1,
          groupLabel: "A",
          prescribedSets: 3,
          sortOrder: 1,
          exercises: [
            {
              id: 11,
              exerciseId: 100,
              canonicalName: "bench press",
              variantFlags: [],
              prescribedReps: "5,3,1",
              prescribedNotes: "",
              isAccessory: false,
              sortOrder: 1,
            },
            {
              id: 12,
              exerciseId: 101,
              canonicalName: "row",
              variantFlags: ["tempo"],
              prescribedReps: "12",
              prescribedNotes: "controlled",
              isAccessory: true,
              sortOrder: 2,
            },
          ],
        },
      ],
    });
    getTodayLogsMock.mockReturnValue([
      {
        id: 1,
        exerciseId: 100,
        groupLabel: "A",
        setNumber: 1,
        weight: 225,
        weightUnit: "lbs",
        reps: 5,
        notes: "fast",
      },
      {
        id: 2,
        exerciseId: 100,
        groupLabel: "B",
        setNumber: 1,
        weight: 135,
        weightUnit: "lbs",
        reps: 8,
        notes: "other group",
      },
      {
        id: 3,
        exerciseId: 101,
        groupLabel: "A",
        setNumber: 1,
        weight: 50,
        weightUnit: "kg",
        reps: 12,
        notes: "",
      },
    ]);
    getPreviousBestMock
      .mockReturnValueOnce({ weight: 235, weightUnit: "lbs", reps: 3, date: "2026-03-20" })
      .mockReturnValueOnce(null);
    getLastUsedUnitMock.mockReturnValueOnce("lbs").mockReturnValueOnce("kg");
    getBestsForRepCountsMock
      .mockReturnValueOnce({
        1: { weight: 255, weightUnit: "lbs", reps: 1, date: "2026-03-01" },
      })
      .mockReturnValueOnce({
        12: { weight: 55, weightUnit: "kg", reps: 12, date: "2026-03-10" },
      });

    const { GET } = await import("./route");
    const response = await GET(
      new NextRequest("http://localhost/api/workout/today?date=2026-03-26")
    );
    const payload = await response.json();

    expect(payload.username).toBe("kai");
    expect(payload.plan.groups[0].exercises).toEqual([
      expect.objectContaining({
        exerciseId: 100,
        previousBest: { weight: 235, weightUnit: "lbs", reps: 3, date: "2026-03-20" },
        repBests: {
          1: { weight: 255, weightUnit: "lbs", reps: 1, date: "2026-03-01" },
        },
        lastUsedUnit: "lbs",
        completedSets: 1,
        todayLogs: [
          {
            id: 1,
            setNumber: 1,
            weight: 225,
            weightUnit: "lbs",
            reps: 5,
            notes: "fast",
          },
        ],
      }),
      expect.objectContaining({
        exerciseId: 101,
        previousBest: null,
        repBests: {
          12: { weight: 55, weightUnit: "kg", reps: 12, date: "2026-03-10" },
        },
        lastUsedUnit: "kg",
        completedSets: 1,
        todayLogs: [
          {
            id: 3,
            setNumber: 1,
            weight: 50,
            weightUnit: "kg",
            reps: 12,
            notes: "",
          },
        ],
      }),
    ]);
    expect(getBestsForRepCountsMock).toHaveBeenNthCalledWith(1, 7, 100, [5, 3, 1], "2026-03-26");
    expect(getBestsForRepCountsMock).toHaveBeenNthCalledWith(2, 7, 101, [12], "2026-03-26");
  });
});
