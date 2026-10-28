"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { subscribeToLiveEvents, broadcastLiveEvent } from "@/lib/realtime";

import {
  Category,
  Coupon,
  ItemVariant,
  MenuItem,
  OptionGroup,
  OptionItem,
  Order,
  RestaurantSettings,
  Table,
} from "@/types";
import {
  BarChart3,
  UtensilsCrossed,
  QrCode,
  Tag,
  Settings,
  Plus,
  Trash2,
  Edit,
  Save,
  Download,
  Printer,
  FileSpreadsheet,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  Percent,
  Layers,
  Palette,
  Image as ImageIcon,
  Check,
  ChevronDown,
  X,
  UploadCloud,
  Loader2,
  Calendar,
  ArrowUpRight,
  PieChart,
  Award,
  Users,
  ChefHat,
  Filter,
  CheckCircle,
  XCircle,
  Flame,
} from "lucide-react";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<
    "analytics" | "menu" | "categories" | "tables" | "coupons" | "branding" | "settings"
  >("analytics");

  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [analyticsRange, setAnalyticsRange] = useState<"today" | "week" | "month" | "all">("all");
  const [mountedTime, setMountedTime] = useState<number | null>(null);

  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadImage = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: "item" | "logo"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok && data.url) {
        if (target === "item" && editingItem) {
          setEditingItem({ ...editingItem, imageUrl: data.url });
        } else if (target === "logo" && settings) {
          setSettings({ ...settings, logoUrl: data.url });
        }
        flashMessage("تم رفع الصورة إلى Supabase Storage بنجاح! ✓");
      } else {
        alert(data.error || "فشل رفع الصورة");
      }
    } catch (err) {
      console.error(err);
      alert("تعذر رفع الصورة");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  // QR Modal
  const [qrModalTable, setQrModalTable] = useState<Table | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  // Edit / Add Item Comprehensive Modal
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isNewItem, setIsNewItem] = useState(false);

  // Category Edit / Add Modal
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isNewCategory, setIsNewCategory] = useState(false);

  // New Table
  const [newTableNumber, setNewTableNumber] = useState("");
  const [newTableSection, setNewTableSection] = useState<Table["section"]>("صالة");

  // New Coupon
  const [newCouponCode, setNewCouponCode] = useState("");
  const [newCouponType, setNewCouponType] = useState<"percent" | "fixed">("percent");
  const [newCouponValue, setNewCouponValue] = useState("");
  const [newCouponMin, setNewCouponMin] = useState("");

  const fetchData = async () => {
    try {
      const [setRes, catRes, menuRes, tblRes, ordRes] = await Promise.all([
        fetch("/api/settings"),
        fetch("/api/categories"),
        fetch("/api/menu"),
        fetch("/api/tables"),
        fetch("/api/orders"),
      ]);
      const [setData, catData, menuData, tblData, ordData] = await Promise.all([
        setRes.json(),
        catRes.json(),
        menuRes.json(),
        tblRes.json(),
        ordRes.json(),
      ]);
      setSettings(setData);
      setCategories(catData);
      setMenuItems(menuData);
      setTables(tblData.tables || []);
      setOrders(ordData);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    setMountedTime(Date.now());
    fetchData();

    // Supabase Realtime WebSocket subscription (<100ms instant updates)
    const unsubscribe = subscribeToLiveEvents((event) => {
      if (
        event === "new_order" ||
        event === "order_status_changed" ||
        event === "table_updated" ||
        event === "waiter_called" ||
        event === "waiter_dismissed"
      ) {
        fetchData();
      }
    });

    // Background poll every 5 seconds as a secondary fallback
    const interval = setInterval(() => {
      fetchData();
    }, 5000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);


  const flashMessage = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  // Save Settings & Branding
  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!settings) return;
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        flashMessage("تم حفظ وتحديث الإعدادات والهوية بنجاح! ✓");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Generate QR for a table
  const handleOpenQR = async (table: Table) => {
    setQrModalTable(table);
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/?table=${table.number}`;
    try {
      const dataUrl = await QRCode.toDataURL(url, {
        width: 350,
        margin: 2,
        color: { dark: settings?.primaryColor || "#780000", light: "#ffffff" },
      });
      setQrDataUrl(dataUrl);
    } catch (err) {
      console.error(err);
    }
  };

  // Add Table
  const handleAddTable = async () => {
    if (!newTableNumber) return;
    const num = Number(newTableNumber);
    if (tables.some((t) => t.number === num)) {
      alert("رقم الطاولة موجود بالفعل");
      return;
    }

    const updated = [
      ...tables,
      {
        id: `tbl-${Date.now()}`,
        number: num,
        label: `طاولة ${num}`,
        section: newTableSection,
        status: "empty" as const,
        qrToken: `tbl-token-${num}`,
      },
    ];

    try {
      const res = await fetch("/api/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      if (res.ok) {
        setTables(updated);
        setNewTableNumber("");
        flashMessage("تمت إضافة الطاولة بنجاح ✓");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete Table
  const handleDeleteTable = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الطاولة؟")) return;
    const updated = tables.filter((t) => t.id !== id);
    try {
      await fetch("/api/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      setTables(updated);
      flashMessage("تم حذف الطاولة ✓");
    } catch (e) {
      console.error(e);
    }
  };

  // Save / Update Menu Item
  const handleSaveMenuItem = async () => {
    if (!editingItem) return;
    try {
      const res = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingItem),
      });
      if (res.ok) {
        const saved = await res.json();
        setMenuItems((prev) => {
          const idx = prev.findIndex((i) => i.id === saved.id);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = saved;
            return copy;
          }
          return [...prev, saved];
        });
        setEditingItem(null);
        flashMessage("تم حفظ وتحديث الصنف بالكامل بنجاح ✓");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete Menu Item
  const handleDeleteMenuItem = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الصنف نهائياً؟")) return;
    try {
      await fetch(`/api/menu/${id}`, { method: "DELETE" });
      setMenuItems((prev) => prev.filter((i) => i.id !== id));
      flashMessage("تم حذف الصنف من القائمة ✓");
    } catch (e) {
      console.error(e);
    }
  };

  // Save / Update Category
  const handleSaveCategory = async () => {
    if (!editingCategory) return;
    const updatedCats = isNewCategory
      ? [...categories, editingCategory]
      : categories.map((c) => (c.id === editingCategory.id ? editingCategory : c));

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedCats),
      });
      if (res.ok) {
        setCategories(updatedCats);
        setEditingCategory(null);
        flashMessage("تم حفظ بيانات القسم بنجاح ✓");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete Category
  const handleDeleteCategory = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا القسم؟")) return;
    const updatedCats = categories.filter((c) => c.id !== id);
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedCats),
      });
      if (res.ok) {
        setCategories(updatedCats);
        flashMessage("تم حذف القسم ✓");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (orders.length === 0) {
      alert("لا توجد طلبات للتصدير");
      return;
    }
    const headers = [
      "رقم الطلب",
      "التاريخ",
      "نوع الطلب",
      "رقم الطاولة/الاسم",
      "المجموع الفرعي",
      "الخصم",
      "المجموع الكلي",
      "طريقة الدفع",
      "الحالة",
    ];
    const rows = orders.map((o) => [
      `#${o.orderNumber}`,
      new Date(o.createdAt).toLocaleString("ar-SA"),
      o.type === "table" ? "طاولة" : "استلام مسبق",
      o.type === "table" ? `طاولة ${o.tableNumber}` : `${o.customerName || ""} (${o.customerPhone || ""})`,
      o.subtotal,
      o.discount,
      o.total,
      "نقداً",
      o.status,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `تقرير_مبيعات_مطعم_${settings?.name || "المطعم"}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Analytics Metrics & Time-Range Filtering
  const now = mountedTime ? new Date(mountedTime) : null;
  const todayStart = now ? new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() : 0;
  const weekStart = todayStart - 6 * 24 * 60 * 60 * 1000;
  const monthStart = todayStart - 29 * 24 * 60 * 60 * 1000;

  const filteredOrders = orders.filter((o) => {
    if (analyticsRange === "all" || !now) return true;
    const orderTime = new Date(o.createdAt).getTime();
    if (isNaN(orderTime)) return true;
    if (analyticsRange === "today") return orderTime >= todayStart;
    if (analyticsRange === "week") return orderTime >= weekStart;
    if (analyticsRange === "month") return orderTime >= monthStart;
    return true;
  });

  const nonCancelledOrders = filteredOrders.filter((o) => o.status !== "cancelled");
  const totalSales = nonCancelledOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const completedOrders = filteredOrders.filter((o) => o.status === "completed" || o.status === "ready");
  const cancelledOrders = filteredOrders.filter((o) => o.status === "cancelled");
  const preparingOrders = filteredOrders.filter((o) => o.status === "preparing");
  const newOrders = filteredOrders.filter((o) => o.status === "received");

  const avgOrderValue = nonCancelledOrders.length > 0
    ? Math.round(totalSales / nonCancelledOrders.length)
    : 0;

  // Dine-in vs Takeaway split
  const dineInOrders = nonCancelledOrders.filter((o) => o.type === "table");
  const takeawayOrders = nonCancelledOrders.filter((o) => o.type === "takeaway");
  const dineInCount = dineInOrders.length;
  const takeawayCount = takeawayOrders.length;
  const dineInSales = dineInOrders.reduce((s, o) => s + (o.total || 0), 0);
  const takeawaySales = takeawayOrders.reduce((s, o) => s + (o.total || 0), 0);
  const dineInPercent = nonCancelledOrders.length > 0 ? Math.round((dineInCount / nonCancelledOrders.length) * 100) : 0;
  const takeawayPercent = nonCancelledOrders.length > 0 ? 100 - dineInPercent : 0;

  // Category mapping
  const itemCategoryMap = new Map<string, string>();
  const itemImageMap = new Map<string, string>();
  menuItems.forEach((m) => {
    itemCategoryMap.set(m.nameAr, m.categoryId);
    if (m.imageUrl) itemImageMap.set(m.nameAr, m.imageUrl);
  });

  const categoryNameMap = new Map<string, string>();
  categories.forEach((c) => {
    categoryNameMap.set(c.id, c.nameAr);
  });

  const categoryStatsMap: { [catId: string]: { id: string; name: string; revenue: number; count: number } } = {};
  categories.forEach((c) => {
    categoryStatsMap[c.id] = { id: c.id, name: c.nameAr, revenue: 0, count: 0 };
  });

  nonCancelledOrders.forEach((o) => {
    (o.items || []).forEach((item) => {
      const catId = itemCategoryMap.get(item.nameAr) || "other";
      if (!categoryStatsMap[catId]) {
        categoryStatsMap[catId] = { id: catId, name: categoryNameMap.get(catId) || "أصناف عامة", revenue: 0, count: 0 };
      }
      const itemRev = item.totalPrice || ((item.unitPrice || 0) * (item.quantity || 1)) || 0;
      categoryStatsMap[catId].revenue += itemRev;
      categoryStatsMap[catId].count += item.quantity || 1;
    });
  });

  const sortedCategories = Object.values(categoryStatsMap)
    .filter((c) => c.revenue > 0 || c.count > 0)
    .sort((a, b) => b.revenue - a.revenue);

  // Top Items Leaderboard
  const itemStatsMap: { [name: string]: { nameAr: string; nameEn?: string; count: number; revenue: number; imageUrl?: string } } = {};
  nonCancelledOrders.forEach((o) => {
    (o.items || []).forEach((item) => {
      if (!itemStatsMap[item.nameAr]) {
        itemStatsMap[item.nameAr] = {
          nameAr: item.nameAr,
          nameEn: item.nameEn,
          count: 0,
          revenue: 0,
          imageUrl: itemImageMap.get(item.nameAr),
        };
      }
      itemStatsMap[item.nameAr].count += item.quantity || 1;
      itemStatsMap[item.nameAr].revenue += item.totalPrice || ((item.unitPrice || 0) * (item.quantity || 1)) || 0;
    });
  });

  const topDishes = Object.values(itemStatsMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const maxDishCount = topDishes.length > 0 ? topDishes[0].count : 1;

  // Daily trend for the last 7 days
  const arabicDays = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const last7DaysTrend = Array.from({ length: 7 }).map((_, idx) => {
    if (!mountedTime) {
      return {
        dayLabel: arabicDays[idx % 7],
        dateFormatted: "-",
        total: 0,
        count: 0,
      };
    }
    const d = new Date(mountedTime);
    d.setDate(d.getDate() - (6 - idx));
    const dayLabel = idx === 6 ? "اليوم" : idx === 5 ? "أمس" : arabicDays[d.getDay()];
    const dateFormatted = `${d.getDate()}/${d.getMonth() + 1}`;
    const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000;

    const dayOrders = orders.filter((o) => {
      if (o.status === "cancelled") return false;
      const t = new Date(o.createdAt).getTime();
      return t >= startOfDay && t < endOfDay;
    });

    const dayTotal = dayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    return {
      dayLabel,
      dateFormatted,
      total: dayTotal,
      count: dayOrders.length,
    };
  });

  const peakSales = Math.max(...last7DaysTrend.map((d) => d.total), 1);
  const bestDay = [...last7DaysTrend].sort((a, b) => b.total - a.total)[0];

  const brandColor = settings?.primaryColor || "#780000";

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col font-sans">
      {/* Top Bar */}
      <header
        style={{ backgroundColor: brandColor }}
        className="text-white p-3.5 shadow-md flex items-center justify-between shrink-0 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="w-9 h-9 rounded-xl bg-amber-400 text-stone-950 font-black flex items-center justify-center text-sm shadow hover:scale-105 transition"
            title="المينيو"
          >
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-xl" />
            ) : (
              settings?.name.charAt(0) || "ر"
            )}
          </Link>
          <div>
            <h1 className="text-base font-extrabold flex items-center gap-2">
              <span>لوحة التحكم الكاملة — {settings?.name}</span>
              <span className="text-[10px] bg-white/20 text-white font-black px-2 py-0.5 rounded-full">
                الإدارة الشاملة
              </span>
            </h1>
            <p className="text-[11px] text-white/80">التحكم في الألوان، الأصناف، الأسعار، الطاولات، والإعدادات</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            target="_blank"
            className="px-3 py-1.5 bg-white/15 hover:bg-white/25 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>معاينة المينيو</span>
          </Link>
          <Link
            href="/cashier"
            className="px-3 py-1.5 bg-black/20 hover:bg-black/30 text-white rounded-lg text-xs font-bold transition"
          >
            الكاشير
          </Link>
          <Link
            href="/kitchen"
            className="px-3 py-1.5 bg-black/20 hover:bg-black/30 text-white rounded-lg text-xs font-bold transition"
          >
            المطبخ
          </Link>
        </div>
      </header>

      {/* Tabs Bar */}
      <div className="bg-white border-b border-stone-200 px-4 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap bg-stone-100 p-1 rounded-xl font-bold">
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-3 py-2 rounded-lg transition flex items-center gap-1.5 ${activeTab === "analytics" ? "bg-white text-stone-900 shadow-xs" : "text-stone-600"
                }`}
            >
              <BarChart3 className="w-4 h-4 text-amber-600" />
              <span>التقارير والإحصاءات</span>
            </button>
            <button
              onClick={() => setActiveTab("branding")}
              className={`px-3 py-2 rounded-lg transition flex items-center gap-1.5 ${activeTab === "branding" ? "bg-white text-stone-900 shadow-xs" : "text-stone-600"
                }`}
            >
              <Palette className="w-4 h-4 text-rose-600" />
              <span>الهوية والألوان</span>
            </button>
            <button
              onClick={() => setActiveTab("menu")}
              className={`px-3 py-2 rounded-lg transition flex items-center gap-1.5 ${activeTab === "menu" ? "bg-white text-stone-900 shadow-xs" : "text-stone-600"
                }`}
            >
              <UtensilsCrossed className="w-4 h-4 text-emerald-600" />
              <span>الأصناف والأسعار ({menuItems.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("categories")}
              className={`px-3 py-2 rounded-lg transition flex items-center gap-1.5 ${activeTab === "categories" ? "bg-white text-stone-900 shadow-xs" : "text-stone-600"
                }`}
            >
              <Layers className="w-4 h-4 text-blue-600" />
              <span>الأقسام ({categories.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("tables")}
              className={`px-3 py-2 rounded-lg transition flex items-center gap-1.5 ${activeTab === "tables" ? "bg-white text-stone-900 shadow-xs" : "text-stone-600"
                }`}
            >
              <QrCode className="w-4 h-4 text-purple-600" />
              <span>الطاولات ورموز QR ({tables.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`px-3 py-2 rounded-lg transition flex items-center gap-1.5 ${activeTab === "settings" ? "bg-white text-stone-900 shadow-xs" : "text-stone-600"
                }`}
            >
              <Settings className="w-4 h-4 text-stone-600" />
              <span>الإعدادات والواتساب</span>
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير المبيعات CSV</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {saveSuccessMsg && (
        <div className="max-w-7xl mx-auto w-full px-4 pt-3">
          <div className="bg-emerald-600 text-white p-3 rounded-xl font-bold text-xs text-center shadow-md animate-fade-in flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{saveSuccessMsg}</span>
          </div>
        </div>
      )}

      {/* Main Tab Content */}
      <main className="flex-1 p-4 max-w-7xl mx-auto w-full">
        {/* TAB 1: BRANDING & COLORS */}
        {activeTab === "branding" && settings && (
          <div className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs max-w-3xl space-y-6">
            <div>
              <h2 className="text-base font-black text-stone-900 flex items-center gap-2">
                <Palette className="w-5 h-5 text-rose-600" />
                <span>التحكم في هوية المطعم، الاسم، الألوان، والشعار</span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                تعديل الألوان هنا ينعكس فورياً على القائمة وأزرار الزبون وشاشات التشغيل
              </p>
            </div>

            {/* Color Palette Selector */}
            <div className="space-y-3 p-4 bg-stone-50 rounded-2xl border border-stone-200">
              <label className="text-xs font-bold text-stone-800 block">
                اللون الأساسي للمطعم (Primary Brand Color):
              </label>
              <div className="flex flex-wrap items-center gap-3">
                {/* Preset Themes */}
                {[
                  { name: "عنابي رهيب الأصلي", hex: "#780000" },
                  { name: "زمردي فاخر", hex: "#0b4f3a" },
                  { name: "كحلي ملكي", hex: "#0f2b48" },
                  { name: "عسلي وكراميل دافئ", hex: "#9a4914" },
                  { name: "أسود فحم راقي", hex: "#1c1917" },
                ].map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setSettings({ ...settings, primaryColor: c.hex })}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition ${settings.primaryColor === c.hex
                        ? "border-stone-900 ring-2 ring-stone-900 shadow-sm"
                        : "border-stone-200 bg-white hover:bg-stone-100"
                      }`}
                  >
                    <span className="w-4 h-4 rounded-full shadow-xs" style={{ backgroundColor: c.hex }} />
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>

              {/* Custom Hex Color Picker */}
              <div className="pt-2 flex items-center gap-3">
                <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-stone-200">
                  <input
                    type="color"
                    value={settings.primaryColor || "#780000"}
                    onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                    className="w-8 h-8 rounded-lg cursor-pointer border-0 p-0"
                  />
                  <input
                    type="text"
                    value={settings.primaryColor || "#780000"}
                    onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                    className="w-24 text-xs font-mono font-bold uppercase focus:outline-none"
                  />
                </div>
                <span className="text-xs text-stone-500">أو اختر أي لون تريده عبر محدد الألوان</span>
              </div>
            </div>

            {/* Names & Description */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold block mb-1">اسم المطعم بالعربي:</label>
                <input
                  type="text"
                  value={settings.name}
                  onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                  className="w-full p-2.5 border rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">اسم المطعم بالإنجليزي:</label>
                <input
                  type="text"
                  value={settings.nameEn}
                  onChange={(e) => setSettings({ ...settings, nameEn: e.target.value })}
                  className="w-full p-2.5 border rounded-xl font-bold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold block mb-1">وصف المطعم وشعاره اللفظي (Slogan):</label>
                <textarea
                  value={settings.description}
                  onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                  rows={2}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div className="sm:col-span-2 space-y-2">
                <label className="font-bold block mb-1">شعار المطعم (Logo):</label>
                <div className="flex flex-wrap items-center gap-3">
                  {settings.logoUrl ? (
                    <img
                      src={settings.logoUrl}
                      alt="Logo preview"
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-stone-200 shadow-sm"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-2xl bg-stone-100 border-2 border-dashed border-stone-300 flex items-center justify-center text-stone-400">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}

                  {/* Upload button for logo */}
                  <label className="cursor-pointer px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition">
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UploadCloud className="w-4 h-4" />
                    )}
                    <span>{isUploading ? "جاري الرفع إلى سوبابيس..." : "رفع شعار من جهازك ☁️"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploading}
                      onChange={(e) => handleUploadImage(e, "logo")}
                      className="hidden"
                    />
                  </label>

                  <input
                    type="text"
                    value={settings.logoUrl || ""}
                    onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                    placeholder="أو ضع رابط الشعار هنا مباشرة"
                    className="flex-1 min-w-[200px] p-2 border rounded-xl text-xs"
                  />
                </div>
              </div>

            </div>

            <div className="pt-3 border-t flex justify-end">
              <button
                type="button"
                onClick={() => handleSaveSettings()}
                className="px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold shadow-md transition"
              >
                حفظ الهوية والألوان
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: MENU ITEMS MANAGEMENT (Full Control) */}
        {activeTab === "menu" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-black text-stone-900">
                  إدارة الأصناف، الأسعار، الأحجام، والإضافات
                </h2>
                <p className="text-xs text-stone-500">
                  تحكم كامل في كل تفاصيل الطبق، الأحجام المتعددة، ومجموعات الخيارات
                </p>
              </div>

              <button
                onClick={() => {
                  setIsNewItem(true);
                  setEditingItem({
                    id: `item-${Date.now()}`,
                    categoryId: categories[0]?.id || "cat-mashawi",
                    nameAr: "",
                    nameEn: "",
                    descriptionAr: "",
                    descriptionEn: "",
                    basePrice: 25,
                    imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600",
                    tags: [],
                    isAvailable: true,
                    variants: [],
                    optionGroups: [],
                  });
                }}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>إضافة طبق / صنف جديد</span>
              </button>
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {menuItems.map((item) => {
                const category = categories.find((c) => c.id === item.categoryId);
                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex flex-col justify-between gap-3"
                  >
                    <div>
                      <div className="flex gap-3">
                        <img
                          src={item.imageUrl}
                          alt={item.nameAr}
                          className="w-16 h-16 rounded-xl object-cover bg-stone-100 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-bold text-stone-400 block">
                            {category?.nameAr || "عام"}
                          </span>
                          <h3 className="text-sm font-black text-stone-900 truncate">
                            {item.nameAr}
                          </h3>
                          <div className="flex items-baseline gap-1 mt-1">
                            <span className="text-base font-black text-stone-900">
                              {item.basePrice}
                            </span>
                            <span className="text-xs text-stone-500">{settings?.currency}</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-[11px] text-stone-500 line-clamp-2 mt-2">
                        {item.descriptionAr}
                      </p>

                      {/* Info Badges */}
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${item.isAvailable ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                            }`}
                        >
                          {item.isAvailable ? "متوفر" : "نفد"}
                        </span>
                        {item.variants && item.variants.length > 0 && (
                          <span className="text-[10px] bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded-md">
                            {item.variants.length} أحجام
                          </span>
                        )}
                        {item.optionGroups && item.optionGroups.length > 0 && (
                          <span className="text-[10px] bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-md">
                            {item.optionGroups.length} مجموعات إضافات
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-stone-100 flex gap-2">
                      <button
                        onClick={() => {
                          setIsNewItem(false);
                          setEditingItem(JSON.parse(JSON.stringify(item)));
                        }}
                        className="flex-1 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>تعديل الصنف والإضافات</span>
                      </button>
                      <button
                        onClick={() => handleDeleteMenuItem(item.id)}
                        className="p-2 text-stone-400 hover:text-red-600 rounded-xl border hover:bg-red-50 transition"
                        title="حذف"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: CATEGORIES MANAGEMENT */}
        {activeTab === "categories" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black text-stone-900">إدارة أقسام المينيو</h2>
                <p className="text-xs text-stone-500">إضافة أقسام، تعديل الأسماء، وترتيب الظهور</p>
              </div>

              <button
                onClick={() => {
                  setIsNewCategory(true);
                  setEditingCategory({
                    id: `cat-${Date.now()}`,
                    nameAr: "",
                    nameEn: "",
                    iconName: "Utensils",
                    sortOrder: categories.length + 1,
                    isActive: true,
                  });
                }}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>إضافة قسم جديد</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex items-center justify-between"
                >
                  <div>
                    <h3 className="text-sm font-black text-stone-900">{cat.nameAr}</h3>
                    <p className="text-[11px] text-stone-400">{cat.nameEn}</p>
                    <span className="text-[10px] text-stone-400 font-bold mt-1 block">
                      الترتيب: {cat.sortOrder}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setIsNewCategory(false);
                        setEditingCategory(cat);
                      }}
                      className="p-2 rounded-lg text-stone-600 hover:bg-stone-100"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-2 rounded-lg text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: TABLES & QR */}
        {activeTab === "tables" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-black text-stone-900">
                  إدارة الطاولات وتوليد رموز QR
                </h2>
                <p className="text-xs text-stone-500">
                  توليد وطباعة بطاقات الـ QR لكل طاولة مع شعار المطعم
                </p>
              </div>

              <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-stone-200">
                <input
                  type="number"
                  min={1}
                  value={newTableNumber}
                  onChange={(e) => setNewTableNumber(e.target.value)}
                  placeholder="رقم الطاولة"
                  className="w-24 text-xs p-2 border rounded-xl"
                />
                <select
                  value={newTableSection}
                  onChange={(e) => setNewTableSection(e.target.value as Table["section"])}
                  className="text-xs p-2 border rounded-xl"
                >
                  <option value="صالة">صالة</option>
                  <option value="عائلات">عائلات</option>
                  <option value="تراس">تراس</option>
                </select>
                <button
                  onClick={handleAddTable}
                  className="px-3 py-2 bg-stone-900 text-white rounded-xl text-xs font-bold hover:bg-stone-800 transition"
                >
                  إضافة طاولة
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {tables.map((table) => (
                <div
                  key={table.id}
                  className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex flex-col justify-between gap-3 text-center"
                >
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 block uppercase">
                      قسم {table.section}
                    </span>
                    <h3 className="text-lg font-black text-stone-900 mt-0.5">
                      طاولة رقم {table.number}
                    </h3>
                  </div>

                  <div className="p-3 bg-stone-50 rounded-xl flex items-center justify-center">
                    <QrCode className="w-16 h-16 text-stone-800" />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenQR(table)}
                      className="flex-1 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>عرض وطباعة الـ QR</span>
                    </button>
                    <button
                      onClick={() => handleDeleteTable(table.id)}
                      className="p-2 text-stone-400 hover:text-red-600 rounded-xl border hover:bg-red-50 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: GENERAL SETTINGS */}
        {activeTab === "settings" && settings && (
          <form
            onSubmit={handleSaveSettings}
            className="bg-white rounded-3xl p-6 border border-stone-200 shadow-xs max-w-3xl space-y-5"
          >
            <div>
              <h2 className="text-base font-black text-stone-900">إعدادات المطعم والطلبات</h2>
              <p className="text-xs text-stone-500">رقم الواتساب، الضرائب، أوقات العمل، والبانر</p>
            </div>

            {/* Toggle Ordering */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs font-black text-stone-900 block">استقبال الطلبات</span>
                <span className="text-[11px] text-stone-600">
                  يمكن إيقاف استقبال الطلبات فوراً في أوقات الازدحام الشديد
                </span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSettings({ ...settings, isOrderingEnabled: !settings.isOrderingEnabled })
                }
                className={`px-4 py-2 rounded-xl text-xs font-black transition ${settings.isOrderingEnabled ? "bg-emerald-600 text-white" : "bg-stone-300 text-stone-700"
                  }`}
              >
                {settings.isOrderingEnabled ? "مفتوح ويستقبل الطلبات" : "مغلق مؤقتاً"}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold block mb-1">رقم واتساب المطعم (بدون أصفار أو +):</label>
                <input
                  type="text"
                  value={settings.whatsapp}
                  onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                  placeholder="9647709768760"
                  className="w-full p-2.5 border rounded-xl font-mono text-emerald-800 font-bold"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">هاتف المطعم للاتصال:</label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">العملة:</label>
                <input
                  type="text"
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">وقت التحضير المتوقع (دقيقة):</label>
                <input
                  type="number"
                  min={5}
                  value={settings.estimatedPreparationTimeMinutes}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      estimatedPreparationTimeMinutes: Number(e.target.value) || 20,
                    })
                  }
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">نسبة رسوم الخدمة (%):</label>
                <input
                  type="number"
                  min={0}
                  value={settings.serviceFeePercent}
                  onChange={(e) =>
                    setSettings({ ...settings, serviceFeePercent: Number(e.target.value) || 0 })
                  }
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">نسبة الضريبة (%):</label>
                <input
                  type="number"
                  min={0}
                  value={settings.taxPercent}
                  onChange={(e) =>
                    setSettings({ ...settings, taxPercent: Number(e.target.value) || 0 })
                  }
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold block mb-1">العنوان:</label>
                <input
                  type="text"
                  value={settings.address}
                  onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold block mb-1">أوقات العمل:</label>
                <input
                  type="text"
                  value={settings.openingHours}
                  onChange={(e) => setSettings({ ...settings, openingHours: e.target.value })}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold block mb-1">نص البانر الترويجي أعلى المينيو:</label>
                <input
                  type="text"
                  value={settings.bannerMessage || ""}
                  onChange={(e) => setSettings({ ...settings, bannerMessage: e.target.value })}
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold shadow-md transition"
              >
                حفظ الإعدادات
              </button>
            </div>
          </form>
        )}

        {/* TAB 6: ANALYTICS */}
        {activeTab === "analytics" && (
          <div className="space-y-5">
            {/* Control Bar: Time-Range Filters & Export CSV */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black text-stone-500 flex items-center gap-1.5 ml-2">
                  <Filter className="w-3.5 h-3.5 text-stone-400" />
                  النطاق الزمني:
                </span>
                <div className="inline-flex p-1 bg-stone-100 rounded-xl gap-1">
                  {[
                    { id: "all", label: "كل الوقت" },
                    { id: "month", label: "آخر 30 يوم" },
                    { id: "week", label: "آخر 7 أيام" },
                    { id: "today", label: "اليوم" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setAnalyticsRange(t.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${analyticsRange === t.id
                          ? "bg-white text-stone-900 shadow-xs"
                          : "text-stone-500 hover:text-stone-900"
                        }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                <span className="text-[11px] font-bold text-stone-400 mr-2">
                  ({filteredOrders.length} طلب ضمن النطاق)
                </span>
              </div>

              <button
                onClick={handleExportCSV}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs hover:shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>تصدير تقرير الإكسل (CSV)</span>
              </button>
            </div>

            {/* 4 Executive KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total Sales */}
              <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-500">إجمالي المبيعات المحققة</span>
                  <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-black text-stone-900 tracking-tight">
                    {totalSales.toLocaleString()}
                  </span>
                  <span className="text-xs font-extrabold text-stone-500 mr-1.5">
                    {settings?.currency || "د.ع"}
                  </span>
                </div>
                <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
                  <span className="text-stone-400 font-medium">صافي الطلبات غير الملغاة</span>
                  <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    نقداً بالكامل
                  </span>
                </div>
              </div>

              {/* Card 2: Orders Count */}
              <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-500">عدد الطلبات الصافية</span>
                  <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4" />
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-black text-stone-900 tracking-tight">
                    {nonCancelledOrders.length}
                  </span>
                  <span className="text-xs font-extrabold text-stone-500 mr-1.5">طلب نشط ومكتمل</span>
                </div>
                <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
                  <span className="text-stone-400 font-medium">
                    {cancelledOrders.length} ملغي ({filteredOrders.length > 0 ? Math.round((cancelledOrders.length / filteredOrders.length) * 100) : 0}%)
                  </span>
                  <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                    {completedOrders.length} مكتمل
                  </span>
                </div>
              </div>

              {/* Card 3: Avg Order Value */}
              <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-500">متوسط قيمة الفاتورة</span>
                  <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Award className="w-4 h-4" />
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-black text-amber-600 tracking-tight">
                    {avgOrderValue.toLocaleString()}
                  </span>
                  <span className="text-xs font-extrabold text-stone-500 mr-1.5">
                    {settings?.currency || "د.ع"}
                  </span>
                </div>
                <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
                  <span className="text-stone-400 font-medium">معدل سلة الزبون الواحد</span>
                  <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    AOV
                  </span>
                </div>
              </div>

              {/* Card 4: Dine-In vs Takeaway */}
              <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-500">نوع الخدمة والطلب</span>
                  <span className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </span>
                </div>
                <div className="mt-2 flex items-baseline justify-between">
                  <div>
                    <span className="text-lg font-black text-stone-900">{dineInPercent}%</span>
                    <span className="text-[11px] font-bold text-stone-500 mr-1">صالة ({dineInCount})</span>
                  </div>
                  <div className="text-left">
                    <span className="text-lg font-black text-purple-600">{takeawayPercent}%</span>
                    <span className="text-[11px] font-bold text-stone-500 mr-1">سفري ({takeawayCount})</span>
                  </div>
                </div>
                {/* Visual Progress Bar */}
                <div className="mt-2.5 w-full bg-purple-100 h-2 rounded-full overflow-hidden flex">
                  <div style={{ width: `${dineInPercent}%` }} className="bg-stone-800 h-full transition-all duration-500" />
                  <div style={{ width: `${takeawayPercent}%` }} className="bg-purple-600 h-full transition-all duration-500" />
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] text-stone-400 font-bold">
                  <span>صالة: {dineInSales.toLocaleString()} {settings?.currency}</span>
                  <span>سفري: {takeawaySales.toLocaleString()} {settings?.currency}</span>
                </div>
              </div>
            </div>

            {/* Middle Section: 7-Day Interactive Sales Chart + Category Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* 7-Day Trend Bar Chart */}
              <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-amber-600" />
                      حركة المبيعات خلال الـ 7 أيام الماضية
                    </h3>
                    <span className="text-xs font-extrabold text-stone-400">
                      إجمالي الأسبوع: {last7DaysTrend.reduce((s, d) => s + d.total, 0).toLocaleString()} {settings?.currency}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 mb-6 font-medium">
                    مقارنة يومية فورية للمبيعات وحجم الطلبات
                  </p>
                </div>

                {/* Bar Chart Container */}
                <div className="h-48 flex items-end justify-between gap-2 pt-6 pb-2 px-1 border-b border-stone-100">
                  {last7DaysTrend.map((day, i) => {
                    const heightPercent = Math.max(12, Math.round((day.total / peakSales) * 100));
                    const isToday = i === 6;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                        {/* Tooltip on hover */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-stone-900 text-white text-[10px] py-1 px-2 rounded-lg font-bold shadow-lg pointer-events-none whitespace-nowrap z-10">
                          {day.total.toLocaleString()} {settings?.currency} ({day.count} طلب)
                        </div>

                        {/* Amount above bar */}
                        <span className="text-[9px] font-black text-stone-500 mb-1 group-hover:text-amber-600 transition">
                          {day.total > 0 ? `${Math.round(day.total / 1000)}k` : "0"}
                        </span>

                        {/* Bar Pillar */}
                        <div className="w-full max-w-[38px] bg-stone-100 rounded-t-xl overflow-hidden flex flex-col justify-end h-full">
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className={`w-full rounded-t-xl transition-all duration-700 ${isToday
                                ? "bg-gradient-to-t from-amber-600 to-amber-400 shadow-xs"
                                : "bg-gradient-to-t from-stone-400 to-stone-300 group-hover:from-stone-700 group-hover:to-stone-500"
                              }`}
                          />
                        </div>

                        {/* Day Name & Date */}
                        <span className={`text-[11px] font-black mt-2 ${isToday ? "text-amber-600" : "text-stone-700"}`}>
                          {day.dayLabel}
                        </span>
                        <span className="text-[9px] font-bold text-stone-400">
                          {day.dateFormatted}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Highlight Footer */}
                <div className="mt-4 pt-2 flex items-center justify-between text-xs text-stone-500 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                  <span className="font-bold flex items-center gap-1.5 text-stone-700">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    ذروة المبيعات: يوم {bestDay.dayLabel} ({bestDay.dateFormatted})
                  </span>
                  <span className="font-black text-amber-600">
                    {bestDay.total.toLocaleString()} {settings?.currency}
                  </span>
                </div>
              </div>

              {/* Category Sales Breakdown */}
              <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-purple-600" />
                      توزيع المبيعات حسب الأقسام
                    </h3>
                    <span className="text-xs font-bold text-stone-400">
                      {sortedCategories.length} أقسام نشطة
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 mb-4 font-medium">
                    حجم الإيرادات وعدد الأصناف المباعة في كل قسم
                  </p>
                </div>

                <div className="space-y-3.5 flex-1 overflow-y-auto max-h-[220px] pr-1">
                  {sortedCategories.length === 0 ? (
                    <div className="text-center py-10 text-stone-400 text-xs font-bold">
                      لا توجد مبيعات مسجلة في هذا النطاق الزمني
                    </div>
                  ) : (
                    sortedCategories.map((cat, idx) => {
                      const share = totalSales > 0 ? Math.round((cat.revenue / totalSales) * 100) : 0;
                      return (
                        <div key={cat.id || idx} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className="text-stone-800 flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-purple-500" />
                              {cat.name}
                              <span className="text-[10px] text-stone-400 font-normal">
                                ({cat.count} قطعة)
                              </span>
                            </span>
                            <div className="text-left font-black">
                              <span className="text-stone-900">{cat.revenue.toLocaleString()} {settings?.currency}</span>
                              <span className="text-[10px] text-purple-600 font-extrabold mr-1.5">({share}%)</span>
                            </div>
                          </div>
                          <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${Math.max(4, share)}%` }}
                              className="bg-gradient-to-r from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-500"
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className="mt-4 pt-2 border-t border-stone-100 text-[11px] text-stone-400 flex items-center justify-between">
                  <span>يتم احتساب الأقسام تلقائياً وفق أصناف الفواتير</span>
                  <span className="font-bold text-stone-600">تحديث فوري</span>
                </div>
              </div>
            </div>

            {/* Bottom Section: Top 5 Dishes Leaderboard + Operational Statuses */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Top 5 Best-Selling Dishes */}
              <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-rose-500" />
                    الأطباق الأكثر طلباً ومبيعاً (Top 5 Leaderboard)
                  </h3>
                  <span className="text-xs font-bold text-stone-400">
                    ترتيب حسب الشعبية
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 mb-4 font-medium">
                  الوجبات الأكثر تحقيقاً للمبيعات والإقبال من الزبائن
                </p>

                <div className="space-y-2.5">
                  {topDishes.length === 0 ? (
                    <div className="text-center py-8 text-stone-400 text-xs font-bold">
                      لم يتم تسجيل مبيعات أطباق في الفترة المحددة
                    </div>
                  ) : (
                    topDishes.map((dish, i) => {
                      const medals = ["🥇", "🥈", "🥉", "4", "5"];
                      const rankColors = [
                        "bg-amber-100 text-amber-800 border-amber-300",
                        "bg-slate-100 text-slate-700 border-slate-300",
                        "bg-orange-100 text-orange-800 border-orange-300",
                        "bg-stone-100 text-stone-600 border-stone-200",
                        "bg-stone-100 text-stone-600 border-stone-200",
                      ];

                      return (
                        <div
                          key={i}
                          className="p-2.5 rounded-xl border border-stone-100 hover:border-amber-200 bg-stone-50/60 hover:bg-white transition flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs border ${rankColors[i]}`}
                            >
                              {medals[i]}
                            </span>
                            {dish.imageUrl ? (
                              <img
                                src={dish.imageUrl}
                                alt={dish.nameAr}
                                className="w-10 h-10 rounded-xl object-cover border border-stone-200 shadow-2xs"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-black text-xs">
                                <ChefHat className="w-5 h-5" />
                              </div>
                            )}
                            <div>
                              <h4 className="text-xs font-black text-stone-900 leading-tight">
                                {dish.nameAr}
                              </h4>
                              {dish.nameEn && (
                                <span className="text-[10px] text-stone-400 font-semibold block">
                                  {dish.nameEn}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="text-left shrink-0">
                            <div className="flex items-center justify-end gap-1.5">
                              <span className="text-xs font-black text-amber-600">
                                {dish.count}
                              </span>
                              <span className="text-[10px] font-bold text-stone-500">وجبة</span>
                            </div>
                            <span className="text-[10px] font-extrabold text-stone-400 block">
                              {dish.revenue.toLocaleString()} {settings?.currency}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Operations & Fulfillment Health */}
              <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      كفاءة العمليات وحالات الطلبات
                    </h3>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                      {filteredOrders.length > 0
                        ? `${Math.round((completedOrders.length / filteredOrders.length) * 100)}% معدل الإنجاز`
                        : "100% جاهزية"}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 mb-4 font-medium">
                    متابعة مسار تجهيز الطلبات من المطبخ وحتى التسليم
                  </p>
                </div>

                {/* Status Badges Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 my-2">
                  <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
                    <span className="text-[11px] font-bold text-emerald-700 block">مكتملة ومستلمة</span>
                    <span className="text-xl font-black text-emerald-800 mt-1 block">
                      {completedOrders.length}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-100">
                    <span className="text-[11px] font-bold text-amber-700 block">قيد التحضير بالمطبخ</span>
                    <span className="text-xl font-black text-amber-800 mt-1 block">
                      {preparingOrders.length}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100">
                    <span className="text-[11px] font-bold text-blue-700 block">طلبات جديدة</span>
                    <span className="text-xl font-black text-blue-800 mt-1 block">
                      {newOrders.length}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-100">
                    <span className="text-[11px] font-bold text-purple-700 block">جاهزة للتسليم</span>
                    <span className="text-xl font-black text-purple-800 mt-1 block">
                      {filteredOrders.filter((o) => o.status === "ready").length}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-100">
                    <span className="text-[11px] font-bold text-rose-700 block">ملغاة</span>
                    <span className="text-xl font-black text-rose-800 mt-1 block">
                      {cancelledOrders.length}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-100/70 border border-stone-200">
                    <span className="text-[11px] font-bold text-stone-600 block">إجمالي السجلات</span>
                    <span className="text-xl font-black text-stone-900 mt-1 block">
                      {filteredOrders.length}
                    </span>
                  </div>
                </div>

                {/* Fulfillment Health Progress */}
                <div className="mt-4 pt-3 border-t border-stone-100">
                  <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                    <span className="text-stone-600">نسبة نجاح التسليم دون إلغاء</span>
                    <span className="text-emerald-600 font-black">
                      {filteredOrders.length > 0
                        ? `${100 - Math.round((cancelledOrders.length / filteredOrders.length) * 100)}%`
                        : "100%"}
                    </span>
                  </div>
                  <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden flex">
                    <div
                      style={{
                        width: `${filteredOrders.length > 0
                            ? 100 - Math.round((cancelledOrders.length / filteredOrders.length) * 100)
                            : 100
                          }%`,
                      }}
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Orders Log / Table */}
            <div className="bg-white rounded-2xl p-5 border border-stone-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-stone-600" />
                    سجل أحدث العمليات والطلبات
                  </h3>
                  <p className="text-[11px] text-stone-400 font-medium">
                    آخر 10 طلبات واردة في النظام وحالتها الراهنة
                  </p>
                </div>
                <span className="text-xs font-bold text-stone-500 bg-stone-100 px-3 py-1 rounded-xl">
                  عرض آخر {Math.min(10, filteredOrders.length)} من أصل {filteredOrders.length}
                </span>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="text-center py-8 text-stone-400 text-xs font-bold">
                  لا توجد طلبات مسجلة ضمن النطاق الزمني المحدد
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead>
                      <tr className="border-b border-stone-100 text-stone-400 font-bold text-[11px]">
                        <th className="pb-3 pr-2">رقم الطلب</th>
                        <th className="pb-3">التوقيت</th>
                        <th className="pb-3">النوع والوجهة</th>
                        <th className="pb-3">ملخص الأصناف</th>
                        <th className="pb-3">المبلغ</th>
                        <th className="pb-3 pl-2">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 font-medium">
                      {filteredOrders.slice(0, 10).map((o) => {
                        const statusConfig: { [k: string]: { label: string; cls: string } } = {
                          received: { label: "وارد جديد", cls: "bg-blue-50 text-blue-700 border-blue-200" },
                          new: { label: "جديد", cls: "bg-blue-50 text-blue-700 border-blue-200" },
                          preparing: { label: "قيد التحضير", cls: "bg-amber-50 text-amber-700 border-amber-200" },
                          ready: { label: "جاهز", cls: "bg-purple-50 text-purple-700 border-purple-200" },
                          completed: { label: "مكتمل", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
                          cancelled: { label: "ملغي", cls: "bg-rose-50 text-rose-700 border-rose-200" },
                        };
                        const st = statusConfig[o.status] || { label: o.status, cls: "bg-stone-100 text-stone-700" };
                        const dateStr = new Date(o.createdAt).toLocaleTimeString("ar-IQ", {
                          hour: "2-digit",
                          minute: "2-digit",
                        });

                        return (
                          <tr key={o.id} className="hover:bg-stone-50/80 transition">
                            <td className="py-3 pr-2 font-black text-stone-900">
                              #{o.orderNumber}
                            </td>
                            <td className="py-3 text-stone-500 font-bold text-[11px]">
                              {dateStr}
                            </td>
                            <td className="py-3">
                              {o.type === "table" ? (
                                <span className="inline-flex items-center gap-1 font-bold text-stone-800">
                                  <span className="w-1.5 h-1.5 rounded-full bg-stone-700" />
                                  طاولة {o.tableNumber}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 font-bold text-purple-700">
                                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                  سفري {o.customerName ? `(${o.customerName})` : ""}
                                </span>
                              )}
                            </td>
                            <td className="py-3 text-stone-600 max-w-[200px] truncate" title={(o.items || []).map((i) => `${i.nameAr} (${i.quantity})`).join("، ")}>
                              {(o.items || []).map((i) => `${i.nameAr} ×${i.quantity}`).join("، ")}
                            </td>
                            <td className="py-3 font-black text-stone-900">
                              {o.total?.toLocaleString()} {settings?.currency}
                            </td>
                            <td className="py-3 pl-2">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${st.cls}`}>
                                {st.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* COMPREHENSIVE ITEM EDIT / ADD MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full space-y-4 shadow-2xl max-h-[92vh] flex flex-col">
            <div className="flex justify-between items-center pb-2 border-b">
              <h3 className="text-sm font-black text-stone-900">
                {isNewItem ? "إضافة صنف جديد بالكامل" : `تعديل صنف: ${editingItem.nameAr}`}
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-4 text-xs pr-1">
              {/* Category & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">القسم:</label>
                  <select
                    value={editingItem.categoryId}
                    onChange={(e) => setEditingItem({ ...editingItem, categoryId: e.target.value })}
                    className="w-full p-2 border rounded-xl"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nameAr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold block mb-1">حالة التوفر:</label>
                  <select
                    value={editingItem.isAvailable ? "available" : "soldout"}
                    onChange={(e) =>
                      setEditingItem({
                        ...editingItem,
                        isAvailable: e.target.value === "available",
                      })
                    }
                    className="w-full p-2 border rounded-xl"
                  >
                    <option value="available">متوفر حالياً</option>
                    <option value="soldout">نفد مؤقتاً</option>
                  </select>
                </div>
              </div>

              {/* Names */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">الاسم بالعربي:</label>
                  <input
                    type="text"
                    value={editingItem.nameAr}
                    onChange={(e) => setEditingItem({ ...editingItem, nameAr: e.target.value })}
                    className="w-full p-2.5 border rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">الاسم بالإنجليزي:</label>
                  <input
                    type="text"
                    value={editingItem.nameEn}
                    onChange={(e) => setEditingItem({ ...editingItem, nameEn: e.target.value })}
                    className="w-full p-2.5 border rounded-xl font-bold"
                  />
                </div>
              </div>

              {/* Descriptions */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">الوصف بالعربي:</label>
                  <textarea
                    value={editingItem.descriptionAr}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, descriptionAr: e.target.value })
                    }
                    rows={2}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">الوصف بالإنجليزي:</label>
                  <textarea
                    value={editingItem.descriptionEn}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, descriptionEn: e.target.value })
                    }
                    rows={2}
                    className="w-full p-2 border rounded-xl"
                  />
                </div>
              </div>

              {/* Price & Image */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">السعر الأساسي:</label>
                  <input
                    type="number"
                    value={editingItem.basePrice}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, basePrice: Number(e.target.value) || 0 })
                    }
                    className="w-full p-2.5 border rounded-xl font-black text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-bold block mb-1">صورة الصنف (Supabase Storage):</label>
                  <div className="flex items-center gap-3">
                    {editingItem.imageUrl ? (
                      <img
                        src={editingItem.imageUrl}
                        alt="Preview"
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-stone-200 shrink-0 shadow-xs"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-stone-100 border-2 border-dashed border-stone-300 flex items-center justify-center text-stone-400 shrink-0">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                    )}

                    <div className="flex-1 space-y-1.5">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition">
                        {isUploading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <UploadCloud className="w-3.5 h-3.5" />
                        )}
                        <span>{isUploading ? "جاري الرفع لسوبابيس..." : "رفع صورة من جهازك ☁️"}</span>
                        <input
                          type="file"
                          accept="image/*"
                          disabled={isUploading}
                          onChange={(e) => handleUploadImage(e, "item")}
                          className="hidden"
                        />
                      </label>
                      <input
                        type="text"
                        value={editingItem.imageUrl}
                        onChange={(e) => setEditingItem({ ...editingItem, imageUrl: e.target.value })}
                        placeholder="أو رابط الصورة المباشر"
                        className="w-full p-2 border rounded-xl text-[11px]"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Tags */}
              <div>
                <label className="font-bold block mb-1">وسوم الصنف المميزة:</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "popular", label: "الأكثر طلباً" },
                    { id: "spicy", label: "حار" },
                    { id: "vegetarian", label: "نباتي" },
                    { id: "new", label: "جديد" },
                  ].map((tag) => {
                    const isChecked = editingItem.tags.includes(tag.id as any);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => {
                          const updated = isChecked
                            ? editingItem.tags.filter((t) => t !== tag.id)
                            : [...editingItem.tags, tag.id as any];
                          setEditingItem({ ...editingItem, tags: updated });
                        }}
                        className={`px-3 py-1.5 rounded-xl font-bold border transition ${isChecked
                            ? "bg-stone-900 text-white border-stone-900"
                            : "bg-white text-stone-600 border-stone-200"
                          }`}
                      >
                        {tag.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* VARIANTS (SIZES) BUILDER */}
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-stone-900">الأحجام المتعددة (Variants):</span>
                  <button
                    type="button"
                    onClick={() => {
                      const newVar: ItemVariant = {
                        id: `var-${Date.now()}`,
                        nameAr: "حجم جديد",
                        nameEn: "New Size",
                        price: editingItem.basePrice,
                      };
                      setEditingItem({
                        ...editingItem,
                        variants: [...(editingItem.variants || []), newVar],
                      });
                    }}
                    className="px-2.5 py-1 bg-stone-200 hover:bg-stone-300 rounded-lg text-[11px] font-bold"
                  >
                    + إضافة حجم
                  </button>
                </div>

                {editingItem.variants && editingItem.variants.length > 0 ? (
                  <div className="space-y-2">
                    {editingItem.variants.map((v, vIdx) => (
                      <div key={v.id} className="flex items-center gap-2 bg-white p-2 rounded-xl border">
                        <input
                          type="text"
                          value={v.nameAr}
                          onChange={(e) => {
                            const copy = [...(editingItem.variants || [])];
                            copy[vIdx].nameAr = e.target.value;
                            setEditingItem({ ...editingItem, variants: copy });
                          }}
                          placeholder="اسم الحجم بالعربي (مثلاً: كبير)"
                          className="flex-1 p-1.5 border rounded-lg text-xs"
                        />
                        <input
                          type="number"
                          value={v.price}
                          onChange={(e) => {
                            const copy = [...(editingItem.variants || [])];
                            copy[vIdx].price = Number(e.target.value) || 0;
                            setEditingItem({ ...editingItem, variants: copy });
                          }}
                          placeholder="السعر"
                          className="w-20 p-1.5 border rounded-lg text-xs font-bold"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const copy = editingItem.variants?.filter((_, i) => i !== vIdx);
                            setEditingItem({ ...editingItem, variants: copy });
                          }}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-stone-400">لا توجد أحجام مخصصة (سيعتمد السعر الأساسي فقط)</p>
                )}
              </div>

              {/* OPTION GROUPS (ADDONS) BUILDER */}
              <div className="p-3 bg-stone-50 border border-stone-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-stone-900">مجموعات الخيارات والإضافات:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const newGroup: OptionGroup = {
                        id: `grp-${Date.now()}`,
                        nameAr: "مجموعة خيارات جديدة",
                        nameEn: "New Option Group",
                        required: false,
                        options: [
                          { id: `opt-${Date.now()}-1`, nameAr: "خيار 1", nameEn: "Option 1", price: 0 },
                        ],
                      };
                      setEditingItem({
                        ...editingItem,
                        optionGroups: [...(editingItem.optionGroups || []), newGroup],
                      });
                    }}
                    className="px-2.5 py-1 bg-stone-200 hover:bg-stone-300 rounded-lg text-[11px] font-bold"
                  >
                    + إضافة مجموعة إضافات
                  </button>
                </div>

                {editingItem.optionGroups && editingItem.optionGroups.length > 0 ? (
                  <div className="space-y-3">
                    {editingItem.optionGroups.map((group, gIdx) => (
                      <div key={group.id} className="bg-white p-3 rounded-xl border space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={group.nameAr}
                            onChange={(e) => {
                              const copy = [...(editingItem.optionGroups || [])];
                              copy[gIdx].nameAr = e.target.value;
                              setEditingItem({ ...editingItem, optionGroups: copy });
                            }}
                            className="flex-1 p-1.5 border rounded-lg font-bold text-xs"
                          />
                          <label className="flex items-center gap-1 text-[11px] font-bold text-stone-600">
                            <input
                              type="checkbox"
                              checked={group.required}
                              onChange={(e) => {
                                const copy = [...(editingItem.optionGroups || [])];
                                copy[gIdx].required = e.target.checked;
                                setEditingItem({ ...editingItem, optionGroups: copy });
                              }}
                            />
                            <span>إلزامي</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const copy = editingItem.optionGroups?.filter((_, i) => i !== gIdx);
                              setEditingItem({ ...editingItem, optionGroups: copy });
                            }}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Options inside group */}
                        <div className="space-y-1.5 pl-2">
                          {group.options.map((opt, oIdx) => (
                            <div key={opt.id} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={opt.nameAr}
                                onChange={(e) => {
                                  const copy = [...(editingItem.optionGroups || [])];
                                  copy[gIdx].options[oIdx].nameAr = e.target.value;
                                  setEditingItem({ ...editingItem, optionGroups: copy });
                                }}
                                placeholder="اسم الإضافة (مثال: جبنة موزاريلا)"
                                className="flex-1 p-1 border rounded-lg text-xs"
                              />
                              <input
                                type="number"
                                value={opt.price}
                                onChange={(e) => {
                                  const copy = [...(editingItem.optionGroups || [])];
                                  copy[gIdx].options[oIdx].price = Number(e.target.value) || 0;
                                  setEditingItem({ ...editingItem, optionGroups: copy });
                                }}
                                placeholder="السعر الإضافي"
                                className="w-16 p-1 border rounded-lg text-xs font-bold"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const copy = [...(editingItem.optionGroups || [])];
                                  copy[gIdx].options = copy[gIdx].options.filter((_, i) => i !== oIdx);
                                  setEditingItem({ ...editingItem, optionGroups: copy });
                                }}
                                className="text-red-500 p-1"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const copy = [...(editingItem.optionGroups || [])];
                              copy[gIdx].options.push({
                                id: `opt-${Date.now()}-${Math.random()}`,
                                nameAr: "إضافة جديدة",
                                nameEn: "New option",
                                price: 0,
                              });
                              setEditingItem({ ...editingItem, optionGroups: copy });
                            }}
                            className="text-[10px] text-stone-600 hover:text-stone-900 font-bold underline block pt-1"
                          >
                            + خيار إضافي في هذه المجموعة
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-stone-400">لا توجد إضافات مخصصة لهذا الصنف</p>
                )}
              </div>
            </div>

            <div className="pt-2 border-t flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveMenuItem}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-stone-900 text-white hover:bg-stone-800 shadow-md"
              >
                حفظ كافة تعديلات الصنف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY EDIT / ADD MODAL */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-3 shadow-2xl">
            <h3 className="text-sm font-black text-stone-900">
              {isNewCategory ? "إضافة قسم جديد" : `تعديل قسم: ${editingCategory.nameAr}`}
            </h3>

            <div className="space-y-2 text-xs">
              <div>
                <label className="font-bold block mb-1">الاسم بالعربي:</label>
                <input
                  type="text"
                  value={editingCategory.nameAr}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, nameAr: e.target.value })
                  }
                  className="w-full p-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">الاسم بالإنجليزي:</label>
                <input
                  type="text"
                  value={editingCategory.nameEn}
                  onChange={(e) =>
                    setEditingCategory({ ...editingCategory, nameEn: e.target.value })
                  }
                  className="w-full p-2 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">الترتيب:</label>
                <input
                  type="number"
                  value={editingCategory.sortOrder}
                  onChange={(e) =>
                    setEditingCategory({
                      ...editingCategory,
                      sortOrder: Number(e.target.value) || 1,
                    })
                  }
                  className="w-full p-2 border rounded-xl"
                />
              </div>
            </div>

            <div className="pt-2 border-t flex justify-end gap-2">
              <button
                onClick={() => setEditingCategory(null)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveCategory}
                className="px-4 py-1.5 rounded-xl text-xs font-bold bg-stone-900 text-white hover:bg-stone-800"
              >
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR MODAL */}
      {qrModalTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center">
            <div className="flex justify-between items-center pb-2 border-b">
              <span className="text-xs font-bold text-stone-500">بطاقة QR للطاولة</span>
              <button
                onClick={() => setQrModalTable(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                ✕
              </button>
            </div>

            <div className="p-4 border-2 border-stone-200 rounded-2xl bg-[#fdfbf9] space-y-2">
              <h3 className="text-base font-black text-stone-900">{settings?.name}</h3>
              <p className="text-xs font-extrabold" style={{ color: brandColor }}>
                طاولة رقم {qrModalTable.number} ({qrModalTable.section})
              </p>

              {qrDataUrl && (
                <div className="py-2 flex justify-center">
                  <img
                    src={qrDataUrl}
                    alt={`QR Table ${qrModalTable.number}`}
                    className="w-48 h-48 rounded-xl shadow-xs"
                  />
                </div>
              )}

              <p className="text-[11px] font-bold text-stone-500">
                امسح الرمز لطلب الطعام مباشرة من طاولتك 🍽️
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <a
                href={qrDataUrl}
                download={`QR_Table_${qrModalTable.number}.png`}
                className="py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Download className="w-4 h-4" />
                <span>تنزيل PNG</span>
              </a>
              <button
                onClick={() => window.print()}
                className="py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
