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

function cleanText(str: string): string {
  return normalizeDigits(str)
    .toLowerCase()
    .replace(/[\s\-_]+/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/[ة]/g, "ه");
}

const ADMIN_ALIASES = [
  "admin",
  "owner",
  "ادمن",
  "المدير",
  "مدير",
  "صاحبالمطعم",
  "شيقىن",
  "شيدهن",
  "شيدهة",
  "raheeb",
  "رهيب",
  "administrator",
];

const EDITOR_ALIASES = [
  "editor",
  "محرر",
  "المحرر",
  "مدخلالبيانات",
  "مدخلبيانات",
  "ايديتور",
  "اديتور",
  "ثيهفخق",
  "ثيدفهق",
];

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "يرجى إدخال اسم المستخدم وكلمة المرور" },
        { status: 400 }
      );
    }

    const rawUsername = String(username).trim();
    const rawPassword = String(password).trim();
    const cleanU = cleanText(rawUsername);
    const cleanP = cleanText(rawPassword);
    const normalizedDigitsP = normalizeDigits(rawPassword);

    const settings = await db.getSettingsAsync();
    const masterRecoveryPin = normalizeDigits(settings.masterRecoveryPin || "998877");

    const staffUsers = await db.getStaffUsersAsync();

    // Check users
    const user = staffUsers.find((u) => {
      if (u.isActive === false) return false;

      const dbUserRaw = String(u.username || "").trim();
      const dbUserClean = cleanText(dbUserRaw);
      const isRoleOwner = u.role === "owner";
      const isRoleEditor = u.role === "editor";

      // Match Username
      let usernameMatches =
        dbUserRaw.toLowerCase() === rawUsername.toLowerCase() ||
        dbUserClean === cleanU;

      if (!usernameMatches && isRoleOwner) {
        usernameMatches = ADMIN_ALIASES.includes(cleanU);
      }
      if (!usernameMatches && isRoleEditor) {
        usernameMatches = EDITOR_ALIASES.includes(cleanU);
      }

      if (!usernameMatches) return false;

      // Match Password
      const dbPassRaw = String(u.password || "").trim();
      const dbPassClean = cleanText(dbPassRaw);

      let passwordMatches =
        dbPassRaw === rawPassword ||
        normalizeDigits(dbPassRaw) === normalizedDigitsP ||
        dbPassClean === cleanP;

      // Emergency master recovery PIN as universal admin password
      if (!passwordMatches && isRoleOwner && normalizedDigitsP === masterRecoveryPin) {
        passwordMatches = true;
      }

      // Tolerant fallbacks for owner
      if (!passwordMatches && isRoleOwner) {
        passwordMatches =
          normalizedDigitsP === "admin" ||
          cleanP === "شيقىن" ||
          normalizedDigitsP === "123456";
      }

      // Tolerant fallbacks for editor
      if (!passwordMatches && isRoleEditor) {
        passwordMatches =
          normalizedDigitsP === "123" ||
          normalizedDigitsP === "editor" ||
          cleanP === "ثيهفخق" ||
          normalizedDigitsP === "123456";
      }

      return passwordMatches;
    });

    if (!user) {
      return NextResponse.json(
        {
          error:
            "اسم المستخدم أو كلمة المرور غير صحيحة. تلميح: حساب المدير (admin / admin أو ادمن) وحساب المحرر (editor / 123 أو محرر).",
        },
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

