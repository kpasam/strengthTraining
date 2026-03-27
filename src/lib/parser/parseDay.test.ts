import { describe, expect, it } from "vitest";
import { parseDayLegacy } from "./parseDay";

describe("parseDayLegacy", () => {
  it("parses grouped workouts and infers prescribed sets from rep schemes", async () => {
    const parsed = await parseDayLegacy(`
A. Bench press: 7, 5, 3, 1 (work up to a heavy single)
* 12 pull ups between each working set
B. 3 sets:
10 dumbbell row
Rest 1 min
`);

    expect(parsed.unparsedLines).toEqual(["Rest 1 min"]);
    expect(parsed.groups).toHaveLength(2);

    expect(parsed.groups[0]).toMatchObject({
      label: "A",
      prescribedSets: 4,
    });
    expect(parsed.groups[0].exercises[0]).toMatchObject({
      prescribedReps: "7,5,3,1",
      prescribedNotes: "work up to a heavy single",
      isAccessory: false,
      normalized: {
        canonicalName: "bench press",
      },
    });
    expect(parsed.groups[0].exercises[1]).toMatchObject({
      prescribedReps: "12",
      isAccessory: true,
      normalized: {
        canonicalName: "pull up",
      },
    });

    expect(parsed.groups[1]).toMatchObject({
      label: "B",
      prescribedSets: 3,
    });
    expect(parsed.groups[1].exercises[0]).toMatchObject({
      prescribedReps: "10",
      normalized: {
        canonicalName: "row",
      },
    });
  });

  it("keeps lines before the first group as unparsed context", async () => {
    const parsed = await parseDayLegacy(`
Warm up thoroughly
A. 2 sets:
8 front squat
`);

    expect(parsed.unparsedLines).toEqual(["Warm up thoroughly"]);
    expect(parsed.groups).toHaveLength(1);
    expect(parsed.groups[0]).toMatchObject({
      label: "A",
      prescribedSets: 2,
    });
  });
});
