import { NextResponse } from "next/server";
import { db } from "@/lib/store";
import { OrderStatus } from "@/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const order = db.getOrderById(id);
  if (!order) {
    return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
  }
  return NextResponse.json(order);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, cancelReason } = body as { status: OrderStatus; cancelReason?: string };

    const updated = db.updateOrderStatus(id, status, cancelReason);
    if (!updated) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "تعذر تحديث حالة الطلب" }, { status: 400 });
  }
}
