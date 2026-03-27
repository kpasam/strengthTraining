import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";

export async function GET() {
  const cookieStore = await cookies();
  const userIdStr = cookieStore.get("userId")?.value;
  if (!userIdStr) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = parseInt(userIdStr, 10);

  // Fetch all logs with exercise names
  const logs = db
    .select({
      date: schema.workoutLogs.date,
      exerciseId: schema.workoutLogs.exerciseId,
      groupLabel: schema.workoutLogs.groupLabel,
      canonicalName: schema.exercises.canonicalName,
    })
    .from(schema.workoutLogs)
    .innerJoin(schema.exercises, eq(schema.workoutLogs.exerciseId, schema.exercises.id))
    .where(eq(schema.workoutLogs.userId, userId))
    .all();

  // Group by date
  const dateMap = new Map<
    string,
    { exercises: Set<string>; groups: Set<string>; totalSets: number }
  >();

  for (const log of logs) {
    const entry = dateMap.get(log.date);
    if (!entry) {
      dateMap.set(log.date, {
        exercises: new Set([log.canonicalName]),
        groups: new Set([log.groupLabel]),
        totalSets: 1,
      });
    } else {
      entry.exercises.add(log.canonicalName);
      entry.groups.add(log.groupLabel);
      entry.totalSets++;
    }
  }

  // Also include completion-only days (marked complete with no sets logged)
  const completions = db
    .select({ date: schema.workoutCompletions.date })
    .from(schema.workoutCompletions)
    .where(eq(schema.workoutCompletions.userId, userId))
    .all();

  for (const c of completions) {
    if (!dateMap.has(c.date)) {
      dateMap.set(c.date, { exercises: new Set(), groups: new Set(), totalSets: 0 });
    }
  }

  const workoutDays = Array.from(dateMap.entries())
    .map(([date, data]) => ({
      date,
      totalSets: data.totalSets,
      exercises: Array.from(data.exercises),
      groups: Array.from(data.groups).sort(),
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Week and year counts (Pacific time)
  const todayPST = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Los_Angeles",
  });
  const todayDate = new Date(todayPST + "T12:00:00");

  const dayOfWeek = todayDate.getDay(); // 0 = Sunday
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const weekStart = new Date(todayDate);
  weekStart.setDate(todayDate.getDate() - daysToMonday);
  const weekStartStr = weekStart.toISOString().slice(0, 10);

  const yearStartStr = `${todayDate.getFullYear()}-01-01`;

  const weekCount = workoutDays.filter(
    (d) => d.date >= weekStartStr && d.date <= todayPST
  ).length;
  const yearCount = workoutDays.filter(
    (d) => d.date >= yearStartStr && d.date <= todayPST
  ).length;

  return NextResponse.json({ workoutDays, weekCount, yearCount });
}
