import Database from "better-sqlite3";
import path from "path";
import { seedExerciseLabels } from "../db/exerciseLabelsSeed";

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), "data", "gym.db");
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

seedExerciseLabels(sqlite);
console.log("Exercise labels seeded.");
sqlite.close();
