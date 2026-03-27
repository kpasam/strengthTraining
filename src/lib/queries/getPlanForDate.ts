import { db, schema } from "@/db";
import { eq, asc } from "drizzle-orm";

export interface ExerciseInGroup {
  id: number;
  exerciseId: number;
  canonicalName: string;
  variantFlags: string[];
  prescribedReps: string;
  prescribedNotes: string;
  isAccessory: boolean;
  sortOrder: number;
}

export interface WorkoutGroup {
  id: number;
  groupLabel: string;
  prescribedSets: number;
  sortOrder: number;
  exercises: ExerciseInGroup[];
}

export interface TodayPlan {
  planId: number;
  date: string;
  groups: WorkoutGroup[];
}

export function getPlanForDate(date: string): TodayPlan | null {
  const plan = db
    .select()
    .from(schema.workoutPlans)
    .where(eq(schema.workoutPlans.date, date))
    .get();

  if (!plan) return null;

  const groups = db
    .select()
    .from(schema.workoutGroups)
    .where(eq(schema.workoutGroups.planId, plan.id))
    .orderBy(asc(schema.workoutGroups.sortOrder))
    .all();

  const result: WorkoutGroup[] = groups.map((g) => {
    const exercises = db
      .select({
        id: schema.workoutGroupExercises.id,
        exerciseId: schema.workoutGroupExercises.exerciseId,
        canonicalName: schema.exercises.canonicalName,
        variantFlags: schema.workoutGroupExercises.variantFlags,
        prescribedReps: schema.workoutGroupExercises.prescribedReps,
        prescribedNotes: schema.workoutGroupExercises.prescribedNotes,
        isAccessory: schema.workoutGroupExercises.isAccessory,
        sortOrder: schema.workoutGroupExercises.sortOrder,
      })
      .from(schema.workoutGroupExercises)
      .innerJoin(
        schema.exercises,
        eq(schema.workoutGroupExercises.exerciseId, schema.exercises.id)
      )
      .where(eq(schema.workoutGroupExercises.groupId, g.id))
      .orderBy(schema.workoutGroupExercises.sortOrder)
      .all();

    return {
      id: g.id,
      groupLabel: g.groupLabel,
      prescribedSets: g.prescribedSets ?? 3,
      sortOrder: g.sortOrder,
      exercises: exercises.map((e) => ({
        ...e,
        variantFlags: JSON.parse(e.variantFlags || "[]"),
        isAccessory: !!e.isAccessory,
        prescribedNotes: e.prescribedNotes || "",
      })),
    };
  });

  return { planId: plan.id, date: plan.date, groups: result };
}
