import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPlanForDate } from "@/lib/queries/getPlanForDate";
import { getPreviousBest, getLastUsedUnit, getBestsForRepCounts } from "@/lib/queries/getPreviousBest";
import { getTodayLogs } from "@/lib/queries/getExerciseHistory";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const date = searchParams.get("date") || new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
  const cookieStore = await cookies();
  const userIdStr = cookieStore.get("userId")?.value;
  if (!userIdStr) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = parseInt(userIdStr, 10);

  const userRow = db.select().from(schema.users).where(eq(schema.users.id, userId)).get();
  const username = userRow?.username || "Unknown";

  const plan = getPlanForDate(date);
  if (!plan) {
    return NextResponse.json({ plan: null, date, username });
  }

  // Enrich each exercise with previous best and today's logs
  const todayLogs = getTodayLogs(userId, date);

  const enrichedGroups = plan.groups.map((group) => ({
    ...group,
    exercises: group.exercises.map((ex) => {
      const prevBest = getPreviousBest(userId, ex.exerciseId, date);
      const lastUnit = getLastUsedUnit(userId, ex.exerciseId);
      const logs = todayLogs.filter(
        (l) => l.exerciseId === ex.exerciseId && l.groupLabel === group.groupLabel
      );

      // Compute rep-specific bests for all prescribed rep counts
      const repCounts = (ex.prescribedReps || "")
        .split(",")
        .map((s: string) => parseInt(s.trim(), 10))
        .filter((n: number) => !isNaN(n));
      const repBests = getBestsForRepCounts(userId, ex.exerciseId, repCounts, date);

      return {
        ...ex,
        previousBest: prevBest,
        repBests,
        lastUsedUnit: lastUnit,
        todayLogs: logs.map((l) => ({
          id: l.id,
          setNumber: l.setNumber,
          weight: l.weight,
          weightUnit: l.weightUnit,
          reps: l.reps,
          notes: l.notes,
        })),
        completedSets: logs.length,
      };
    }),
  }));

  return NextResponse.json({
    plan: { ...plan, groups: enrichedGroups },
    date,
    username,
  });
}
