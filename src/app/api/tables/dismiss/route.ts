import { NextResponse } from "next/server";
import { db } from "@/lib/store";

export async function POST(request: Request) {
  try {
    const { callId } = await request.json();
    if (!callId) {
      return NextResponse.json({ error: "معرف الطلب مطلوب" }, { status: 400 });
    }

    const success = db.dismissWaiterCall(callId);
    return NextResponse.json({ success });
  } catch (error) {
    return NextResponse.json({ error: "تعذر إغلاق الطلب" }, { status: 500 });
  }
}
