import { NextResponse } from "next/server";
import { db } from "@/lib/store";
import { broadcastLiveEvent } from "@/lib/realtime";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Accept { items: [...] } or { orderedIds: [...] } or direct array [...]
    const itemsOrIds = body.items || body.orderedIds || (Array.isArray(body) ? body : null);
    if (!Array.isArray(itemsOrIds)) {
      return NextResponse.json({ error: "بيانات الترتيب غير صالحة" }, { status: 400 });
    }

    const reordered = await db.reorderMenuItems(itemsOrIds);
    await broadcastLiveEvent("menu_updated", reordered);

    return NextResponse.json({ success: true, items: reordered });
  } catch (error) {
    console.error("Reorder menu items error:", error);
    return NextResponse.json({ error: "فشل حفظ ترتيب الأصناف" }, { status: 500 });
  }
}

