import { NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  let body: {
    canonicalName?: string;
    bodyPart?: string;
    intensity?: string;
    movementType?: string;
    equipment?: string;
    isCardio?: boolean;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = body.canonicalName?.trim().toLowerCase();
  if (!name) {
    return NextResponse.json({ error: "canonicalName is required" }, { status: 400 });
  }

  // Check for duplicate
  const existing = db
    .select({ id: schema.exercises.id, canonicalName: schema.exercises.canonicalName })
    .from(schema.exercises)
    .where(eq(schema.exercises.canonicalName, name))
    .get();

  if (existing) {
    return NextResponse.json({ id: existing.id, canonicalName: existing.canonicalName, alreadyExists: true });
  }

  const result = db.transaction((tx) => {
    const newExercise = tx
      .insert(schema.exercises)
      .values({ canonicalName: name })
      .returning()
      .get();

    tx.insert(schema.exerciseLabels)
      .values({
        exerciseId: newExercise.id,
        isExercise: true,
        bodyPart: body.bodyPart || null,
        intensity: body.intensity || null,
        movementType: body.movementType || null,
        equipment: body.equipment || null,
        exerciseType: body.isCardio ? "timed" : "strength",
      })
      .run();

    return newExercise;
  });

  return NextResponse.json(
    { id: result.id, canonicalName: result.canonicalName, alreadyExists: false },
    { status: 201 }
  );
}
