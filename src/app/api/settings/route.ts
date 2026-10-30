import { NextResponse } from "next/server";
import { db } from "@/lib/store";
import { broadcastLiveEvent } from "@/lib/realtime";
import { deleteStorageImage, supabaseAdmin } from "@/lib/supabase";

export async function GET() {
  const settings = await db.getSettingsAsync();

  // If table 'delivery_zones' exists in Supabase DB, query it directly
  try {
    const { data: dbZones, error } = await supabaseAdmin
      .from("delivery_zones")
      .select("*")
      .order("created_at", { ascending: true });

    if (!error && Array.isArray(dbZones)) {
      settings.deliveryZones = dbZones.map((z: any) => ({
        id: z.id,
        nameAr: z.name_ar,
        nameEn: z.name_en || z.name_ar,
        fee: Number(z.fee) || 0,
        minOrder: Number(z.min_order) || 0,
        estimatedTime: z.estimated_time || "30-45 دقيقة",
        isActive: z.is_active ?? true,
      }));
    }
  } catch (err) {
    // If table doesn't exist yet, settings.deliveryZones from storage is used
  }

  return NextResponse.json(settings);
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const current = await db.getSettingsAsync();

    // Auto-cleanup old logo if replaced
    if (body.logoUrl && current.logoUrl && body.logoUrl !== current.logoUrl) {
      await deleteStorageImage(current.logoUrl);
    }

    // Sync delivery zones to Supabase 'delivery_zones' table if present
    if (Array.isArray(body.deliveryZones)) {
      try {
        const rowsToUpsert = body.deliveryZones.map((z: any) => ({
          id: z.id,
          name_ar: z.nameAr,
          name_en: z.nameEn || z.nameAr,
          fee: Number(z.fee) || 0,
          min_order: Number(z.minOrder) || 0,
          estimated_time: z.estimatedTime || "30-45 دقيقة",
          is_active: typeof z.isActive === "boolean" ? z.isActive : true,
        }));

        if (rowsToUpsert.length > 0) {
          const { error: upsertErr } = await supabaseAdmin
            .from("delivery_zones")
            .upsert(rowsToUpsert);

          if (!upsertErr) {
            const activeIds = body.deliveryZones.map((z: any) => z.id);
            const { data: existingRows } = await supabaseAdmin
              .from("delivery_zones")
              .select("id");
            if (existingRows) {
              const idsToDelete = existingRows
                .map((r: any) => r.id)
                .filter((id: string) => !activeIds.includes(id));
              if (idsToDelete.length > 0) {
                await supabaseAdmin.from("delivery_zones").delete().in("id", idsToDelete);
              }
            }
          }
        } else {
          await supabaseAdmin.from("delivery_zones").delete().neq("id", "___none___");
        }
      } catch (tableErr) {
        // Table doesn't exist yet in Supabase, config/store.json will handle persistence
      }
    }

    const updated = await db.updateSettings(body);
    await broadcastLiveEvent("settings_updated", updated);
    return NextResponse.json(updated);

  } catch (error) {
    return NextResponse.json({ error: "فشل تحديث الإعدادات" }, { status: 400 });
  }
}

