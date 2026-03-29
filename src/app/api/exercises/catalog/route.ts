import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq, and, like, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const search = searchParams.get("search")?.trim() ?? "";
  const bodyPart = searchParams.get("bodyPart")?.trim() ?? "";
  const movementType = searchParams.get("movementType")?.trim() ?? "";

  // Build conditions: only labeled real exercises
  const conditions = [eq(schema.exerciseLabels.isExercise, true)];

  if (search) {
    conditions.push(like(schema.exercises.canonicalName, `%${search}%`));
  }
  if (bodyPart) {
    conditions.push(eq(schema.exerciseLabels.bodyPart, bodyPart));
  }
  if (movementType) {
    conditions.push(eq(schema.exerciseLabels.movementType, movementType));
  }

  const rows = db
    .select({
      id: schema.exercises.id,
      canonicalName: schema.exercises.canonicalName,
      bodyPart: schema.exerciseLabels.bodyPart,
      intensity: schema.exerciseLabels.intensity,
      movementType: schema.exerciseLabels.movementType,
      equipment: schema.exerciseLabels.equipment,
      exerciseType: schema.exerciseLabels.exerciseType,
    })
    .from(schema.exercises)
    .innerJoin(
      schema.exerciseLabels,
      eq(schema.exercises.id, schema.exerciseLabels.exerciseId)
    )
    .where(and(...conditions))
    .orderBy(sql`lower(${schema.exercises.canonicalName})`)
    .all();

  return NextResponse.json({ exercises: rows });
}
