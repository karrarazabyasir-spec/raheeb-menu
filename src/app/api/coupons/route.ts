import { NextResponse } from "next/server";
import { db } from "@/lib/store";
import { Coupon } from "@/types";

export async function GET() {
  const coupons = db.getCoupons();
  return NextResponse.json(coupons);
}

export async function POST(request: Request) {
  try {
    const body: Coupon = await request.json();
    if (!body.code || !body.code.trim()) {
      return NextResponse.json({ error: "كود الخصم مطلوب" }, { status: 400 });
    }

    if (!body.value || Number(body.value) <= 0) {
      return NextResponse.json({ error: "قيمة الخصم يجب أن تكون أكبر من صفر" }, { status: 400 });
    }

    const saved = db.saveCoupon({
      code: body.code.trim().toUpperCase(),
      type: body.type === "fixed" ? "fixed" : "percent",
      value: Number(body.value),
      minOrderValue: body.minOrderValue ? Number(body.minOrderValue) : undefined,
      isActive: typeof body.isActive === "boolean" ? body.isActive : true,
      description: body.description?.trim() || undefined,
    });

    return NextResponse.json(saved);
  } catch (error) {
    return NextResponse.json({ error: "فشل حفظ كود الخصم" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    if (!code) {
      return NextResponse.json({ error: "كود الخصم مطلوب للحذف" }, { status: 400 });
    }

    const deleted = db.deleteCoupon(code);
    return NextResponse.json({ success: deleted });
  } catch (error) {
    return NextResponse.json({ error: "فشل حذف كود الخصم" }, { status: 500 });
  }
}
