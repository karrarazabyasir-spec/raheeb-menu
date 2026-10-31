import { NextResponse } from "next/server";
import { db } from "@/lib/store";
import { CustomerReview } from "@/types";
import { supabaseAdmin } from "@/lib/supabase";
import { broadcastLiveEvent } from "@/lib/realtime";

export async function GET() {
  try {
    const { data: supaReviews, error } = await supabaseAdmin
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false });

    if (supaReviews && !error && supaReviews.length > 0) {
      const mapped: CustomerReview[] = supaReviews.map((r) => ({
        id: r.id,
        orderId: r.order_id || undefined,
        orderNumber: r.order_number ? Number(r.order_number) : undefined,
        customerName: r.customer_name || undefined,
        customerPhone: r.customer_phone || undefined,
        orderType: r.order_type || undefined,
        rating: Number(r.rating) || 5,
        tags: Array.isArray(r.tags) ? r.tags : [],
        comment: r.comment || "",
        createdAt: r.created_at,
      }));
      return NextResponse.json(mapped);
    }
  } catch (err) {
    console.error("Supabase reviews fetch error, using store:", err);
  }

  const reviews = await db.getReviewsAsync();
  return NextResponse.json(reviews);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      orderId,
      orderNumber,
      customerName,
      customerPhone,
      orderType,
      rating,
      tags,
      comment,
    } = body;

    const numRating = Math.max(1, Math.min(5, Number(rating) || 5));
    const cleanTags = Array.isArray(tags) ? tags : [];
    const cleanComment = typeof comment === "string" ? comment.trim() : "";

    const review: CustomerReview = {
      id: `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      orderId: orderId || undefined,
      orderNumber: orderNumber ? Number(orderNumber) : undefined,
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
      orderType: orderType || undefined,
      rating: numRating,
      tags: cleanTags,
      comment: cleanComment,
      createdAt: new Date().toISOString(),
    };

    // 1. Save to store.json (guaranteed persistence in cloud storage and memory)
    await db.addReview(review);

    // 2. Try inserting into Supabase table if it exists
    try {
      await supabaseAdmin.from("reviews").insert({
        id: review.id,
        order_id: review.orderId || null,
        order_number: review.orderNumber || null,
        customer_name: review.customerName || null,
        customer_phone: review.customerPhone || null,
        order_type: review.orderType || null,
        rating: review.rating,
        tags: review.tags,
        comment: review.comment,
        created_at: review.createdAt,
      });
    } catch (err) {
      console.warn("Supabase table insert skipped (table might need creation):", err);
    }

    // 3. Broadcast real-time event to Admin
    try {
      broadcastLiveEvent("new_review", review);
    } catch (err) {
      console.error("Live event broadcast error:", err);
    }

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حفظ التقييم" },
      { status: 500 }
    );
  }
}
