import { NextResponse } from "next/server";
import { db } from "@/lib/store";

function normalizeDigits(str: string): string {
  return String(str || "")
    .replace(/[٠۰]/g, "0")
    .replace(/[١۱]/g, "1")
    .replace(/[٢۲]/g, "2")
    .replace(/[٣۳]/g, "3")
    .replace(/[٤۴]/g, "4")
    .replace(/[٥۵]/g, "5")
    .replace(/[٦۶]/g, "6")
    .replace(/[٧۷]/g, "7")
    .replace(/[٨۸]/g, "8")
    .replace(/[٩۹]/g, "9")
    .trim();
}

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "يرجى إدخال اسم المستخدم وكلمة المرور" },
        { status: 400 }
      );
    }

    const cleanUsername = String(username).trim().toLowerCase();
    const cleanPassword = String(password).trim();

    const staffUsers = await db.getStaffUsersAsync();
    const user = staffUsers.find((u) => {
      const uUser = (u.username || "").toLowerCase().trim();
      const matchUsername =
        uUser === cleanUsername ||
        normalizeDigits(uUser) === normalizeDigits(cleanUsername);

      const uPass = (u.password || "").trim();
      const matchPassword =
        uPass === cleanPassword ||
        normalizeDigits(uPass) === normalizeDigits(cleanPassword);

      return matchUsername && matchPassword && u.isActive !== false;
    });

    if (!user) {
      return NextResponse.json(
        { error: "اسم المستخدم أو كلمة المرور غير صحيحة" },
        { status: 401 }
      );
    }

    const sessionPayload = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      issuedAt: Date.now(),
    };

    const sessionStr = Buffer.from(JSON.stringify(sessionPayload)).toString("base64");

    const response = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
      },
    });

    response.cookies.set("raheeb_staff_session", sessionStr, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "فشل تسجيل الدخول" },
      { status: 500 }
    );
  }
}

