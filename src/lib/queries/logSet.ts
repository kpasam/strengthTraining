import { db, schema } from "@/db";
import { eq } from "drizzle-orm";

export interface LogSetInput {
  userId: number;
  date: string;
  exerciseId: number;
  variantFlags: string[];
  groupLabel: string;
  setNumber: number;
  weight: number | null;
  weightUnit: "lbs" | "kg";
  reps: number | null;
  duration: string | null;
  distance: string | null;
  rpe: number | null;
  notes: string;
}

export function logSet(input: LogSetInput) {
  const result = db
    .insert(schema.workoutLogs)
    .values({
      userId: input.userId,
      date: input.date,
      exerciseId: input.exerciseId,
      variantFlags: JSON.stringify(input.variantFlags),
      groupLabel: input.groupLabel,
      setNumber: input.setNumber,
      weight: input.weight,
      weightUnit: input.weightUnit,
      reps: input.reps,
      duration: input.duration,
      distance: input.distance,
      rpe: input.rpe,
      notes: input.notes,
      completedAt: new Date().toISOString(),
    })
    .returning()
    .get();

  return result;
}

export function deleteLog(id: number) {
  db.delete(schema.workoutLogs).where(eq(schema.workoutLogs.id, id)).run();
}

export function updateLog(id: number, updates: Partial<LogSetInput>) {
  const result = db
    .update(schema.workoutLogs)
    .set({
      weight: updates.weight !== undefined ? updates.weight : undefined,
      weightUnit: updates.weightUnit,
      reps: updates.reps !== undefined ? updates.reps : undefined,
      duration: updates.duration,
      distance: updates.distance,
      rpe: updates.rpe,
      notes: updates.notes,
      completedAt: new Date().toISOString(),
    })
    .where(eq(schema.workoutLogs.id, id))
    .returning()
    .get();

  return result;
}
