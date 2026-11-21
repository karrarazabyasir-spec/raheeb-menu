import { NextResponse } from "next/server";
import { db } from "@/lib/store";
import { Category } from "@/types";
import { supabaseAdmin } from "@/lib/supabase";
import { broadcastLiveEvent } from "@/lib/realtime";

export async function GET() {
  const categories = await db.getCategoriesAsync();
  const sorted = [...categories].sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));
  return NextResponse.json(sorted);
}

export async function POST(request: Request) {
  try {
    const categories: Category[] = await request.json();
    categories.forEach((c, idx) => {
      if (typeof c.sortOrder !== "number") {
        c.sortOrder = idx + 1;
      }
    });
    categories.sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));
    const saved = await db.saveCategories(categories);

    // Sync categories to Supabase 'categories' PostgreSQL table
    try {
      const catRows = categories.map((c) => ({
        id: c.id,
        name_ar: c.nameAr,
        name_en: c.nameEn || c.nameAr,
        icon_name: c.iconName || "Utensils",
        sort_order: c.sortOrder || 1,
        is_active: c.isActive !== false,
      }));
      if (catRows.length > 0) {
        await supabaseAdmin.from("categories").upsert(catRows);
      }
    } catch (catErr) {
      console.error("Categories table sync error:", catErr);
    }

    await broadcastLiveEvent("categories_updated", saved);
    return NextResponse.json(saved);
  } catch (error) {
    return NextResponse.json({ error: "فشل حفظ الأقسام" }, { status: 400 });
  }
}
