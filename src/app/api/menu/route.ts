import { NextResponse } from "next/server";
import { db } from "@/lib/store";
import { MenuItem } from "@/types";

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
    return NextResponse.json(saved);
  } catch (error) {
    return NextResponse.json({ error: "فشل حفظ الصنف" }, { status: 400 });
  }
}
