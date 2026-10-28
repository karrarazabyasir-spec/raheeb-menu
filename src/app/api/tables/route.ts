import { NextResponse } from "next/server";
import { db } from "@/lib/store";
import { Table } from "@/types";

export async function GET() {
  const tables = db.getTables();
  const waiterCalls = db.getActiveWaiterCalls();
  return NextResponse.json({ tables, waiterCalls });
}

export async function POST(request: Request) {
  try {
    const body: Table[] = await request.json();
    const saved = db.saveTables(body);
    return NextResponse.json(saved);
  } catch (error) {
    return NextResponse.json({ error: "فشل حفظ الطاولات" }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { tableNumber, status, activeOrderId } = await request.json();
    const updated = db.updateTableStatus(Number(tableNumber), status, activeOrderId);
    if (!updated) {
      return NextResponse.json({ error: "الطاولة غير موجودة" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "فشل تحديث حالة الطاولة" }, { status: 400 });
  }
}
