import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db, schema } from "@/db";
import { eq, and } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userIdStr = cookieStore.get("userId")?.value;
    if (!userIdStr) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = parseInt(userIdStr, 10);
    const { date } = await request.json();
    if (!date) {
      return NextResponse.json({ error: "Date required" }, { status: 400 });
    }

    const existing = db
      .select()
      .from(schema.workoutCompletions)
      .where(
        and(
          eq(schema.workoutCompletions.userId, userId),
          eq(schema.workoutCompletions.date, date)
        )
      )
      .get();

    if (!existing) {
      db.insert(schema.workoutCompletions)
        .values({ userId, date })
        .run();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userIdStr = cookieStore.get("userId")?.value;
    if (!userIdStr) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = parseInt(userIdStr, 10);
    const date = request.nextUrl.searchParams.get("date");
    if (!date) {
      return NextResponse.json({ complete: false });
    }

    const completion = db
      .select()
      .from(schema.workoutCompletions)
      .where(
        and(
          eq(schema.workoutCompletions.userId, userId),
          eq(schema.workoutCompletions.date, date)
        )
      )
      .get();

    return NextResponse.json({ complete: !!completion });
  } catch (error) {
    return NextResponse.json({ complete: false, error: String(error) }, { status: 500 });
  }
}
