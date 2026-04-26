import { db, schema } from "@/db";
import { eq, desc, and, ne } from "drizzle-orm";

export interface PreviousBest {
  weight: number | null;
  weightUnit: string;
  reps: number | null;
  duration: string | null;
  distance: string | null;
  date: string;
  variantFlags: string[];
  notes: string;
}

export function getPreviousBest(
  userId: number,
  exerciseId: number,
  currentDate?: string
): PreviousBest | null {
  const conditions: ReturnType<typeof eq>[] = [
    eq(schema.workoutLogs.userId, userId),
    eq(schema.workoutLogs.exerciseId, exerciseId)
  ];
  if (currentDate) {
    conditions.push(ne(schema.workoutLogs.date, currentDate));
  }

  const result = db
    .select()
    .from(schema.workoutLogs)
    .where(and(...conditions))
    .orderBy(desc(schema.workoutLogs.completedAt))
    .limit(1)
    .get();

  if (!result) return null;

  return {
    weight: result.weight,
    weightUnit: result.weightUnit || "lbs",
    reps: result.reps,
    duration: result.duration,
    distance: result.distance,
    date: result.date,
    variantFlags: JSON.parse(result.variantFlags || "[]"),
    notes: result.notes || "",
  };
}

export interface RepBest {
  weight: number;
  weightUnit: string;
  reps: number;
  date: string;
  variantFlags: string[];
  notes: string;
}

export function getBestForReps(
  userId: number,
  exerciseId: number,
  reps: number,
  currentDate?: string
): RepBest | null {
  const conditions: ReturnType<typeof eq>[] = [
    eq(schema.workoutLogs.userId, userId),
    eq(schema.workoutLogs.exerciseId, exerciseId),
    eq(schema.workoutLogs.reps, reps),
  ];
  if (currentDate) {
    conditions.push(ne(schema.workoutLogs.date, currentDate));
  }

  const result = db
    .select()
    .from(schema.workoutLogs)
    .where(and(...conditions))
    .orderBy(desc(schema.workoutLogs.weight), desc(schema.workoutLogs.completedAt))
    .limit(1)
    .get();

  if (!result || result.weight === null) return null;

  return {
    weight: result.weight,
    weightUnit: result.weightUnit || "lbs",
    reps: result.reps!,
    date: result.date,
    variantFlags: JSON.parse(result.variantFlags || "[]"),
    notes: result.notes || "",
  };
}

export function getBestsForRepCounts(
  userId: number,
  exerciseId: number,
  repCounts: number[],
  currentDate?: string
): Record<number, RepBest> {
  const result: Record<number, RepBest> = {};
  const unique = [...new Set(repCounts)];
  for (const reps of unique) {
    const best = getBestForReps(userId, exerciseId, reps, currentDate);
    if (best) result[reps] = best;
  }
  return result;
}

export function getLastUsedUnit(userId: number, exerciseId: number): "lbs" | "kg" {
  const result = db
    .select({ weightUnit: schema.workoutLogs.weightUnit })
    .from(schema.workoutLogs)
    .where(
      and(
        eq(schema.workoutLogs.userId, userId),
        eq(schema.workoutLogs.exerciseId, exerciseId)
      )
    )
    .orderBy(desc(schema.workoutLogs.completedAt))
    .limit(1)
    .get();

  return (result?.weightUnit as "lbs" | "kg") || "lbs";
}
