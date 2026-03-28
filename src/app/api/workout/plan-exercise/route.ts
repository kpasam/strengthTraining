import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db, schema } from "@/db";
import { eq, and, max } from "drizzle-orm";

export async function DELETE(request: NextRequest) {
  const cookieStore = await cookies();
  const userIdStr = cookieStore.get("userId")?.value;
  if (!userIdStr) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { workoutGroupExerciseId?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { workoutGroupExerciseId } = body;
  if (!workoutGroupExerciseId || typeof workoutGroupExerciseId !== "number") {
    return NextResponse.json({ error: "workoutGroupExerciseId is required" }, { status: 400 });
  }

  const result = db.transaction((tx) => {
    // Fetch the row first to get groupId before deleting
    const wge = tx
      .select({ groupId: schema.workoutGroupExercises.groupId })
      .from(schema.workoutGroupExercises)
      .where(eq(schema.workoutGroupExercises.id, workoutGroupExerciseId))
      .get();

    if (!wge) return { found: false };

    // Delete the exercise from the group
    tx.delete(schema.workoutGroupExercises)
      .where(eq(schema.workoutGroupExercises.id, workoutGroupExerciseId))
      .run();

    // If the group now has no exercises, delete the group too
    const remaining = tx
      .select({ id: schema.workoutGroupExercises.id })
      .from(schema.workoutGroupExercises)
      .where(eq(schema.workoutGroupExercises.groupId, wge.groupId))
      .all();

    if (remaining.length === 0) {
      tx.delete(schema.workoutGroups)
        .where(eq(schema.workoutGroups.id, wge.groupId))
        .run();
    }

    return { found: true };
  });

  if (!result.found) {
    return NextResponse.json({ error: "Exercise not found in plan" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(request: NextRequest) {
  const cookieStore = await cookies();
  const userIdStr = cookieStore.get("userId")?.value;
  if (!userIdStr) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { workoutGroupExerciseId?: number; targetGroupLabel?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { workoutGroupExerciseId, targetGroupLabel } = body;
  if (!workoutGroupExerciseId || typeof workoutGroupExerciseId !== "number") {
    return NextResponse.json({ error: "workoutGroupExerciseId is required" }, { status: 400 });
  }
  if (!targetGroupLabel || typeof targetGroupLabel !== "string") {
    return NextResponse.json({ error: "targetGroupLabel is required" }, { status: 400 });
  }

  const result = db.transaction((tx) => {
    // Fetch the exercise row to move
    const wge = tx
      .select()
      .from(schema.workoutGroupExercises)
      .where(eq(schema.workoutGroupExercises.id, workoutGroupExerciseId))
      .get();
    if (!wge) return { found: false, newGroupLabel: "" };

    // Get source group to find planId
    const sourceGroup = tx
      .select()
      .from(schema.workoutGroups)
      .where(eq(schema.workoutGroups.id, wge.groupId))
      .get();
    if (!sourceGroup) return { found: false, newGroupLabel: "" };

    let targetGroup: { id: number; groupLabel: string };

    if (targetGroupLabel === "new") {
      // Create a new manual group
      const allGroups = tx
        .select({ groupLabel: schema.workoutGroups.groupLabel })
        .from(schema.workoutGroups)
        .where(eq(schema.workoutGroups.planId, sourceGroup.planId))
        .all();

      const manualGroupNums = allGroups
        .map((g) => g.groupLabel)
        .filter((l) => /^M\d+$/.test(l))
        .map((l) => parseInt(l.slice(1), 10));

      const nextNum = manualGroupNums.length > 0 ? Math.max(...manualGroupNums) + 1 : 1;
      const newLabel = `M${nextNum}`;

      targetGroup = tx
        .insert(schema.workoutGroups)
        .values({
          planId: sourceGroup.planId,
          groupLabel: newLabel,
          prescribedSets: sourceGroup.prescribedSets,
          sortOrder: 1000 + nextNum,
        })
        .returning()
        .get();
    } else {
      const found = tx
        .select()
        .from(schema.workoutGroups)
        .where(and(eq(schema.workoutGroups.planId, sourceGroup.planId), eq(schema.workoutGroups.groupLabel, targetGroupLabel)))
        .get();
      if (!found) return { found: false, newGroupLabel: "" };
      targetGroup = found;
    }

    // Compute sortOrder in target group
    const maxRow = tx
      .select({ maxOrder: max(schema.workoutGroupExercises.sortOrder) })
      .from(schema.workoutGroupExercises)
      .where(eq(schema.workoutGroupExercises.groupId, targetGroup.id))
      .get();
    const nextSortOrder = (maxRow?.maxOrder ?? -1) + 1;

    // Move the exercise
    tx.update(schema.workoutGroupExercises)
      .set({ groupId: targetGroup.id, sortOrder: nextSortOrder })
      .where(eq(schema.workoutGroupExercises.id, workoutGroupExerciseId))
      .run();

    // Clean up source group if now empty
    const remaining = tx
      .select({ id: schema.workoutGroupExercises.id })
      .from(schema.workoutGroupExercises)
      .where(eq(schema.workoutGroupExercises.groupId, wge.groupId))
      .all();

    if (remaining.length === 0) {
      tx.delete(schema.workoutGroups)
        .where(eq(schema.workoutGroups.id, wge.groupId))
        .run();
    }

    return { found: true, newGroupLabel: targetGroup.groupLabel };
  });

  if (!result.found) {
    return NextResponse.json({ error: "Exercise or target group not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, newGroupLabel: result.newGroupLabel });
}
