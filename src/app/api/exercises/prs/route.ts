import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db, schema } from "@/db";
import { eq, and } from "drizzle-orm";

export async function GET() {
  const cookieStore = await cookies();
  const userIdStr = cookieStore.get("userId")?.value;
  if (!userIdStr) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = parseInt(userIdStr, 10);

  // Fetch all logs with exercise names joined
  const logs = db
    .select({
      exerciseId: schema.workoutLogs.exerciseId,
      canonicalName: schema.exercises.canonicalName,
      weight: schema.workoutLogs.weight,
      weightUnit: schema.workoutLogs.weightUnit,
      reps: schema.workoutLogs.reps,
      date: schema.workoutLogs.date,
      variantFlags: schema.workoutLogs.variantFlags,
    })
    .from(schema.workoutLogs)
    .innerJoin(schema.exercises, eq(schema.workoutLogs.exerciseId, schema.exercises.id))
    .where(eq(schema.workoutLogs.userId, userId))
    .all();

  // Aggregate per exercise: find PR (best weight) and count sessions/sets
  const exerciseMap = new Map<
    number,
    {
      exerciseId: number;
      canonicalName: string;
      bestWeight: number | null;
      bestWeightUnit: string;
      repsAtBest: number | null;
      bestDate: string;
      variantFlags: string[];
      sessions: Set<string>;
      totalSets: number;
    }
  >();

  for (const log of logs) {
    const existing = exerciseMap.get(log.exerciseId);
    if (!existing) {
      exerciseMap.set(log.exerciseId, {
        exerciseId: log.exerciseId,
        canonicalName: log.canonicalName,
        bestWeight: log.weight,
        bestWeightUnit: log.weightUnit || "lbs",
        repsAtBest: log.reps,
        bestDate: log.date,
        variantFlags: JSON.parse(log.variantFlags || "[]"),
        sessions: new Set([log.date]),
        totalSets: 1,
      });
    } else {
      existing.sessions.add(log.date);
      existing.totalSets++;
      if (
        log.weight !== null &&
        (existing.bestWeight === null || log.weight > existing.bestWeight)
      ) {
        existing.bestWeight = log.weight;
        existing.bestWeightUnit = log.weightUnit || "lbs";
        existing.repsAtBest = log.reps;
        existing.bestDate = log.date;
        existing.variantFlags = JSON.parse(log.variantFlags || "[]");
      }
    }
  }

  const exercises = Array.from(exerciseMap.values())
    .map((e) => ({
      exerciseId: e.exerciseId,
      canonicalName: e.canonicalName,
      bestWeight: e.bestWeight,
      bestWeightUnit: e.bestWeightUnit,
      repsAtBest: e.repsAtBest,
      bestDate: e.bestDate,
      variantFlags: e.variantFlags,
      totalSessions: e.sessions.size,
      totalSets: e.totalSets,
    }))
    .sort((a, b) => a.canonicalName.localeCompare(b.canonicalName));

  return NextResponse.json({ exercises });
}
