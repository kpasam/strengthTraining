import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();
  const userIdStr = cookieStore.get("userId")?.value;
  if (!userIdStr) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const format = request.nextUrl.searchParams.get("format") || "csv";

  const logs = db
    .select({
      id: schema.workoutLogs.id,
      date: schema.workoutLogs.date,
      groupLabel: schema.workoutLogs.groupLabel,
      exerciseName: schema.exercises.canonicalName,
      setNumber: schema.workoutLogs.setNumber,
      weight: schema.workoutLogs.weight,
      weightUnit: schema.workoutLogs.weightUnit,
      reps: schema.workoutLogs.reps,
      duration: schema.workoutLogs.duration,
      rpe: schema.workoutLogs.rpe,
      notes: schema.workoutLogs.notes,
      variantFlags: schema.workoutLogs.variantFlags,
      completedAt: schema.workoutLogs.completedAt,
    })
    .from(schema.workoutLogs)
    .leftJoin(schema.exercises, eq(schema.workoutLogs.exerciseId, schema.exercises.id))
    .where(eq(schema.workoutLogs.userId, parseInt(userIdStr, 10)))
    .all();

  if (format === "csv") {
    if (logs.length === 0) return new NextResponse("No data", { headers: { "Content-Type": "text/csv" } });
    const keys = Object.keys(logs[0]);
    const header = keys.join(",");
    const rows = logs.map((log) => keys.map((k) => `"${String((log as any)[k] || "").replace(/"/g, '""')}"`).join(","));
    const csv = [header, ...rows].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="gym_tracker_export.csv"',
      },
    });
  }

  return NextResponse.json(logs, {
    headers: {
      "Content-Disposition": 'attachment; filename="gym_tracker_export.json"',
    },
  });
}
