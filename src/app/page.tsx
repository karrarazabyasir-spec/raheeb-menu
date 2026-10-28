"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Category, MenuItem, RestaurantSettings } from "@/types";
import { LanguageProvider, useLanguage } from "@/context/LanguageContext";
import { CartProvider, useCart } from "@/context/CartContext";
import { Header } from "@/components/Header";
import { Banner } from "@/components/Banner";
import { CategoryBar } from "@/components/CategoryBar";
import { MenuItemCard } from "@/components/MenuItemCard";
import { ItemCustomizerModal } from "@/components/ItemCustomizerModal";
import { CartDrawer } from "@/components/CartDrawer";
import {
  Search,
  ShoppingBag,
  Flame,
  Star,
  Leaf,
  Sparkles,
  Phone,
  MessageCircle,
  HelpCircle,
  Loader2,
} from "lucide-react";

function MenuContent() {
  const searchParams = useSearchParams();
  const { isRtl, t } = useLanguage();
  const { setTableNumber, totalItemsCount, subtotal, setIsCartOpen } = useCart();

  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [activeTag, setActiveTag] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeItem, setActiveItem] = useState<MenuItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Read table number from URL query ?table=X
  useEffect(() => {
    const tbl = searchParams.get("table");
    if (tbl) {
      const num = parseInt(tbl, 10);
      if (!isNaN(num) && num > 0) {
        setTableNumber(num);
      }
    }
  }, [searchParams, setTableNumber]);

  // Load menu data and settings
  const fetchData = async () => {
    try {
      const [settingsRes, catRes, menuRes] = await Promise.all([
        fetch("/api/settings"),
        fetch("/api/categories"),
        fetch("/api/menu"),
      ]);
      const [settingsData, catData, menuData] = await Promise.all([
        settingsRes.json(),
        catRes.json(),
        menuRes.json(),
      ]);
      setSettings(settingsData);
      setCategories(catData);
      setMenuItems(menuData);
    } catch (err) {
      console.error("Failed to load menu data", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Listen to real-time menu updates (price changes, sold out toggle)
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/events");
      eventSource.addEventListener("menu_updated", () => {
        fetchData();
      });
    } catch (e) {
      console.warn("SSE not available", e);
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  // Filter items by category, tag, and search query
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      // Category filter
      if (selectedCategoryId !== "all" && item.categoryId !== selectedCategoryId) {
        return false;
      }
      // Tag filter
      if (activeTag !== "all" && !item.tags.includes(activeTag as MenuItem["tags"][number])) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName =
          item.nameAr.toLowerCase().includes(query) ||
          item.nameEn.toLowerCase().includes(query);
        const matchesDesc =
          item.descriptionAr.toLowerCase().includes(query) ||
          item.descriptionEn.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc) return false;
      }
      return true;
    });
  }, [menuItems, selectedCategoryId, activeTag, searchQuery]);

  if (isLoading || !settings) {
    return (
      <div className="min-h-screen bg-[#fdfbf9] flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[#780000] flex items-center justify-center text-white shadow-xl animate-pulse">
          <Loader2 className="w-6 h-6 animate-spin text-amber-300" />
        </div>
        <p className="text-xs font-bold text-stone-600">جاري تحميل قائمة مطعم رهيب...</p>
      </div>
    );
  }

  const currency = isRtl ? settings.currency : settings.currencyEn;

  return (
    <div className="min-h-screen flex flex-col pb-24">
      {/* Header */}
      <Header settings={settings} />

      {/* Promotional Banner */}
      <Banner message={settings.bannerMessage} active={settings.bannerActive} />

      {/* Search & Tag Filter Bar */}
      <div className="max-w-6xl mx-auto w-full px-4 pt-4 pb-2 space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute top-3.5 right-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full text-xs sm:text-sm pr-10 pl-4 py-3 bg-white border border-stone-200 rounded-2xl shadow-xs focus:ring-2 focus:ring-[#780000] focus:outline-none transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute top-3 left-3 text-xs bg-stone-100 hover:bg-stone-200 text-stone-600 px-2 py-0.5 rounded-full"
            >
              مسح
            </button>
          )}
        </div>

        {/* Quick Tags Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            onClick={() => setActiveTag("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
              activeTag === "all"
                ? "bg-stone-900 text-white"
                : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
            }`}
          >
            الكل
          </button>
          <button
            onClick={() => setActiveTag("popular")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1 ${
              activeTag === "popular"
                ? "bg-amber-500 text-stone-950"
                : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
            }`}
          >
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>الأكثر طلباً</span>
          </button>
          <button
            onClick={() => setActiveTag("spicy")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1 ${
              activeTag === "spicy"
                ? "bg-red-600 text-white"
                : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-red-500 fill-red-500" />
            <span>حار</span>
          </button>
          <button
            onClick={() => setActiveTag("vegetarian")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1 ${
              activeTag === "vegetarian"
                ? "bg-emerald-600 text-white"
                : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
            }`}
          >
            <Leaf className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500" />
            <span>نباتي</span>
          </button>
          <button
            onClick={() => setActiveTag("new")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1 ${
              activeTag === "new"
                ? "bg-blue-600 text-white"
                : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-50"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span>جديد</span>
          </button>
        </div>
      </div>

      {/* Sticky Categories Bar */}
      <CategoryBar
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
      />

      {/* Menu Grid Content */}
      <main className="max-w-6xl mx-auto w-full px-4 pt-4 flex-1">
        {filteredItems.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <p className="text-stone-400 font-bold text-sm">
              لم نعثر على أصناف تطابق اختيارك
            </p>
            <button
              onClick={() => {
                setSelectedCategoryId("all");
                setActiveTag("all");
                setSearchQuery("");
              }}
              className="text-xs text-[#780000] font-bold underline"
            >
              عرض جميع الأصناف
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                settings={settings}
                onSelectItem={setActiveItem}
              />
            ))}
          </div>
        )}
      </main>

      {/* Item Customizer Modal */}
      <ItemCustomizerModal
        item={activeItem}
        settings={settings}
        onClose={() => setActiveItem(null)}
      />

      {/* Sliding Cart Drawer */}
      <CartDrawer settings={settings} />

      {/* Floating Bottom Cart Bar for mobile & instant checkout */}
      {totalItemsCount > 0 && (
        <div className="fixed bottom-3 inset-x-4 max-w-lg mx-auto z-30">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-[#780000] hover:bg-[#5c0000] text-white p-3.5 rounded-2xl shadow-2xl flex items-center justify-between border-2 border-white/20 active:scale-98 transition-all animate-bounce-short"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-400 text-stone-950 font-black flex items-center justify-center text-xs shadow">
                {totalItemsCount}
              </div>
              <div className="text-start">
                <span className="text-xs font-bold block">{t("cart")}</span>
                <span className="text-[10px] text-red-200">الدفع نقداً</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-black bg-white/20 px-2.5 py-1 rounded-lg">
                {subtotal} {currency}
              </span>
              <span className="text-xs font-bold underline">عرض الطلب ←</span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <LanguageProvider>
      <CartProvider>
        <Suspense fallback={null}>
          <MenuContent />
        </Suspense>
      </CartProvider>
    </LanguageProvider>
  );
}
