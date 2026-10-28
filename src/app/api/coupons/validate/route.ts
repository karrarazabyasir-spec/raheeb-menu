import { NextResponse } from "next/server";
import { db } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const { code, subtotal } = await request.json();
    if (!code) {
      return NextResponse.json({ valid: false, discount: 0, message: "يرجى إدخال كود الخصم" }, { status: 400 });
    }

    const result = db.validateCoupon(code, Number(subtotal) || 0);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ valid: false, discount: 0, message: "خطأ في معالجة الكوبون" }, { status: 500 });
  }
}
