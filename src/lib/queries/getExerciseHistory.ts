import { db, schema } from "@/db";
import { eq, desc, and } from "drizzle-orm";

export interface HistoryEntry {
  id: number;
  date: string;
  setNumber: number;
  weight: number | null;
  weightUnit: string;
  reps: number | null;
  duration: string | null;
  rpe: number | null;
  notes: string;
  variantFlags: string[];
}

export interface SessionGroup {
  date: string;
  sets: HistoryEntry[];
}

export function getExerciseHistory(userId: number, exerciseId: number): SessionGroup[] {
  const logs = db
    .select()
    .from(schema.workoutLogs)
    .where(
      and(
        eq(schema.workoutLogs.userId, userId),
        eq(schema.workoutLogs.exerciseId, exerciseId)
      )
    )
    .orderBy(desc(schema.workoutLogs.date), schema.workoutLogs.setNumber)
    .all();

  const grouped = new Map<string, HistoryEntry[]>();
  for (const log of logs) {
    const entries = grouped.get(log.date) || [];
    entries.push({
      id: log.id,
      date: log.date,
      setNumber: log.setNumber,
      weight: log.weight,
      weightUnit: log.weightUnit || "lbs",
      reps: log.reps,
      duration: log.duration,
      rpe: log.rpe,
      notes: log.notes || "",
      variantFlags: JSON.parse(log.variantFlags || "[]"),
    });
    grouped.set(log.date, entries);
  }

  return Array.from(grouped.entries()).map(([date, sets]) => ({ date, sets }));
}

export function getTodayLogs(userId: number, date: string, exerciseId?: number) {
  const conditions: ReturnType<typeof eq>[] = [
    eq(schema.workoutLogs.userId, userId),
    eq(schema.workoutLogs.date, date)
  ];
  if (exerciseId !== undefined) {
    conditions.push(eq(schema.workoutLogs.exerciseId, exerciseId));
  }

  return db
    .select()
    .from(schema.workoutLogs)
    .where(conditions.length === 1 ? conditions[0] : and(...conditions))
    .orderBy(schema.workoutLogs.setNumber)
    .all();
}
