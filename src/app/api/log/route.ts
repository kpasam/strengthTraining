import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { logSet, deleteLog, updateLog } from "@/lib/queries/logSet";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userIdStr = cookieStore.get("userId")?.value;
    if (!userIdStr) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = parseInt(userIdStr, 10);

    const body = await request.json();
    const result = logSet({
      userId,
      date: body.date,
      exerciseId: body.exerciseId,
      variantFlags: body.variantFlags || [],
      groupLabel: body.groupLabel,
      setNumber: body.setNumber,
      weight: body.weight ?? null,
      weightUnit: body.weightUnit || "lbs",
      reps: body.reps ?? null,
      duration: body.duration ?? null,
      distance: body.distance ?? null,
      rpe: body.rpe ?? null,
      notes: body.notes || "",
    });

    return NextResponse.json({ success: true, log: result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    deleteLog(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: "Missing ID" }, { status: 400 });
    }
    
    const result = updateLog(body.id, {
      weight: body.weight ?? null,
      weightUnit: body.weightUnit || "lbs",
      reps: body.reps ?? null,
      duration: body.duration ?? null,
      distance: body.distance ?? null,
      rpe: body.rpe ?? null,
      notes: body.notes || "",
    });

    return NextResponse.json({ success: true, log: result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}

