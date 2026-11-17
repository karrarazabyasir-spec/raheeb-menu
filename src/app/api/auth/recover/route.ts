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
    const body = await request.json();
    const { pin, newPassword, username } = body;

    if (!pin || !newPassword) {
      return NextResponse.json(
        { error: "يرجى إدخال رمز أمان الطوارئ وكلمة المرور الجديدة" },
        { status: 400 }
      );
    }

    const settings = await db.getSettingsAsync();
    const masterPin = normalizeDigits(settings.masterRecoveryPin || "998877");
    const inputPin = normalizeDigits(pin);

    if (inputPin !== masterPin) {
      return NextResponse.json(
        { error: "رمز أمان الطوارئ غير صحيح! يرجى التأكد من الرمز والمحاولة ثانية." },
        { status: 401 }
      );
    }

    if (newPassword.trim().length < 3) {
      return NextResponse.json(
        { error: "كلمة المرور الجديدة يجب أن تتكون من 3 خانات على الأقل" },
        { status: 400 }
      );
    }

    const cleanPassword = normalizeDigits(newPassword.trim());
    const targetUsername = username ? normalizeDigits(username.trim().toLowerCase()) : "admin";

    const staffUsers = await db.getStaffUsersAsync();
    // Look for user matching username or the first owner
    let targetUser = staffUsers.find(
      (u) =>
        normalizeDigits(u.username.toLowerCase()) === targetUsername ||
        u.role === "owner"
    );

    if (targetUser) {
      await db.updateStaffUser(targetUser.id, {
        password: cleanPassword,
        isActive: true,
      });
    } else {
      // Create new owner user if not found
      targetUser = {
        id: "user-owner-1",
        username: targetUsername || "admin",
        name: "صاحب المطعم (المدير)",
        password: cleanPassword,
        role: "owner",
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      await db.addStaffUser(targetUser);
    }

    return NextResponse.json({
      ok: true,
      message: `تمت استعادة حساب المدير (${targetUser.username}) وتحديث كلمة المرور بنجاح!`,
      username: targetUser.username,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "فشلت عملية استعادة الحساب" },
      { status: 500 }
    );
  }
}
