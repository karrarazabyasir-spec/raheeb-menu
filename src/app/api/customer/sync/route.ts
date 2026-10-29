import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { CustomerReview, SavedAddress, SavedCustomerOrder } from "@/types";

// Helper to sanitize phone number (remove spaces, dashes, +964, etc.)
function sanitizePhone(raw: string): string {
  let cleaned = raw.replace(/[\s\-\(\)]/g, "");
  if (cleaned.startsWith("+964")) {
    cleaned = "0" + cleaned.substring(4);
  } else if (cleaned.startsWith("964")) {
    cleaned = "0" + cleaned.substring(3);
  }
  return cleaned;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawPhone = searchParams.get("phone");

    if (!rawPhone || rawPhone.trim().length < 6) {
      return NextResponse.json({ error: "رقم الهاتف مطلوب" }, { status: 400 });
    }

    const cleanPhone = sanitizePhone(rawPhone);
    const altPhone = cleanPhone.startsWith("0") ? cleanPhone.substring(1) : "0" + cleanPhone;

    // 1. Fetch all previous orders matching this phone from Supabase Cloud Database
    const { data: dbOrders, error: orderErr } = await supabaseAdmin
      .from("orders")
      .select("*")
      .or(`customer_phone.eq.${cleanPhone},customer_phone.eq.${altPhone},customer_phone.ilike.%${cleanPhone.slice(-8)}%`)
      .order("created_at", { ascending: false });

    if (orderErr) {
      console.error("Error querying customer orders:", orderErr);
    }

    const orders: SavedCustomerOrder[] = (dbOrders || []).map((row) => ({
      id: row.id,
      orderNumber: row.order_number,
      type: row.type || "takeaway",
      tableNumber: row.table_number || undefined,
      customerName: row.customer_name || undefined,
      customerPhone: row.customer_phone || undefined,
      pickupTime: row.pickup_time || undefined,
      total: row.total,
      createdAt: row.created_at,
      items: (row.items || []).map((item: any) => ({
        menuItemId: item.menuItemId || item.id,
        nameAr: item.nameAr,
        nameEn: item.nameEn,
        quantity: item.quantity,
        unitPrice: item.unitPrice || item.basePrice || 0,
        totalPrice: item.totalPrice || ((item.unitPrice || item.basePrice || 0) * (item.quantity || 1)),
        variantName: item.variantName,
        selectedOptionsText: item.selectedOptionsText,
        imageUrl: item.imageUrl,
      })),
    }));

    // 2. Fetch saved customer profile (addresses, reviews) from Supabase Cloud Storage
    let savedProfile: { addresses?: SavedAddress[]; reviews?: CustomerReview[]; name?: string } = {};
    try {
      const { data: fileData, error: fileErr } = await supabaseAdmin.storage
        .from("menu-images")
        .download(`customers/${cleanPhone}.json`);

      if (fileData && !fileErr) {
        const text = await fileData.text();
        savedProfile = JSON.parse(text);
      }
    } catch (e) {
      // No saved profile file yet, which is fine
    }

    let addresses: SavedAddress[] = savedProfile.addresses || [];

    // If no addresses saved yet, pre-fill from past order if available
    if (addresses.length === 0 && dbOrders && dbOrders.length > 0) {
      const lastNamedOrder = dbOrders.find((o) => o.customer_name);
      if (lastNamedOrder) {
        addresses = [
          {
            id: `addr-auto-${Date.now()}`,
            title: "عنواني السابق",
            area: "بغداد",
            street: "",
            phone: cleanPhone,
            isDefault: true,
          },
        ];
      }
    }

    const reviews: CustomerReview[] = savedProfile.reviews || [];

    return NextResponse.json({
      success: true,
      phone: cleanPhone,
      customerName: savedProfile.name || (dbOrders?.[0]?.customer_name || ""),
      orders,
      addresses,
      reviews,
    });
  } catch (error) {
    console.error("Customer lookup error:", error);
    return NextResponse.json({ error: "فشل استرجاع بيانات العميل" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, addresses, reviews, name } = body;

    if (!phone || phone.trim().length < 6) {
      return NextResponse.json({ error: "رقم الهاتف غير صالح" }, { status: 400 });
    }

    const cleanPhone = sanitizePhone(phone);

    // Save/update customer cloud profile in Supabase Storage
    const profilePayload = {
      phone: cleanPhone,
      name: name || "",
      addresses: addresses || [],
      reviews: reviews || [],
      updatedAt: new Date().toISOString(),
    };

    const { error } = await supabaseAdmin.storage
      .from("menu-images")
      .upload(`customers/${cleanPhone}.json`, JSON.stringify(profilePayload, null, 2), {
        upsert: true,
        contentType: "application/json",
      });

    if (error) {
      console.error("Failed to upload customer profile:", error);
      return NextResponse.json({ error: "تعذر حفظ الملف السحابي" }, { status: 500 });
    }

    return NextResponse.json({ success: true, phone: cleanPhone });
  } catch (error) {
    console.error("Customer sync save error:", error);
    return NextResponse.json({ error: "فشل الحفظ" }, { status: 500 });
  }
}
