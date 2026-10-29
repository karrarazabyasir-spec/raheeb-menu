import { NextResponse } from "next/server";
import { db } from "@/lib/store";
import { Order, OrderStatus } from "@/types";
import { supabaseAdmin } from "@/lib/supabase";
import { broadcastLiveEvent } from "@/lib/realtime";



export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  // 1. Always query Supabase Cloud Database first (Single Source of Truth across all Vercel instances)
  try {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

    if (data && !error) {
      const order: Order = {
        id: data.id,
        orderNumber: data.order_number,
        type: data.type,
        tableNumber: data.table_number || undefined,
        customerName: data.customer_name || undefined,
        customerPhone: data.customer_phone || undefined,
        pickupTime: data.pickup_time || undefined,
        items: data.items,
        subtotal: data.subtotal,
        discount: data.discount,
        serviceFee: data.service_fee,
        tax: data.tax,
        total: data.total,
        paymentMethod: data.payment_method,
        status: data.status,
        cancelReason: data.cancel_reason || undefined,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      // Keep local store in sync with cloud database
      try {
        db.updateOrderStatus(order.id, order.status, order.cancelReason);
      } catch {}

      return NextResponse.json(order);
    }
  } catch (e) {
    console.error("Supabase order fetch error, falling back to local store:", e);
  }

  // 2. Fallback to in-memory/file store if cloud fetch fails
  const localOrder = db.getOrderById(id);
  if (!localOrder) {
    return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
  }
  return NextResponse.json(localOrder);
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

    // Also update directly in Supabase
    const { data: supaData } = await supabaseAdmin
      .from("orders")
      .update({
        status,
        cancel_reason: cancelReason || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (!updated && !supaData) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }

    const finalOrder = updated || {
      id: supaData.id,
      orderNumber: supaData.order_number,
      type: supaData.type,
      tableNumber: supaData.table_number || undefined,
      customerName: supaData.customer_name || undefined,
      customerPhone: supaData.customer_phone || undefined,
      pickupTime: supaData.pickup_time || undefined,
      items: supaData.items,
      subtotal: supaData.subtotal,
      discount: supaData.discount,
      serviceFee: supaData.service_fee,
      tax: supaData.tax,
      total: supaData.total,
      paymentMethod: supaData.payment_method,
      status: supaData.status,
      cancelReason: supaData.cancel_reason || undefined,
      createdAt: supaData.created_at,
      updatedAt: supaData.updated_at,
    };

    await broadcastLiveEvent("order_status_changed", finalOrder);

    return NextResponse.json(finalOrder);
  } catch (error) {
    return NextResponse.json({ error: "تعذر تحديث حالة الطلب" }, { status: 400 });
  }
}


