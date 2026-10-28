import { NextResponse } from "next/server";
import { db } from "@/lib/store";

export async function GET() {
  const settings = db.getSettings();
  return NextResponse.json(settings);
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const updated = db.updateSettings(body);
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "فشل تحديث الإعدادات" }, { status: 400 });
  }
}
