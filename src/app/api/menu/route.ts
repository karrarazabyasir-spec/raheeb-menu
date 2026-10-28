import { NextResponse } from "next/server";
import { db } from "@/lib/store";
import { MenuItem } from "@/types";
import { broadcastLiveEvent } from "@/lib/realtime";

export async function GET() {
  const items = db.getMenuItems();
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  try {
    const item: MenuItem = await request.json();
    if (!item.id) {
      item.id = `item-${Date.now()}`;
    }
    const saved = db.saveMenuItem(item);
    await broadcastLiveEvent("menu_updated", saved);
    return NextResponse.json(saved);

  } catch (error) {
    return NextResponse.json({ error: "فشل حفظ الصنف" }, { status: 400 });
  }
}
