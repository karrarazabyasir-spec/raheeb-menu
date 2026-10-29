"use client";

import React, { useEffect, useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Category, MenuItem, RestaurantSettings } from "@/types";
import { LanguageProvider, useLanguage } from "@/context/LanguageContext";
import { CartProvider, useCart } from "@/context/CartContext";
import { CustomerProvider } from "@/context/CustomerContext";
import { Header } from "@/components/Header";
import { Banner } from "@/components/Banner";
import { CategoryBar } from "@/components/CategoryBar";
import { MenuItemCard } from "@/components/MenuItemCard";
import { ItemCustomizerModal } from "@/components/ItemCustomizerModal";
import { CartDrawer } from "@/components/CartDrawer";
import { CustomerProfileDrawer } from "@/components/CustomerProfileDrawer";
import { Footer } from "@/components/Footer";
import { subscribeToLiveEvents } from "@/lib/realtime";
import { LottiePreloader } from "@/components/LottiePreloader";


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
  ChevronLeft,
} from "lucide-react";

function MenuContent() {
  const searchParams = useSearchParams();
  const { isRtl, t } = useLanguage();
  const { setTableNumber, setOrderType, totalItemsCount, subtotal, setIsCartOpen } = useCart();

  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [activeTag, setActiveTag] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeItem, setActiveItem] = useState<MenuItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Automatically detect table from URL QR query (?table=X), otherwise default to delivery
  useEffect(() => {
    const tbl = searchParams.get("table");
    if (tbl) {
      const num = parseInt(tbl, 10);
      if (!isNaN(num) && num > 0) {
        setTableNumber(num);
        setOrderType("table");
        return;
      }
    }
    // Direct link -> automatically delivery / takeaway
    setTableNumber(null);
    setOrderType("takeaway");
  }, [searchParams, setTableNumber, setOrderType]);

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

    // Supabase Realtime WebSocket subscription (<100ms instant updates)
    const unsubscribe = subscribeToLiveEvents((event, payload) => {
      if (event === "menu_updated") {
        if (payload && payload.id) {
          setMenuItems((prev) =>
            prev.map((i) => (i.id === payload.id ? { ...i, ...payload } : i))
          );
        } else {
          fetchData();
        }
      } else if (event === "settings_updated") {
        fetchData();
      }
    });

    return () => {
      unsubscribe();
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
      <div className="min-h-screen bg-[#fdfbf9] flex items-center justify-center">
        <LottiePreloader text="أهلاً بكم في مطعم رهيب... جاري تحضير المينيو" size={190} />
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
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4">
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

      {/* Footer with language switch and restaurant info */}
      <Footer settings={settings} />

      {/* Item Customizer Modal */}
      <ItemCustomizerModal
        item={activeItem}
        settings={settings}
        onClose={() => setActiveItem(null)}
      />

      {/* Sliding Cart Drawer */}
      <CartDrawer settings={settings} />

      {/* Customer Profile Drawer (طلباتي السابقة، آرائي، عناويني) */}
      <CustomerProfileDrawer settings={settings} />

      {/* Floating Bottom Cart Bar (matching the sleek pill design in the reference) */}
      {totalItemsCount > 0 && (
        <div className="fixed bottom-4 inset-x-3 sm:inset-x-4 max-w-md mx-auto z-30 animate-fade-in">
          <button
            onClick={() => setIsCartOpen(true)}
            style={{ backgroundColor: settings?.primaryColor || "#780000" }}
            className="w-full text-white px-4 py-3 sm:py-3.5 rounded-2xl sm:rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.3)] flex items-center justify-between border border-white/20 active:scale-98 transition-all hover:brightness-105"
          >
            {/* Bag icon + "عرض السلة (X)" */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-white shrink-0">
                <ShoppingBag className="w-4 h-4 text-amber-300" />
              </div>
              <span className="text-xs sm:text-sm font-black tracking-wide">
                {isRtl ? `عرض السلة (${totalItemsCount})` : `View cart (${totalItemsCount})`}
              </span>
            </div>

            {/* Total price + chevron '>' */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-xs sm:text-sm font-black tracking-tight">
                {subtotal.toLocaleString()} {currency}
              </span>
              <ChevronLeft className="w-4 h-4 text-white/90 stroke-[2.5] transform ltr:rotate-180" />
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
        <CustomerProvider>
          <Suspense fallback={null}>
            <MenuContent />
          </Suspense>
        </CustomerProvider>
      </CartProvider>
    </LanguageProvider>
  );
}
