import { NextResponse } from "next/server";
import { db } from "@/lib/store";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (body.action === "toggle_availability") {
      const updated = db.toggleItemAvailability(id, body.isAvailable);
      return NextResponse.json(updated);
    }

    const existing = db.getMenuItemById(id);
    if (!existing) {
      return NextResponse.json({ error: "الصنف غير موجود" }, { status: 404 });
    }

    const updated = db.saveMenuItem({ ...existing, ...body });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "فشل تحديث الصنف" }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    db.deleteMenuItem(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "فشل حذف الصنف" }, { status: 400 });
  }
}
