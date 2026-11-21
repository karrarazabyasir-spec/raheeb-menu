import { NextResponse } from "next/server";
import { db } from "@/lib/store";
import { Category } from "@/types";
import { supabaseAdmin } from "@/lib/supabase";
import { broadcastLiveEvent } from "@/lib/realtime";

export async function GET() {
  const localCategories = await db.getCategoriesAsync();

  // Also query Supabase table 'categories' and merge
  try {
    const { data: dbCats, error } = await supabaseAdmin
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });

    if (dbCats && !error && dbCats.length > 0) {
      const catMap = new Map<string, Category>();
      localCategories.forEach((c) => catMap.set(c.id, c));

      dbCats.forEach((row) => {
        let nameEn = row.name_en || row.name_ar;
        let subcategories: string[] | undefined = undefined;

        if (row.name_en && typeof row.name_en === "string" && row.name_en.startsWith("{")) {
          try {
            const parsed = JSON.parse(row.name_en);
            nameEn = parsed.en || row.name_ar;
            if (Array.isArray(parsed.subs)) {
              subcategories = parsed.subs;
            }
          } catch {}
        }

        const local = catMap.get(row.id);
        catMap.set(row.id, {
          id: row.id,
          nameAr: row.name_ar,
          nameEn: nameEn,
          iconName: row.icon_name || "Utensils",
          sortOrder: row.sort_order || 1,
          isActive: row.is_active !== false,
          subcategories: local?.subcategories || subcategories || [],
        });
      });

      const merged = Array.from(catMap.values()).sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));
      return NextResponse.json(merged);
    }
  } catch (err) {
    console.error("Supabase categories fetch error:", err);
  }

  const sorted = [...localCategories].sort((a, b) => (a.sortOrder || 999) - (b.sortOrder || 999));
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
        name_en: c.subcategories && c.subcategories.length > 0
          ? JSON.stringify({ en: c.nameEn || c.nameAr, subs: c.subcategories })
          : (c.nameEn || c.nameAr),
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
