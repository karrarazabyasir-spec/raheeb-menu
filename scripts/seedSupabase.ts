import { createClient } from "@supabase/supabase-js";
import { initialCategories, initialMenuItems, initialSettings, initialTables } from "../src/lib/initialData";

const supabaseUrl = "https://ofdgtioowdpthbnldfvk.supabase.co";
const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZGd0aW9vd2RwdGhibmxkZnZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzE4MDk3NywiZXhwIjoyMTA4NzU2OTc3fQ.5iU0PDcaqDvdIYEli_ksgDKopdPtmcBSASJo5NnafTc";

const client = createClient(supabaseUrl, serviceKey);

async function runSeed() {
  console.log("🌱 Starting Supabase Seeding for Raheeb Menu...");

  // 1. Settings
  const { error: settingsErr } = await client.from("settings").upsert({
    id: "main",
    name: initialSettings.name,
    name_en: initialSettings.nameEn,
    phone: initialSettings.phone,
    whatsapp: initialSettings.whatsapp,
    currency: initialSettings.currency,
    is_ordering_enabled: initialSettings.isOrderingEnabled,
    service_fee_percent: initialSettings.serviceFeePercent,
    tax_percent: initialSettings.taxPercent,
    opening_hours: initialSettings.openingHours,
    banner_message: initialSettings.bannerMessage,
    banner_active: initialSettings.bannerActive,
  });
  if (settingsErr) console.error("Error seeding settings:", settingsErr);
  else console.log("✓ Settings seeded");

  // 2. Categories
  const categoriesPayload = initialCategories.map((c) => ({
    id: c.id,
    name_ar: c.nameAr,
    name_en: c.nameEn,
    icon_name: c.iconName,
    sort_order: c.sortOrder,
    is_active: c.isActive,
  }));
  const { error: catErr } = await client.from("categories").upsert(categoriesPayload);
  if (catErr) console.error("Error seeding categories:", catErr);
  else console.log(`✓ ${categoriesPayload.length} Categories seeded`);

  // 3. Menu Items
  const itemsPayload = initialMenuItems.map((item) => ({
    id: item.id,
    category_id: item.categoryId,
    name_ar: item.nameAr,
    name_en: item.nameEn,
    description_ar: item.descriptionAr,
    description_en: item.descriptionEn,
    base_price: item.basePrice,
    image_url: item.imageUrl,
    tags: item.tags,
    is_available: item.isAvailable,
    variants: item.variants || [],
    option_groups: item.optionGroups || [],
  }));
  const { error: itemErr } = await client.from("menu_items").upsert(itemsPayload);
  if (itemErr) console.error("Error seeding menu items:", itemErr);
  else console.log(`✓ ${itemsPayload.length} Menu items seeded`);

  // 4. Tables
  const tablesPayload = initialTables.map((t) => ({
    id: t.id,
    number: t.number,
    label: t.label,
    section: t.section,
    status: t.status,
    active_order_id: t.activeOrderId || null,
  }));
  const { error: tblErr } = await client.from("tables").upsert(tablesPayload);
  if (tblErr) console.error("Error seeding tables:", tblErr);
  else console.log(`✓ ${tablesPayload.length} Tables seeded`);

  console.log("🎉 Seeding complete! Supabase database is fully loaded and ready.");
}

runSeed();
