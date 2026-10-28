const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const supabaseUrl = "https://ofdgtioowdpthbnldfvk.supabase.co";
const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mZGd0aW9vd2RwdGhibmxkZnZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MzE4MDk3NywiZXhwIjoyMTA4NzU2OTc3fQ.5iU0PDcaqDvdIYEli_ksgDKopdPtmcBSASJo5NnafTc";

const client = createClient(supabaseUrl, serviceKey);

async function run() {
  const storePath = path.join(__dirname, "../data/store.json");
  const storeData = JSON.parse(fs.readFileSync(storePath, "utf8"));

  console.log("Uploading data to Supabase...");

  // 1. Settings
  const s = storeData.settings;
  const { error: sErr } = await client.from("settings").upsert({
    id: "main",
    name: s.name,
    name_en: s.nameEn,
    phone: s.phone,
    whatsapp: s.whatsapp,
    currency: s.currency,
    is_ordering_enabled: s.isOrderingEnabled,
    service_fee_percent: s.serviceFeePercent,
    tax_percent: s.taxPercent,
    opening_hours: s.openingHours,
    banner_message: s.bannerMessage,
    banner_active: s.bannerActive,
  });
  if (sErr) console.error("Settings error:", sErr);
  else console.log("✓ Settings uploaded");

  // 2. Categories
  const categoriesPayload = storeData.categories.map((c) => ({
    id: c.id,
    name_ar: c.nameAr,
    name_en: c.nameEn,
    icon_name: c.iconName,
    sort_order: c.sortOrder,
    is_active: c.isActive,
  }));
  const { error: cErr } = await client.from("categories").upsert(categoriesPayload);
  if (cErr) console.error("Categories error:", cErr);
  else console.log(`✓ ${categoriesPayload.length} Categories uploaded`);

  // 3. Menu items
  const itemsPayload = storeData.menuItems.map((i) => ({
    id: i.id,
    category_id: i.categoryId,
    name_ar: i.nameAr,
    name_en: i.nameEn,
    description_ar: i.descriptionAr,
    description_en: i.descriptionEn,
    base_price: i.basePrice,
    image_url: i.imageUrl,
    tags: i.tags,
    is_available: i.isAvailable,
    variants: i.variants || [],
    option_groups: i.optionGroups || [],
  }));
  const { error: iErr } = await client.from("menu_items").upsert(itemsPayload);
  if (iErr) console.error("Menu items error:", iErr);
  else console.log(`✓ ${itemsPayload.length} Menu items uploaded`);

  // 4. Tables
  const tablesPayload = storeData.tables.map((t) => ({
    id: t.id,
    number: t.number,
    label: t.label,
    section: t.section,
    status: t.status,
    active_order_id: t.activeOrderId || null,
  }));
  const { error: tErr } = await client.from("tables").upsert(tablesPayload);
  if (tErr) console.error("Tables error:", tErr);
  else console.log(`✓ ${tablesPayload.length} Tables uploaded`);

  console.log("SUCCESS: Supabase is fully populated!");
}

run();
