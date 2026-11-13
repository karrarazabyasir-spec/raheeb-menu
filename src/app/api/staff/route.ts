import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/store";
import { StaffUser } from "@/types";

// Helper to check if caller is owner
async function getCallerRole(): Promise<"owner" | "editor" | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("raheeb_staff_session")?.value;
    if (!sessionCookie) return null;
    const decoded = Buffer.from(sessionCookie, "base64").toString("utf-8");
    const payload = JSON.parse(decoded);
    return payload?.role || null;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const users = await db.getStaffUsersAsync();
    // Return users list
    const sanitized = users.map((u) => ({
      id: u.id,
      username: u.username,
      name: u.name,
      role: u.role,
      password: u.password,
      isActive: u.isActive !== false,
      createdAt: u.createdAt,
    }));
    return NextResponse.json(sanitized);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const callerRole = await getCallerRole();
    if (callerRole !== "owner") {
      return NextResponse.json(
        { error: "غير مصرح، إضافة الحسابات متاحة للمدير فقط" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { username, name, password, role } = body;

    if (!username?.trim() || !password?.trim() || !name?.trim()) {
      return NextResponse.json(
        { error: "يرجى تعبئة جميع الحقول المطلوبة (الاسم، اسم المستخدم، كلمة المرور)" },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase();
    const currentUsers = await db.getStaffUsersAsync();

    if (currentUsers.some((u) => u.username.toLowerCase() === cleanUsername)) {
      return NextResponse.json(
        { error: "اسم المستخدم هذا مسجل مسبقاً، يرجى اختيار اسم مستخدم آخر" },
        { status: 400 }
      );
    }

    const newUser: StaffUser = {
      id: `staff-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      username: cleanUsername,
      name: name.trim(),
      password: password.trim(),
      role: role === "owner" ? "owner" : "editor",
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    await db.addStaffUser(newUser);

    return NextResponse.json({ ok: true, user: newUser });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const callerRole = await getCallerRole();
    if (callerRole !== "owner") {
      return NextResponse.json(
        { error: "غير مصرح، تعديل الحسابات متاح للمدير فقط" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, name, password, role, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "معرف الحساب مطلوب" }, { status: 400 });
    }

    const updates: Partial<StaffUser> = {};
    if (name?.trim()) updates.name = name.trim();
    if (password?.trim()) updates.password = password.trim();
    if (role === "owner" || role === "editor") updates.role = role;
    if (typeof isActive === "boolean") updates.isActive = isActive;

    const updated = await db.updateStaffUser(id, updates);
    if (!updated) {
      return NextResponse.json({ error: "الحساب غير موجود" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, user: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const callerRole = await getCallerRole();
    if (callerRole !== "owner") {
      return NextResponse.json(
        { error: "غير مصرح، حذف الحسابات متاح للمدير فقط" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "معرف الحساب مطلوب" }, { status: 400 });
    }

    const currentUsers = await db.getStaffUsersAsync();
    const target = currentUsers.find((u) => u.id === id);

    if (target?.role === "owner") {
      const remainingOwners = currentUsers.filter((u) => u.role === "owner" && u.id !== id);
      if (remainingOwners.length === 0) {
        return NextResponse.json(
          { error: "لا يمكن حذف حساب المدير الوحيد في النظام" },
          { status: 400 }
        );
      }
    }

    await db.deleteStaffUser(id);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
