import { NextResponse } from "next/server";
import { db } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const { tableNumber, type } = await request.json();
    if (!tableNumber || !type) {
      return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
    }

    const call = db.callWaiter(Number(tableNumber), type as "call" | "bill");
    return NextResponse.json({ success: true, call });
  } catch (error) {
    return NextResponse.json({ error: "تعذر إرسال الطلب" }, { status: 500 });
  }
}
