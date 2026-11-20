import { NextResponse } from "next/server";
import { db } from "@/lib/store";
import { Category } from "@/types";
import { supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const categories = await db.getCategoriesAsync();
  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  try {
    const categories: Category[] = await request.json();
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

    return NextResponse.json(saved);
  } catch (error) {
    return NextResponse.json({ error: "فشل حفظ الأقسام" }, { status: 400 });
  }
}
