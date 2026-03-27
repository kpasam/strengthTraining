import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const { username, pin } = await request.json();
    if (!username || !pin) {
      return NextResponse.json({ success: false, error: "Username and PIN required" }, { status: 400 });
    }

    let user = db.select().from(schema.users).where(eq(schema.users.username, username)).get();

    // Auto-create user for simplicity if they don't exist
    if (!user) {
      const hashedPin = await bcrypt.hash(pin, 10);
      user = db.insert(schema.users).values({ username, pin: hashedPin }).returning().get();
      // Fire-and-forget a full historic pull of all plans available
      fetch(new URL('/api/sync?full=true', request.url).toString(), { method: 'POST' }).catch(() => {});
    } else {
      // Support both legacy plaintext PINs and bcrypt hashes
      const isMatch = user.pin.startsWith("$2")
        ? await bcrypt.compare(pin, user.pin)
        : user.pin === pin;
      if (!isMatch) {
        return NextResponse.json({ success: false, error: "Incorrect PIN" }, { status: 401 });
      }
      // Migrate plaintext PIN to bcrypt on successful login
      if (!user.pin.startsWith("$2")) {
        const hashedPin = await bcrypt.hash(pin, 10);
        db.update(schema.users).set({ pin: hashedPin }).where(eq(schema.users.id, user.id)).run();
      }
    }

    const cookieStore = await cookies();
    cookieStore.set("userId", user.id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });

    return NextResponse.json({ success: true, user: { id: user.id, username: user.username } });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete("userId");
  return NextResponse.json({ success: true });
}
