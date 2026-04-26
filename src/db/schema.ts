import { sqliteTable, text, integer, real, uniqueIndex, index } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  pin: text("pin").notNull(),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

export const exercises = sqliteTable("exercises", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  canonicalName: text("canonical_name").notNull().unique(),
  createdAt: text("created_at").default("CURRENT_TIMESTAMP"),
});

export const workoutPlans = sqliteTable("workout_plans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  date: text("date").notNull().unique(),
  rawText: text("raw_text").notNull(),
  parsedAt: text("parsed_at").default("CURRENT_TIMESTAMP"),
});

export const workoutGroups = sqliteTable(
  "workout_groups",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    planId: integer("plan_id")
      .notNull()
      .references(() => workoutPlans.id, { onDelete: "cascade" }),
    groupLabel: text("group_label").notNull(),
    prescribedSets: integer("prescribed_sets").default(3),
    sortOrder: integer("sort_order").notNull(),
  },
  (table) => [
    uniqueIndex("uq_plan_group").on(table.planId, table.groupLabel),
  ]
);

export const workoutGroupExercises = sqliteTable("workout_group_exercises", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  groupId: integer("group_id")
    .notNull()
    .references(() => workoutGroups.id, { onDelete: "cascade" }),
  exerciseId: integer("exercise_id")
    .notNull()
    .references(() => exercises.id),
  variantFlags: text("variant_flags").default("[]"),
  prescribedReps: text("prescribed_reps").notNull(),
  prescribedNotes: text("prescribed_notes").default(""),
  isAccessory: integer("is_accessory", { mode: "boolean" }).default(false),
  sortOrder: integer("sort_order").notNull(),
});

export const workoutCompletions = sqliteTable(
  "workout_completions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    completedAt: text("completed_at").default("CURRENT_TIMESTAMP"),
  },
  (table) => [
    uniqueIndex("uq_completion_user_date").on(table.userId, table.date),
  ]
);

export const exerciseLabels = sqliteTable("exercise_labels", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  exerciseId: integer("exercise_id")
    .notNull()
    .unique()
    .references(() => exercises.id, { onDelete: "cascade" }),
  isExercise: integer("is_exercise", { mode: "boolean" }).notNull().default(true),
  bodyPart: text("body_part"),
  intensity: text("intensity"),
  movementType: text("movement_type"),
  equipment: text("equipment"),
  exerciseType: text("exercise_type").default("strength"),
});

export const workoutLogs = sqliteTable(
  "workout_logs",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .default(1)
      .references(() => users.id, { onDelete: "cascade" }),
    date: text("date").notNull(),
    exerciseId: integer("exercise_id")
      .notNull()
      .references(() => exercises.id),
    variantFlags: text("variant_flags").default("[]"),
    groupLabel: text("group_label").notNull(),
    setNumber: integer("set_number").notNull(),
    weight: real("weight"),
    weightUnit: text("weight_unit").default("lbs"),
    reps: integer("reps"),
    duration: text("duration"),
    distance: text("distance"),
    rpe: integer("rpe"),
    notes: text("notes").default(""),
    completedAt: text("completed_at").default("CURRENT_TIMESTAMP"),
  },
  (table) => [
    index("idx_logs_exercise_date").on(table.exerciseId, table.date),
    index("idx_logs_user_exercise_reps").on(table.userId, table.exerciseId, table.reps),
  ]
);
