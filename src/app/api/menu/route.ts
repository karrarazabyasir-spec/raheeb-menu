import { NextResponse } from "next/server";
import { db } from "@/lib/store";
import { MenuItem } from "@/types";
import { broadcastLiveEvent } from "@/lib/realtime";
import { supabaseAdmin, deleteStorageImage } from "@/lib/supabase";
import { initialMenuItems } from "@/lib/initialData";

const initialOrderMap = new Map<string, number>();
initialMenuItems.forEach((item, index) => initialOrderMap.set(item.id, index));

export async function GET() {
  const localItems = await db.getMenuItemsAsync();

  // 1. Query Supabase Database table 'menu_items'
  try {
    const { data, error } = await supabaseAdmin
      .from("menu_items")
      .select("*");

    if (data && !error && data.length > 0) {
      const dbItems: MenuItem[] = data.map((row) => ({
        id: row.id,
        categoryId: row.category_id,
        nameAr: row.name_ar,
        nameEn: row.name_en,
        descriptionAr: row.description_ar,
        descriptionEn: row.description_en,
        basePrice: row.base_price,
        imageUrl: row.image_url,
        tags: row.tags || [],
        isAvailable: row.is_available,
        variants: row.variants || [],
        optionGroups: row.option_groups || [],
        sortOrder: row.sort_order ?? undefined,
        subcategory: row.subcategory || undefined,
      }));

      // Merge items from Supabase table and local store to ensure NO dishes are ever lost
      const itemMap = new Map<string, MenuItem>();
      localItems.forEach((item) => itemMap.set(item.id, item));
      dbItems.forEach((item) => {
        const local = itemMap.get(item.id);
        itemMap.set(item.id, {
          ...item,
          sortOrder: local?.sortOrder ?? item.sortOrder,
          subcategory: local?.subcategory ?? item.subcategory,
        });
      });

      const merged = Array.from(itemMap.values());

      // Preserve canonical menu order by sortOrder
      merged.sort((a, b) => {
        const orderA = typeof a.sortOrder === "number" ? a.sortOrder : (initialOrderMap.has(a.id) ? initialOrderMap.get(a.id)! + 1 : 999);
        const orderB = typeof b.sortOrder === "number" ? b.sortOrder : (initialOrderMap.has(b.id) ? initialOrderMap.get(b.id)! + 1 : 999);
        return orderA - orderB;
      });

      // Update in-memory cache
      db.setMenuItemsCache(merged);

      return NextResponse.json(merged);
    }
  } catch (err) {
    console.error("Supabase menu fetch error, falling back to local db:", err);
  }

  // 2. Fallback to local store (sorted by sortOrder)
  const sortedLocal = [...localItems].sort((a, b) => {
    const orderA = typeof a.sortOrder === "number" ? a.sortOrder : (initialOrderMap.has(a.id) ? initialOrderMap.get(a.id)! + 1 : 999);
    const orderB = typeof b.sortOrder === "number" ? b.sortOrder : (initialOrderMap.has(b.id) ? initialOrderMap.get(b.id)! + 1 : 999);
    return orderA - orderB;
  });
  return NextResponse.json(sortedLocal);
}

export async function POST(request: Request) {
  try {
    const item: MenuItem = await request.json();

    // Auto-cleanup: If updating an existing item with a new image, delete the old image from storage
    if (item.id) {
      const existing = db.getMenuItemById(item.id);
      let oldImage = existing?.imageUrl;
      if (!oldImage) {
        const { data } = await supabaseAdmin
          .from("menu_items")
          .select("image_url")
          .eq("id", item.id)
          .single();
        oldImage = data?.image_url;
      }
      if (oldImage && item.imageUrl && oldImage !== item.imageUrl) {
        await deleteStorageImage(oldImage);
      }
    }

    if (!item.id) {
      item.id = `item-${Date.now()}`;
    }
    if (typeof item.sortOrder !== "number") {
      const currentList = await db.getMenuItemsAsync();
      item.sortOrder = currentList.length + 1;
    }
    const saved = await db.saveMenuItem(item);

    // Ensure item's category exists in Supabase 'categories' table first to prevent Foreign Key errors
    if (saved.categoryId) {
      try {
        const allCats = db.getCategories();
        const category = allCats.find((c) => c.id === saved.categoryId);
        if (category) {
          await supabaseAdmin.from("categories").upsert({
            id: category.id,
            name_ar: category.nameAr,
            name_en: category.nameEn || category.nameAr,
            icon_name: category.iconName || "Utensils",
            sort_order: category.sortOrder || 1,
            is_active: category.isActive !== false,
          });
        }
      } catch (catErr) {
        console.error("Category auto-sync error:", catErr);
      }
    }

    // Sync to Supabase menu_items
    try {
      const { error: upsertErr } = await supabaseAdmin.from("menu_items").upsert({
        id: saved.id,
        category_id: saved.categoryId,
        name_ar: saved.nameAr,
        name_en: saved.nameEn,
        description_ar: saved.descriptionAr,
        description_en: saved.descriptionEn,
        base_price: saved.basePrice,
        image_url: saved.imageUrl,
        tags: saved.tags || [],
        is_available: saved.isAvailable,
        variants: saved.variants || [],
        option_groups: saved.optionGroups || [],
      });
      if (upsertErr) {
        console.error("Supabase menu item upsert error:", upsertErr);
      }
      await db.syncToCloud();
    } catch (e) {
      console.error("Supabase menu item insert error:", e);
    }

    await broadcastLiveEvent("menu_updated", saved);
    return NextResponse.json(saved);

  } catch (error) {
    return NextResponse.json({ error: "فشل حفظ الصنف" }, { status: 400 });
  }
}

