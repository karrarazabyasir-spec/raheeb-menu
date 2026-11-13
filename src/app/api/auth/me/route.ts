import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/store";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("raheeb_staff_session")?.value;

    if (!sessionCookie) {
      return NextResponse.json({ user: null });
    }

    let payload: any = null;
    try {
      const decoded = Buffer.from(sessionCookie, "base64").toString("utf-8");
      payload = JSON.parse(decoded);
    } catch {
      return NextResponse.json({ user: null });
    }

    if (!payload?.id) {
      return NextResponse.json({ user: null });
    }

    const staffUsers = await db.getStaffUsersAsync();
    const matched = staffUsers.find((u) => u.id === payload.id && u.isActive !== false);

    if (!matched) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({
      user: {
        id: matched.id,
        username: matched.username,
        name: matched.name,
        role: matched.role,
      },
    });
  } catch {
    return NextResponse.json({ user: null });
  }
}
