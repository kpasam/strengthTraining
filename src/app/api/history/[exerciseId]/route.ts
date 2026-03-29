import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getExerciseHistory } from "@/lib/queries/getExerciseHistory";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ exerciseId: string }> }
) {
  const cookieStore = await cookies();
  const userIdStr = cookieStore.get("userId")?.value;
  if (!userIdStr) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = parseInt(userIdStr, 10);

  const { exerciseId: idStr } = await params;
  const exerciseId = parseInt(idStr, 10);
  if (isNaN(exerciseId)) {
    return NextResponse.json({ error: "Invalid exercise ID" }, { status: 400 });
  }

  const exercise = db
    .select()
    .from(schema.exercises)
    .where(eq(schema.exercises.id, exerciseId))
    .get();

  if (!exercise) {
    return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
  }

  const label = db
    .select({ exerciseType: schema.exerciseLabels.exerciseType })
    .from(schema.exerciseLabels)
    .where(eq(schema.exerciseLabels.exerciseId, exerciseId))
    .get();

  const history = getExerciseHistory(userId, exerciseId);

  return NextResponse.json({
    exercise: {
      id: exercise.id,
      canonicalName: exercise.canonicalName,
      exerciseType: label?.exerciseType || "strength",
    },
    sessions: history,
  });
}
