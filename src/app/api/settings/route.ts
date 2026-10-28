import { NextResponse } from "next/server";
import { db } from "@/lib/store";
import { broadcastLiveEvent } from "@/lib/realtime";

export async function GET() {
  const settings = db.getSettings();
  return NextResponse.json(settings);
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const updated = db.updateSettings(body);
    await broadcastLiveEvent("settings_updated", updated);
    return NextResponse.json(updated);

  } catch (error) {
    return NextResponse.json({ error: "فشل تحديث الإعدادات" }, { status: 400 });
  }
}
