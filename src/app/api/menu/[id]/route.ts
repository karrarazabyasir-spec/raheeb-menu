import { NextResponse } from "next/server";
import { db } from "@/lib/store";
import { broadcastLiveEvent } from "@/lib/realtime";
import { supabaseAdmin, deleteStorageImage } from "@/lib/supabase";
import { MenuItem } from "@/types";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (body.action === "toggle_availability") {
      const isAvailable =
        typeof body.isAvailable === "boolean"
          ? body.isAvailable
          : !(db.getMenuItemById(id)?.isAvailable ?? false);

      // 1. Update in local/cache db
      const localUpdated = db.toggleItemAvailability(id, isAvailable);

      // 2. Persist synchronously to Supabase Database table 'menu_items'
      let cloudItem: MenuItem | null = null;
      try {
        const { data: supaUpdated, error: supaErr } = await supabaseAdmin
          .from("menu_items")
          .update({ is_available: isAvailable })
          .eq("id", id)
          .select()
          .single();

        if (supaUpdated && !supaErr) {
          cloudItem = {
            id: supaUpdated.id,
            categoryId: supaUpdated.category_id,
            nameAr: supaUpdated.name_ar,
            nameEn: supaUpdated.name_en,
            descriptionAr: supaUpdated.description_ar,
            descriptionEn: supaUpdated.description_en,
            basePrice: supaUpdated.base_price,
            imageUrl: supaUpdated.image_url,
            tags: supaUpdated.tags || [],
            isAvailable: supaUpdated.is_available,
            variants: supaUpdated.variants || [],
            optionGroups: supaUpdated.option_groups || [],
          };
        }
      } catch (err) {
        console.error("Supabase toggle availability error:", err);
      }

      // 3. Await cloud store backup sync
      await db.syncToCloud();

      const finalItem = cloudItem || localUpdated;
      if (finalItem) {
        await broadcastLiveEvent("menu_updated", finalItem);
      }
      return NextResponse.json(finalItem);
    }

    const existing = db.getMenuItemById(id);
    if (!existing) {
      return NextResponse.json({ error: "الصنف غير موجود" }, { status: 404 });
    }

    // Auto-cleanup: If image was updated, delete old image from storage
    if (body.imageUrl && existing.imageUrl && body.imageUrl !== existing.imageUrl) {
      await deleteStorageImage(existing.imageUrl);
    }

    const updatedData: MenuItem = { ...existing, ...body, id };
    const updated = db.saveMenuItem(updatedData);

    // Also persist to Supabase menu_items table
    try {
      await supabaseAdmin.from("menu_items").upsert({
        id: updated.id,
        category_id: updated.categoryId,
        name_ar: updated.nameAr,
        name_en: updated.nameEn,
        description_ar: updated.descriptionAr,
        description_en: updated.descriptionEn,
        base_price: updated.basePrice,
        image_url: updated.imageUrl,
        tags: updated.tags || [],
        is_available: updated.isAvailable,
        variants: updated.variants || [],
        option_groups: updated.optionGroups || [],
      });
      await db.syncToCloud();
    } catch (e) {
      console.error("Error upserting to Supabase menu_items:", e);
    }

    await broadcastLiveEvent("menu_updated", updated);
    return NextResponse.json(updated);

  } catch (error) {
    return NextResponse.json({ error: "فشل تحديث الصنف" }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Auto-cleanup: delete image file from storage bucket
    const existing = db.getMenuItemById(id);
    let imageToDelete = existing?.imageUrl;
    if (!imageToDelete) {
      const { data } = await supabaseAdmin
        .from("menu_items")
        .select("image_url")
        .eq("id", id)
        .single();
      imageToDelete = data?.image_url;
    }
    if (imageToDelete) {
      await deleteStorageImage(imageToDelete);
    }

    db.deleteMenuItem(id);
    try {
      await supabaseAdmin.from("menu_items").delete().eq("id", id);
      await db.syncToCloud();
    } catch (e) {
      console.error("Supabase delete error:", e);
    }
    await broadcastLiveEvent("menu_updated", { id, deleted: true });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "فشل حذف الصنف" }, { status: 400 });
  }
}

