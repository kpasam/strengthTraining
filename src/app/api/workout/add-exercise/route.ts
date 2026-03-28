import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db, schema } from "@/db";
import { eq, and, max } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const userIdStr = cookieStore.get("userId")?.value;
  if (!userIdStr) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const date = request.nextUrl.searchParams.get("date");
  if (!date) return NextResponse.json({ error: "date is required" }, { status: 400 });

  const plan = db.select().from(schema.workoutPlans).where(eq(schema.workoutPlans.date, date)).get();
  if (!plan) return NextResponse.json({ groups: [] });

  const rows = db
    .select({
      groupId: schema.workoutGroups.id,
      groupLabel: schema.workoutGroups.groupLabel,
      sortOrder: schema.workoutGroups.sortOrder,
      canonicalName: schema.exercises.canonicalName,
    })
    .from(schema.workoutGroups)
    .innerJoin(schema.workoutGroupExercises, eq(schema.workoutGroupExercises.groupId, schema.workoutGroups.id))
    .innerJoin(schema.exercises, eq(schema.exercises.id, schema.workoutGroupExercises.exerciseId))
    .where(eq(schema.workoutGroups.planId, plan.id))
    .orderBy(schema.workoutGroups.sortOrder, schema.workoutGroupExercises.sortOrder)
    .all();

  // Aggregate exercise names per group
  const groupMap = new Map<number, { id: number; groupLabel: string; exerciseNames: string[] }>();
  for (const row of rows) {
    if (!groupMap.has(row.groupId)) {
      groupMap.set(row.groupId, { id: row.groupId, groupLabel: row.groupLabel, exerciseNames: [] });
    }
    groupMap.get(row.groupId)!.exerciseNames.push(row.canonicalName);
  }

  return NextResponse.json({ groups: Array.from(groupMap.values()) });
}

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const userIdStr = cookieStore.get("userId")?.value;
  if (!userIdStr) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { date?: string; exerciseId?: number; prescribedSets?: number; prescribedReps?: string; targetGroupLabel?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { date, exerciseId, prescribedSets = 3, prescribedReps = "8,8,8", targetGroupLabel } = body;

  if (!date || !exerciseId) {
    return NextResponse.json({ error: "date and exerciseId are required" }, { status: 400 });
  }

  // Verify the exercise exists
  const exercise = db
    .select()
    .from(schema.exercises)
    .where(eq(schema.exercises.id, exerciseId))
    .get();

  if (!exercise) {
    return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
  }

  const result = db.transaction((tx) => {
    // Find or create the workout plan for this date
    let plan = tx
      .select()
      .from(schema.workoutPlans)
      .where(eq(schema.workoutPlans.date, date))
      .get();

    let planId: number;
    if (!plan) {
      const inserted = tx
        .insert(schema.workoutPlans)
        .values({ date, rawText: "manual", parsedAt: new Date().toISOString() })
        .returning()
        .get();
      planId = inserted.id;
    } else {
      planId = plan.id;
    }

    if (targetGroupLabel) {
      // Add to an existing group
      const group = tx
        .select()
        .from(schema.workoutGroups)
        .where(and(eq(schema.workoutGroups.planId, planId), eq(schema.workoutGroups.groupLabel, targetGroupLabel)))
        .get();
      if (!group) return { groupLabel: null, notFound: true };

      const maxRow = tx
        .select({ maxOrder: max(schema.workoutGroupExercises.sortOrder) })
        .from(schema.workoutGroupExercises)
        .where(eq(schema.workoutGroupExercises.groupId, group.id))
        .get();
      const nextSortOrder = (maxRow?.maxOrder ?? -1) + 1;

      tx.insert(schema.workoutGroupExercises)
        .values({
          groupId: group.id,
          exerciseId,
          variantFlags: "[]",
          prescribedReps,
          prescribedNotes: "",
          isAccessory: false,
          sortOrder: nextSortOrder,
        })
        .run();

      return { groupLabel: targetGroupLabel, notFound: false };
    }

    // Create a new manual group
    const allGroups = tx
      .select({ groupLabel: schema.workoutGroups.groupLabel })
      .from(schema.workoutGroups)
      .where(eq(schema.workoutGroups.planId, planId))
      .all();

    const manualGroupNums = allGroups
      .map((g) => g.groupLabel)
      .filter((l) => /^M\d+$/.test(l))
      .map((l) => parseInt(l.slice(1), 10));

    const nextNum = manualGroupNums.length > 0 ? Math.max(...manualGroupNums) + 1 : 1;
    const groupLabel = `M${nextNum}`;

    // Manual groups get sort order 1000+ so they always appear after Steve's A, B, C groups
    const sortOrder = 1000 + nextNum;

    const group = tx
      .insert(schema.workoutGroups)
      .values({ planId, groupLabel, prescribedSets, sortOrder })
      .returning()
      .get();

    tx.insert(schema.workoutGroupExercises)
      .values({
        groupId: group.id,
        exerciseId,
        variantFlags: "[]",
        prescribedReps,
        prescribedNotes: "",
        isAccessory: false,
        sortOrder: 0,
      })
      .run();

    return { groupLabel, notFound: false };
  });

  if (result.notFound) {
    return NextResponse.json({ error: "Target group not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, groupLabel: result.groupLabel });
}
