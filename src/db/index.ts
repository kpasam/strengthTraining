import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import { seedExerciseLabels } from "./exerciseLabelsSeed";
import path from "path";
import fs from "fs";

let _db: BetterSQLite3Database<typeof schema> | null = null;

function getDb(): BetterSQLite3Database<typeof schema> {
  if (_db) return _db;

  const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "gym.db");

  // Ensure data directory exists
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 5000");

  // Auto-migrate: ensure all tables exist
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      pin TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      canonical_name TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS workout_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL UNIQUE,
      raw_text TEXT NOT NULL,
      parsed_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS workout_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
      group_label TEXT NOT NULL,
      prescribed_sets INTEGER DEFAULT 3,
      sort_order INTEGER NOT NULL,
      UNIQUE(plan_id, group_label)
    );
    CREATE TABLE IF NOT EXISTS workout_group_exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL REFERENCES workout_groups(id) ON DELETE CASCADE,
      exercise_id INTEGER NOT NULL REFERENCES exercises(id),
      variant_flags TEXT DEFAULT '[]',
      prescribed_reps TEXT NOT NULL,
      prescribed_notes TEXT DEFAULT '',
      is_accessory INTEGER DEFAULT 0,
      sort_order INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS workout_completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      completed_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, date)
    );
    CREATE TABLE IF NOT EXISTS workout_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL DEFAULT 1 REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      exercise_id INTEGER NOT NULL REFERENCES exercises(id),
      variant_flags TEXT DEFAULT '[]',
      group_label TEXT NOT NULL,
      set_number INTEGER NOT NULL,
      weight REAL,
      weight_unit TEXT DEFAULT 'lbs',
      reps INTEGER,
      duration TEXT,
      rpe INTEGER,
      notes TEXT DEFAULT '',
      completed_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_logs_exercise_date ON workout_logs(exercise_id, date);
    CREATE INDEX IF NOT EXISTS idx_logs_user_exercise_reps ON workout_logs(user_id, exercise_id, reps);
    CREATE TABLE IF NOT EXISTS exercise_labels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      exercise_id INTEGER NOT NULL UNIQUE REFERENCES exercises(id) ON DELETE CASCADE,
      is_exercise INTEGER NOT NULL DEFAULT 1,
      body_part TEXT,
      intensity TEXT,
      movement_type TEXT,
      equipment TEXT
    );
  `);

  // Add exercise_type column if missing (idempotent migration)
  try {
    sqlite.exec(`ALTER TABLE exercise_labels ADD COLUMN exercise_type TEXT DEFAULT 'strength'`);
  } catch {
    // Column already exists
  }

  // Auto-seed if exercises table has fewer entries than the known catalog (e.g. fresh/partial production DB)
  const { c } = sqlite.prepare("SELECT COUNT(*) as c FROM exercises").get() as { c: number };
  if (c < 127) {
    seedExerciseLabels(sqlite);
  }

  // Ensure "5k run" exercise exists and is marked timed
  const timedExercises = ["5k run", "run", "200m run", "400m run"];
  for (const name of timedExercises) {
    sqlite.exec(`INSERT OR IGNORE INTO exercises (canonical_name) VALUES ('${name}')`);
    sqlite.exec(`
      INSERT INTO exercise_labels (exercise_id, is_exercise, body_part, intensity, movement_type, equipment, exercise_type)
      SELECT id, 1, 'full_body', 'high', 'compound', 'bodyweight', 'timed'
      FROM exercises WHERE canonical_name = '${name}'
      ON CONFLICT(exercise_id) DO UPDATE SET exercise_type = 'timed'
    `);
  }

  _db = drizzle(sqlite, { schema });
  return _db;
}

export const db = new Proxy({} as BetterSQLite3Database<typeof schema>, {
  get(_target, prop) {
    const instance = getDb();
    const value = (instance as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  },
});

export { schema };
