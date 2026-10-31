"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { subscribeToLiveEvents, broadcastLiveEvent } from "@/lib/realtime";

import {
  Category,
  Coupon,
  CustomerReview,
  DeliveryZone,
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
  Bike,
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
  MapPin,
  Gift,
  Star,
  MessageSquare,
  ThumbsUp,
  Menu,
} from "lucide-react";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<
    "analytics" | "menu" | "categories" | "tables" | "coupons" | "branding" | "settings" | "delivery" | "reviews"
  >("analytics");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [reviewFilter, setReviewFilter] = useState<number | "all">("all");
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [analyticsRange, setAnalyticsRange] = useState<"today" | "week" | "month" | "all">("all");
  const [mountedTime, setMountedTime] = useState<number | null>(null);

  // Delivery Zones state
  const [newZoneNameAr, setNewZoneNameAr] = useState("");
  const [newZoneFee, setNewZoneFee] = useState<number>(2000);
  const [newZoneMinOrder, setNewZoneMinOrder] = useState<number>(0);
  const [newZoneTime, setNewZoneTime] = useState("30-45 دقيقة");
  const [showAddZoneModal, setShowAddZoneModal] = useState(false);
  const [editingZone, setEditingZone] = useState<DeliveryZone | null>(null);

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

  const fetchReviews = async () => {
    setIsLoadingReviews(true);
    try {
      const res = await fetch("/api/reviews");
      if (res.ok) {
        const data = await res.json();
        setReviews(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const fetchData = async () => {
    try {
      const [setRes, catRes, menuRes, tblRes, ordRes, revRes] = await Promise.all([
        fetch("/api/settings"),
        fetch("/api/categories"),
        fetch("/api/menu"),
        fetch("/api/tables"),
        fetch("/api/orders"),
        fetch("/api/reviews"),
      ]);
      const [setData, catData, menuData, tblData, ordData, revData] = await Promise.all([
        setRes.json(),
        catRes.json(),
        menuRes.json(),
        tblRes.json(),
        ordRes.json(),
        revRes.json(),
      ]);
      setSettings(setData);
      setCategories(catData);
      setMenuItems(menuData);
      setTables(tblData.tables || []);
      setOrders(ordData);
      setReviews(Array.isArray(revData) ? revData : []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLiveOrdersAndTables = async () => {
    try {
      const [tblRes, ordRes] = await Promise.all([
        fetch("/api/tables"),
        fetch("/api/orders"),
      ]);
      const [tblData, ordData] = await Promise.all([
        tblRes.json(),
        ordRes.json(),
      ]);
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
    const unsubscribe = subscribeToLiveEvents((event, payload) => {
      if (
        event === "new_order" ||
        event === "order_status_changed" ||
        event === "table_updated" ||
        event === "waiter_called" ||
        event === "waiter_dismissed"
      ) {
        fetchLiveOrdersAndTables();
      } else if (event === "new_review") {
        fetchReviews();
      } else if (event === "menu_updated" && payload && payload.id) {
        setMenuItems((prev) =>
          prev.map((i) => (i.id === payload.id ? { ...i, ...payload } : i))
        );
      }
    });

    // Background poll every 5 seconds for orders and tables ONLY (prevents overwriting settings inputs)
    const interval = setInterval(() => {
      fetchLiveOrdersAndTables();
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
  const handleSaveSettings = async (e?: React.FormEvent, customSettings?: RestaurantSettings) => {
    if (e) e.preventDefault();
    const target = customSettings || settings;
    if (!target) return;
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(target),
      });
      if (res.ok) {
        const saved = await res.json();
        setSettings(saved);
        flashMessage("تم حفظ وتحديث الإعدادات بنجاح! ✓");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delivery Zone Helpers
  const handleOpenAddZone = () => {
    setEditingZone(null);
    setNewZoneNameAr("");
    setNewZoneFee(2000);
    setNewZoneMinOrder(0);
    setNewZoneTime("30-45 دقيقة");
    setShowAddZoneModal(true);
  };

  const handleOpenEditZone = (zone: DeliveryZone) => {
    setEditingZone(zone);
    setNewZoneNameAr(zone.nameAr);
    setNewZoneFee(zone.fee);
    setNewZoneMinOrder(zone.minOrder || 0);
    setNewZoneTime(zone.estimatedTime || "30-45 دقيقة");
    setShowAddZoneModal(true);
  };

  const handleSaveZoneModal = async () => {
    if (!settings || !newZoneNameAr.trim()) return;

    let updatedZones: DeliveryZone[];
    if (editingZone) {
      updatedZones = (settings.deliveryZones || []).map((z) =>
        z.id === editingZone.id
          ? {
              ...z,
              nameAr: newZoneNameAr.trim(),
              nameEn: newZoneNameAr.trim(),
              fee: Number(newZoneFee) || 0,
              minOrder: Number(newZoneMinOrder) || 0,
              estimatedTime: newZoneTime.trim() || "30-45 دقيقة",
            }
          : z
      );
    } else {
      const newZone: DeliveryZone = {
        id: "zone-" + Date.now(),
        nameAr: newZoneNameAr.trim(),
        nameEn: newZoneNameAr.trim(),
        fee: Number(newZoneFee) || 0,
        minOrder: Number(newZoneMinOrder) || 0,
        estimatedTime: newZoneTime.trim() || "30-45 دقيقة",
        isActive: true,
      };
      updatedZones = [...(settings.deliveryZones || []), newZone];
    }

    const updatedSettings = { ...settings, deliveryZones: updatedZones };
    setSettings(updatedSettings);
    setShowAddZoneModal(false);
    setEditingZone(null);
    await handleSaveSettings(undefined, updatedSettings);
  };

  const handleDeleteZone = async (zoneId: string) => {
    if (!settings) return;
    if (!confirm("هل أنت متأكد من حذف هذه المنطقة؟")) return;
    const updatedZones = (settings.deliveryZones || []).filter((z) => z.id !== zoneId);
    const updatedSettings = { ...settings, deliveryZones: updatedZones };
    setSettings(updatedSettings);
    await handleSaveSettings(undefined, updatedSettings);
  };

  const handleToggleZone = async (zoneId: string) => {
    if (!settings) return;
    const updatedZones = (settings.deliveryZones || []).map((z) =>
      z.id === zoneId ? { ...z, isActive: !z.isActive } : z
    );
    const updatedSettings = { ...settings, deliveryZones: updatedZones };
    setSettings(updatedSettings);
    await handleSaveSettings(undefined, updatedSettings);
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
    if (!editingItem.nameAr?.trim()) {
      flashMessage("يرجى كتابة اسم الطبق أولاً ⚠️");
      return;
    }
    try {
      const itemToSave = { ...editingItem };
      // Auto-sync English fields from Arabic in background (100% Arabic UI)
      itemToSave.nameEn = itemToSave.nameAr;
      itemToSave.descriptionEn = itemToSave.descriptionAr || "";
      
      if (itemToSave.variants && itemToSave.variants.length > 0) {
        itemToSave.basePrice = itemToSave.variants[0].price;
        itemToSave.variants = itemToSave.variants.map((v) => ({
          ...v,
          nameEn: v.nameAr,
        }));
      }
      if (itemToSave.optionGroups && itemToSave.optionGroups.length > 0) {
        itemToSave.optionGroups = itemToSave.optionGroups.map((g) => ({
          ...g,
          nameEn: g.nameAr,
          options: (g.options || []).map((o) => ({
            ...o,
            nameEn: o.nameAr,
          })),
        }));
      }

      const res = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(itemToSave),
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
    const catToSave = { ...editingCategory };
    catToSave.nameEn = catToSave.nameAr;
    const updatedCats = isNewCategory
      ? [...categories, catToSave]
      : categories.map((c) => (c.id === catToSave.id ? catToSave : c));

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
      o.type === "table" ? "طاولة" : o.type === "delivery" ? "توصيل للمنازل" : "استلام مسبق",
      o.type === "table"
        ? `طاولة ${o.tableNumber}`
        : o.type === "delivery"
        ? `${o.customerName || ""} (${o.customerPhone || ""}) - ${o.deliveryZoneName || ""} - ${o.address || ""}`
        : `${o.customerName || ""} (${o.customerPhone || ""})`,
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

  const TAB_CONFIG: Record<
    string,
    { title: string; subtitle: string; icon: React.ReactNode }
  > = {
    analytics: {
      title: "التقارير والإحصاءات والمبيعات",
      subtitle: "متابعة المبيعات، الطلبات، والأداء المالي للمطعم",
      icon: <BarChart3 className="w-5 h-5 text-amber-500" />,
    },
    reviews: {
      title: "التقييمات والآراء",
      subtitle: "استعراض آراء الزبائن ومستوى رضاهم بعد استلام الطلبات",
      icon: <Star className="w-5 h-5 text-amber-500 fill-amber-400" />,
    },
    menu: {
      title: "الأصناف والأسعار",
      subtitle: "إدارة الوجبات، الأسعار، الأحجام، والإضافات",
      icon: <UtensilsCrossed className="w-5 h-5 text-emerald-600" />,
    },
    categories: {
      title: "الأقسام والتصنيفات",
      subtitle: "ترتيب وتنسيق أقسام قائمة الطعام",
      icon: <Layers className="w-5 h-5 text-blue-600" />,
    },
    delivery: {
      title: "مناطق ورسوم التوصيل",
      subtitle: "تحديد مناطق التوصيل، الرسوم، والحد الأدنى للطلب",
      icon: <Bike className="w-5 h-5 text-purple-600" />,
    },
    tables: {
      title: "الطاولات ورموز QR",
      subtitle: "إدارة طاولات الصالة ورموز الباركود السريعة",
      icon: <QrCode className="w-5 h-5 text-indigo-600" />,
    },
    branding: {
      title: "الهوية والألوان والشعار",
      subtitle: "تخصيص ألوان المتجر، الشعار، واسم المطعم",
      icon: <Palette className="w-5 h-5 text-rose-500" />,
    },
    settings: {
      title: "الإعدادات العامة والواتساب",
      subtitle: "أرقام التواصل، الواتساب، والعملة وساعات العمل",
      icon: <Settings className="w-5 h-5 text-stone-600" />,
    },
  };

  const navSections = [
    {
      title: "الرئيسية والعمليات",
      items: [
        {
          id: "analytics" as const,
          label: "التقارير والإحصاءات",
          icon: <BarChart3 className="w-4 h-4 text-amber-500" />,
          badge: null,
          badgeColor: "",
        },
        {
          id: "reviews" as const,
          label: "التقييمات والآراء",
          icon: <Star className="w-4 h-4 text-amber-400 fill-amber-400" />,
          badge: reviews.length,
          badgeColor: "bg-amber-100 text-amber-800",
        },
      ],
    },
    {
      title: "إدارة القائمة والخدمات",
      items: [
        {
          id: "menu" as const,
          label: "الأصناف والأسعار",
          icon: <UtensilsCrossed className="w-4 h-4 text-emerald-600" />,
          badge: menuItems.length,
          badgeColor: "bg-stone-100 text-stone-700",
        },
        {
          id: "categories" as const,
          label: "الأقسام والتصنيفات",
          icon: <Layers className="w-4 h-4 text-blue-600" />,
          badge: categories.length,
          badgeColor: "bg-stone-100 text-stone-700",
        },
        {
          id: "delivery" as const,
          label: "مناطق ورسوم التوصيل",
          icon: <Bike className="w-4 h-4 text-purple-600" />,
          badge: settings?.deliveryZones?.length || 0,
          badgeColor: "bg-purple-100 text-purple-800",
        },
        {
          id: "tables" as const,
          label: "الطاولات ورموز QR",
          icon: <QrCode className="w-4 h-4 text-indigo-600" />,
          badge: tables.length,
          badgeColor: "bg-stone-100 text-stone-700",
        },
      ],
    },
    {
      title: "النظام والتخصيص",
      items: [
        {
          id: "branding" as const,
          label: "الهوية والألوان والشعار",
          icon: <Palette className="w-4 h-4 text-rose-500" />,
          badge: null,
          badgeColor: "",
        },
        {
          id: "settings" as const,
          label: "الإعدادات العامة والواتساب",
          icon: <Settings className="w-4 h-4 text-stone-600" />,
          badge: null,
          badgeColor: "",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col lg:flex-row font-sans antialiased">
      {/* Mobile Top Navbar */}
      <header
        style={{ backgroundColor: brandColor }}
        className="lg:hidden text-white p-3.5 shadow-md flex items-center justify-between sticky top-0 z-40 shrink-0"
      >
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition active:scale-95"
            aria-label="القائمة الجانبية"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-amber-400 text-stone-950 font-black flex items-center justify-center text-xs overflow-hidden">
              {settings?.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                settings?.name.charAt(0) || "ر"
              )}
            </span>
            <span className="font-extrabold text-sm truncate max-w-[130px]">{settings?.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-bold">
          <Link
            href="/"
            target="_blank"
            className="px-2.5 py-1.5 bg-white/15 hover:bg-white/25 rounded-lg flex items-center gap-1 transition"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">معاينة</span>
          </Link>
          <Link
            href="/cashier"
            className="px-2.5 py-1.5 bg-black/20 hover:bg-black/30 rounded-lg transition"
          >
            الكاشير
          </Link>
          <Link
            href="/kitchen"
            className="px-2.5 py-1.5 bg-black/20 hover:bg-black/30 rounded-lg transition"
          >
            المطبخ
          </Link>
        </div>
      </header>

      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-stone-950/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar (Desktop Sticky / Mobile Drawer) */}
      <aside
        className={`
          fixed top-0 bottom-0 right-0 z-50 w-72 bg-white border-l border-stone-200/80 shadow-2xl lg:shadow-none
          flex flex-col transition-transform duration-300 ease-in-out
          lg:static lg:translate-x-0 lg:z-auto lg:h-screen lg:sticky lg:top-0 shrink-0
          ${sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Sidebar Header */}
        <div
          style={{ backgroundColor: brandColor }}
          className="p-4 text-white flex items-center justify-between shrink-0"
        >
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/"
              className="w-10 h-10 rounded-xl bg-amber-400 text-stone-950 font-black flex items-center justify-center text-sm shadow hover:scale-105 transition overflow-hidden shrink-0"
              title="معاينة المينيو"
            >
              {settings?.logoUrl ? (
                <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                settings?.name.charAt(0) || "ر"
              )}
            </Link>
            <div className="min-w-0">
              <h1 className="text-sm font-extrabold truncate flex items-center gap-1.5">
                <span>{settings?.name || "مطعم رهيب"}</span>
              </h1>
              <p className="text-[10px] text-white/80 font-medium truncate">لوحة التحكم الشاملة</p>
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-4 text-xs font-bold">
          {navSections.map((sec, secIdx) => (
            <div key={secIdx} className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-stone-400 px-3 block">
                {sec.title}
              </span>
              <div className="space-y-0.5">
                {sec.items.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? "bg-[#780000] text-white shadow-xs font-black scale-[1.01]"
                          : "text-stone-600 hover:text-stone-950 hover:bg-stone-100"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={isActive ? "text-white" : ""}>
                          {item.icon}
                        </span>
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== null && item.badge !== undefined && (
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full transition-colors ${
                            isActive
                              ? "bg-white/20 text-white"
                              : item.badgeColor || "bg-stone-100 text-stone-700"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-stone-200/80 bg-stone-50/70 space-y-2 shrink-0">
          <button
            onClick={handleExportCSV}
            className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير المبيعات CSV</span>
          </button>

          <div className="grid grid-cols-3 gap-1 pt-1 text-[11px] font-bold text-center">
            <Link
              href="/"
              target="_blank"
              className="py-1.5 px-1 bg-white hover:bg-stone-100 text-stone-700 rounded-lg border border-stone-200/80 transition flex items-center justify-center gap-1"
              title="معاينة المينيو"
            >
              <Eye className="w-3 h-3 text-stone-500" />
              <span>المينيو</span>
            </Link>
            <Link
              href="/cashier"
              className="py-1.5 px-1 bg-white hover:bg-stone-100 text-stone-700 rounded-lg border border-stone-200/80 transition"
            >
              الكاشير
            </Link>
            <Link
              href="/kitchen"
              className="py-1.5 px-1 bg-white hover:bg-stone-100 text-stone-700 rounded-lg border border-stone-200/80 transition"
            >
              المطبخ
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Desktop Top Header Bar */}
        <div className="hidden lg:flex items-center justify-between px-6 py-3.5 bg-white border-b border-stone-200/80 shrink-0 sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center">
              {TAB_CONFIG[activeTab]?.icon || <Settings className="w-4 h-4 text-stone-600" />}
            </div>
            <div>
              <h2 className="text-sm font-black text-stone-900">
                {TAB_CONFIG[activeTab]?.title || "لوحة التحكم"}
              </h2>
              <p className="text-[11px] text-stone-400 font-medium">
                {TAB_CONFIG[activeTab]?.subtitle || "إدارة أقسام المتجر"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-stone-500" />
              <span>معاينة صفحة المينيو</span>
            </Link>
            <Link
              href="/cashier"
              className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition"
            >
              شاشة الكاشير
            </Link>
            <Link
              href="/kitchen"
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-xl text-xs font-bold transition"
            >
              شاشة المطبخ
            </Link>
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
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
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
                    basePrice: 0,
                    imageUrl: "",
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
                              {item.variants && item.variants.length > 0 ? item.variants[0].price : item.basePrice}
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
                  value={settings.whatsapp || ""}
                  onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
                  placeholder="9647709768760"
                  className="w-full p-2.5 border rounded-xl font-mono text-emerald-800 font-bold"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">هاتف المطعم للاتصال:</label>
                <input
                  type="text"
                  value={settings.phone || ""}
                  onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                  placeholder="+9647709768760"
                  className="w-full p-2.5 border rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold block mb-1">العملة:</label>
                <input
                  type="text"
                  value={settings.currency || ""}
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

        {/* TAB: DELIVERY ZONES & SETTINGS */}
        {activeTab === "delivery" && settings && (
          <div className="space-y-6 max-w-4xl">
            {/* 1. General Delivery Settings Card */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-xs space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
                <div>
                  <h2 className="text-base font-black text-stone-900 flex items-center gap-2">
                    <Bike className="w-5 h-5 text-[#780000]" />
                    <span>إعدادات خدمة التوصيل</span>
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5">
                    التحكم في تشغيل الخدمة، التوصيل المجاني، والوقت التقديري الافتراضي
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleSaveSettings()}
                  className="px-5 py-2.5 bg-[#780000] hover:bg-[#5c0000] text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ الإعدادات</span>
                </button>
              </div>

              {/* Delivery Service Master Toggle Card */}
              <div className="p-4 rounded-2xl border border-stone-200/80 bg-stone-50/60 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors shrink-0 ${
                      settings.deliveryEnabled
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-stone-200 text-stone-500"
                    }`}
                  >
                    <Bike className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-stone-900 block">
                        خدمة التوصيل للمنازل
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          settings.deliveryEnabled
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-stone-200 text-stone-600"
                        }`}
                      >
                        {settings.deliveryEnabled ? "مفعّلة" : "معطلة مؤقتاً"}
                      </span>
                    </div>
                    <span className="text-[11px] text-stone-500 mt-0.5 block">
                      {settings.deliveryEnabled
                        ? "خيار التوصيل متاح للزبائن عند إتمام الطلب من المنيو"
                        : "خدمة التوصيل متوقفة حالياً، يتاح للزبائن الطلب داخل المطعم أو الاستلام فقط"}
                    </span>
                  </div>
                </div>

                {/* Sleek Toggle Switch */}
                <button
                  type="button"
                  onClick={() => {
                    const updated = { ...settings, deliveryEnabled: !settings.deliveryEnabled };
                    setSettings(updated);
                    handleSaveSettings(undefined, updated);
                  }}
                  className={`relative inline-flex h-7 w-13 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    settings.deliveryEnabled ? "bg-emerald-600" : "bg-stone-300"
                  }`}
                  role="switch"
                  aria-checked={settings.deliveryEnabled}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      settings.deliveryEnabled ? "-translate-x-6" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Global Settings Form: 2 Clean Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Free Delivery Threshold */}
                <div className="p-4 rounded-2xl border border-stone-200 bg-white space-y-1.5 focus-within:border-[#780000] focus-within:ring-2 focus-within:ring-[#780000]/10 transition">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-800">
                    <label className="flex items-center gap-1.5">
                      <Gift className="w-4 h-4 text-[#780000]" />
                      <span>توصيل مجاني للطلبات فوق:</span>
                    </label>
                    <span className="text-[10px] text-stone-400 font-normal">0 لإلغاء الميزة</span>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={settings.freeDeliveryThreshold ?? 0}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          freeDeliveryThreshold: Number(e.target.value) || 0,
                        })
                      }
                      className="w-full pl-12 pr-3 py-2 text-sm font-black text-stone-900 border border-stone-200 rounded-xl focus:outline-hidden focus:border-[#780000]"
                      placeholder="0"
                    />
                    <span className="absolute left-3 text-xs font-bold text-stone-400 pointer-events-none">
                      {settings.currency}
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-400">
                    يحصل الزبون على توصيل مجاني تلقائياً إذا بلغت قيمة أصنافه هذا المبلغ.
                  </p>
                </div>

                {/* Default Delivery Time */}
                <div className="p-4 rounded-2xl border border-stone-200 bg-white space-y-1.5 focus-within:border-[#780000] focus-within:ring-2 focus-within:ring-[#780000]/10 transition">
                  <div className="flex items-center justify-between text-xs font-bold text-stone-800">
                    <label className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[#780000]" />
                      <span>الوقت التقديري الافتراضي:</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={settings.defaultDeliveryTime || "30-45 دقيقة"}
                    onChange={(e) =>
                      setSettings({ ...settings, defaultDeliveryTime: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm font-bold text-stone-900 border border-stone-200 rounded-xl focus:outline-hidden focus:border-[#780000]"
                    placeholder="مثال: 30-45 دقيقة"
                  />
                  <p className="text-[10px] text-stone-400">
                    يظهر للزبائن في سلة الشراء وأثناء تتبع خط سير الطلب.
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Delivery Zones List Card */}
            <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-stone-900">مناطق التوصيل والأسعار</h3>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700">
                      {settings.deliveryZones?.length || 0} مناطق
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    حدد أجرة التوصيل الخاصة بكل حي أو منطقة مع الحد الأدنى للطلب
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddZone}
                  className="px-4 py-2 bg-[#780000] hover:bg-[#5c0000] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة منطقة جديدة</span>
                </button>
              </div>

              {(!settings.deliveryZones || settings.deliveryZones.length === 0) ? (
                <div className="py-12 px-4 text-center border-2 border-dashed border-stone-200 rounded-3xl bg-stone-50/50 flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-2xl bg-red-50 text-[#780000] flex items-center justify-center mb-3">
                    <MapPin className="w-7 h-7" />
                  </div>
                  <h4 className="text-sm font-black text-stone-800 mb-1">
                    لم تقم بإضافة مناطق توصيل بعد
                  </h4>
                  <p className="text-xs text-stone-500 max-w-sm mb-4">
                    أضف الأحياء والمناطق التي يخدمها المطعم مع تحديد كلفة التوصيل لكل منها ليختار الزبون منها بسهولة.
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenAddZone}
                    className="px-5 py-2.5 bg-[#780000] hover:bg-[#5c0000] text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-2 transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة أول منطقة توصيل</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {settings.deliveryZones.map((zone) => (
                    <div
                      key={zone.id}
                      className={`p-4 rounded-2xl border transition-all flex flex-wrap items-center justify-between gap-3 ${
                        zone.isActive
                          ? "bg-white border-stone-200 shadow-xs hover:border-stone-300"
                          : "bg-stone-50 border-stone-200/60 opacity-60"
                      }`}
                    >
                      {/* Right: Zone Name + Time badge */}
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                            zone.isActive ? "bg-red-50 text-[#780000]" : "bg-stone-200 text-stone-500"
                          }`}
                        >
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-stone-900">{zone.nameAr}</h4>
                            <button
                              type="button"
                              onClick={() => handleToggleZone(zone.id)}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition flex items-center gap-1 ${
                                zone.isActive
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                                  : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                              }`}
                              title="تبديل الحالة"
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  zone.isActive ? "bg-emerald-500" : "bg-stone-400"
                                }`}
                              />
                              <span>{zone.isActive ? "متاحة للطلب" : "معطلة"}</span>
                            </button>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-stone-400" />
                              <span>{zone.estimatedTime || "30-45 دقيقة"}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Center: Fee & Min order badges */}
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <div className="px-3 py-1.5 bg-red-50 text-[#780000] border border-red-100 rounded-xl font-black">
                          أجرة التوصيل: {zone.fee.toLocaleString()} {settings.currency}
                        </div>

                        <div className="px-3 py-1.5 bg-stone-100 text-stone-700 rounded-xl font-bold">
                          {zone.minOrder && zone.minOrder > 0
                            ? `الحد الأدنى: ${zone.minOrder.toLocaleString()} ${settings.currency}`
                            : "بدون حد أدنى للطلب"}
                        </div>
                      </div>

                      {/* Left: Actions */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEditZone(zone)}
                          className="px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-bold transition flex items-center gap-1.5"
                          title="تعديل المنطقة"
                        >
                          <Edit className="w-3.5 h-3.5 text-stone-500" />
                          <span>تعديل</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteZone(zone.id)}
                          className="p-1.5 text-stone-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition"
                          title="حذف المنطقة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal: Add / Edit Delivery Zone */}
            {showAddZoneModal && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div
                  className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 animate-scale-up"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                    <h3 className="text-base font-black text-stone-900 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-red-50 text-[#780000] flex items-center justify-center">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <span>{editingZone ? "تعديل منطقة التوصيل" : "إضافة منطقة توصيل جديدة"}</span>
                    </h3>
                    <button
                      onClick={() => {
                        setShowAddZoneModal(false);
                        setEditingZone(null);
                      }}
                      className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4 text-xs">
                    {/* Zone Name */}
                    <div>
                      <label className="font-bold text-stone-800 block mb-1">
                        اسم الحي أو المنطقة <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newZoneNameAr}
                        onChange={(e) => setNewZoneNameAr(e.target.value)}
                        placeholder="مثال: المجتبى، حي الحسين، المعلمين"
                        className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl font-bold text-stone-900 focus:outline-hidden focus:border-[#780000] focus:ring-2 focus:ring-[#780000]/10 transition"
                        autoFocus
                      />
                    </div>

                    {/* Fee & Min Order */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-stone-800 block mb-1">
                          أجرة التوصيل ({settings.currency}) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min={0}
                          step={500}
                          value={newZoneFee}
                          onChange={(e) => setNewZoneFee(Number(e.target.value) || 0)}
                          className="w-full px-3 py-2.5 border border-stone-200 rounded-xl font-black text-[#780000] focus:outline-hidden focus:border-[#780000] focus:ring-2 focus:ring-[#780000]/10 transition"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-stone-800 block mb-1">
                          الحد الأدنى للطلب ({settings.currency})
                        </label>
                        <input
                          type="number"
                          min={0}
                          step={1000}
                          value={newZoneMinOrder}
                          onChange={(e) => setNewZoneMinOrder(Number(e.target.value) || 0)}
                          placeholder="0 لعدم وجود حد أدنى"
                          className="w-full px-3 py-2.5 border border-stone-200 rounded-xl font-bold text-stone-800 focus:outline-hidden focus:border-[#780000] focus:ring-2 focus:ring-[#780000]/10 transition"
                        />
                      </div>
                    </div>

                    {/* Est Time */}
                    <div>
                      <label className="font-bold text-stone-800 block mb-1">
                        الوقت التقديري للتوصيل
                      </label>
                      <input
                        type="text"
                        value={newZoneTime}
                        onChange={(e) => setNewZoneTime(e.target.value)}
                        placeholder="مثال: 30-45 دقيقة"
                        className="w-full px-3.5 py-2.5 border border-stone-200 rounded-xl font-semibold text-stone-800 focus:outline-hidden focus:border-[#780000] focus:ring-2 focus:ring-[#780000]/10 transition"
                      />
                      <span className="text-[10px] text-stone-400 mt-1 block">
                        يظهر للزبون عند اختياره هذه المنطقة تحديداً
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddZoneModal(false);
                        setEditingZone(null);
                      }}
                      className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition"
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveZoneModal}
                      disabled={!newZoneNameAr.trim()}
                      className="px-6 py-2.5 bg-[#780000] hover:bg-[#5c0000] text-white rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-50"
                    >
                      {editingZone ? "حفظ التعديل" : "إضافة المنطقة"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB: CUSTOMER REVIEWS */}
        {activeTab === "reviews" && (
          <div className="space-y-5">
            {/* Header & Refresh */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
              <div>
                <h2 className="text-base font-black text-stone-900 flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500 fill-amber-400" />
                  تقييمات وآراء الزبائن
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  استعراض آراء العملاء وانطباعاتهم بعد استلام الطلبات ومستوى رضاهم
                </p>
              </div>
              <button
                type="button"
                onClick={fetchReviews}
                disabled={isLoadingReviews}
                className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <Clock className={`w-3.5 h-3.5 ${isLoadingReviews ? "animate-spin" : ""}`} />
                <span>تحديث الآراء</span>
              </button>
            </div>

            {/* Rating Stats Grid */}
            {(() => {
              const total = reviews.length;
              const avg = total > 0 ? (reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0) / total).toFixed(1) : "0.0";
              const fiveCount = reviews.filter((r) => Number(r.rating) === 5).length;
              const fourCount = reviews.filter((r) => Number(r.rating) === 4).length;
              const threeCount = reviews.filter((r) => Number(r.rating) === 3).length;
              const lowCount = reviews.filter((r) => Number(r.rating) <= 2).length;
              const satisfaction = total > 0 ? Math.round(((fiveCount + fourCount) / total) * 100) : 100;

              return (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                      <Star className="w-6 h-6 fill-amber-400 text-amber-500" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-stone-500 block">متوسط التقييم العام</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-2xl font-black text-stone-900">{avg}</span>
                        <span className="text-xs font-bold text-stone-400">/ 5.0</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-stone-500 block">إجمالي الآراء والتقييمات</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-2xl font-black text-stone-900">{total}</span>
                        <span className="text-xs font-bold text-stone-400">تقييم</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <ThumbsUp className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-stone-500 block">نسبة رضا الزبائن</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-2xl font-black text-emerald-700">{satisfaction}%</span>
                        <span className="text-xs font-bold text-stone-400">راضي جداً</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                      <Sparkles className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-stone-500 block">تقييمات 5 نجوم (ممتاز)</span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-2xl font-black text-purple-900">{fiveCount}</span>
                        <span className="text-xs font-bold text-stone-400">
                          ({total > 0 ? Math.round((fiveCount / total) * 100) : 0}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Filter Chips */}
            <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-2xl border border-stone-200/80 shadow-xs text-xs font-bold">
              <span className="text-stone-500 ml-1">تصفية التقييمات:</span>
              <button
                type="button"
                onClick={() => setReviewFilter("all")}
                className={`px-3 py-1.5 rounded-xl transition ${
                  reviewFilter === "all"
                    ? "bg-[#780000] text-white shadow-xs"
                    : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                }`}
              >
                الكل ({reviews.length})
              </button>
              <button
                type="button"
                onClick={() => setReviewFilter(5)}
                className={`px-3 py-1.5 rounded-xl flex items-center gap-1 transition ${
                  reviewFilter === 5
                    ? "bg-amber-500 text-white shadow-xs"
                    : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                }`}
              >
                <span>5 نجوم ★</span>
                <span>({reviews.filter((r) => Number(r.rating) === 5).length})</span>
              </button>
              <button
                type="button"
                onClick={() => setReviewFilter(4)}
                className={`px-3 py-1.5 rounded-xl flex items-center gap-1 transition ${
                  reviewFilter === 4
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                }`}
              >
                <span>4 نجوم ★</span>
                <span>({reviews.filter((r) => Number(r.rating) === 4).length})</span>
              </button>
              <button
                type="button"
                onClick={() => setReviewFilter(3)}
                className={`px-3 py-1.5 rounded-xl flex items-center gap-1 transition ${
                  reviewFilter === 3
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                }`}
              >
                <span>3 نجوم ★</span>
                <span>({reviews.filter((r) => Number(r.rating) === 3).length})</span>
              </button>
              <button
                type="button"
                onClick={() => setReviewFilter(2)}
                className={`px-3 py-1.5 rounded-xl flex items-center gap-1 transition ${
                  reviewFilter === 2
                    ? "bg-rose-600 text-white shadow-xs"
                    : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                }`}
              >
                <span>1-2 نجوم ★</span>
                <span>({reviews.filter((r) => Number(r.rating) <= 2).length})</span>
              </button>
            </div>

            {/* Reviews List */}
            {(() => {
              const filtered = reviews.filter((r) => {
                if (reviewFilter === "all") return true;
                if (reviewFilter === 2) return Number(r.rating) <= 2;
                return Number(r.rating) === reviewFilter;
              });

              if (filtered.length === 0) {
                return (
                  <div className="bg-white rounded-2xl p-12 text-center border border-stone-200/80 shadow-xs space-y-3">
                    <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto">
                      <Star className="w-7 h-7 fill-amber-400 text-amber-400" />
                    </div>
                    <h3 className="text-base font-black text-stone-800">لا توجد تقييمات مسجلة بعد</h3>
                    <p className="text-xs text-stone-500 max-w-sm mx-auto">
                      عند اكتمال وتسليم أي طلب، سيظهر للزبون خيار تقييم الطلب وإعطاء رأيه، وستُعرض تقييماتهم هنا فوراً.
                    </p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filtered.map((rev) => {
                    const ratingNum = Number(rev.rating) || 5;
                    const dateStr = rev.createdAt
                      ? new Date(rev.createdAt).toLocaleString("ar-IQ", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })
                      : "الآن";

                    return (
                      <div
                        key={rev.id}
                        className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs hover:shadow-md transition space-y-3 flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          {/* Card Header */}
                          <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-black text-stone-900">
                                  {rev.customerName || "زبون مطعم رهيب"}
                                </h4>
                                {rev.orderNumber && (
                                  <span className="text-[10px] font-extrabold bg-[#780000]/10 text-[#780000] px-2 py-0.5 rounded-full">
                                    طلب #{rev.orderNumber}
                                  </span>
                                )}
                              </div>
                              {rev.customerPhone && (
                                <a
                                  href={`tel:${rev.customerPhone}`}
                                  className="text-xs text-stone-500 font-bold hover:text-[#780000] transition mt-0.5 inline-block"
                                >
                                  📞 {rev.customerPhone}
                                </a>
                              )}
                            </div>
                            <div className="text-left">
                              <span className="text-[11px] font-bold text-stone-400 block">{dateStr}</span>
                              {rev.orderType && (
                                <span className="text-[10px] font-bold bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md mt-1 inline-block">
                                  {rev.orderType === "delivery" && "توصيل 🛵"}
                                  {rev.orderType === "takeaway" && "سفري 🥡"}
                                  {rev.orderType === "table" && "صالة 🍽️"}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Stars and Rating Tag */}
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                  key={s}
                                  className={`w-4 h-4 ${
                                    s <= ratingNum
                                      ? "text-amber-400 fill-amber-400"
                                      : "text-stone-200"
                                  }`}
                                />
                              ))}
                            </div>
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                ratingNum === 5
                                  ? "bg-amber-50 text-amber-700"
                                  : ratingNum === 4
                                  ? "bg-emerald-50 text-emerald-700"
                                  : ratingNum === 3
                                  ? "bg-blue-50 text-blue-700"
                                  : "bg-rose-50 text-rose-700"
                              }`}
                            >
                              {ratingNum === 5 && "ممتاز جداً 🔥"}
                              {ratingNum === 4 && "جيد جداً 👍"}
                              {ratingNum === 3 && "مقبول 👌"}
                              {ratingNum <= 2 && "تجربة غير مرضية 👎"}
                            </span>
                          </div>

                          {/* Selected Preset Opinion Tags */}
                          {Array.isArray(rev.tags) && rev.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {rev.tags.map((tag, idx) => (
                                <span
                                  key={idx}
                                  className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-stone-100 text-stone-800 border border-stone-200/60"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Written Comment */}
                          {rev.comment && (
                            <div className="bg-stone-50 border border-stone-200/70 rounded-xl p-3 text-xs text-stone-700 font-medium leading-relaxed flex items-start gap-2">
                              <MessageSquare className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                              <p className="flex-1 italic">"{rev.comment}"</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB 6: ANALYTICS */}
        {activeTab === "analytics" && (
          <div className="space-y-5" dir="rtl">
            {/* Control Bar: Time-Range Filters & Export CSV */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-black text-stone-500 flex items-center gap-1.5 ml-2">
                  <Filter className="w-3.5 h-3.5 text-stone-400" />
                  النطاق الزمني:
                </span>
                <div className="inline-flex p-1 bg-stone-100 rounded-xl gap-1">
                  {[
                    { id: "today", label: "اليوم" },
                    { id: "week", label: "آخر 7 أيام" },
                    { id: "month", label: "آخر 30 يوم" },
                    { id: "all", label: "كل الوقت" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setAnalyticsRange(t.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${
                        analyticsRange === t.id
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

            {/* 4 Executive KPI Cards (Optimized RTL Layout) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Total Sales */}
              <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs hover:shadow-md transition flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-bold text-stone-500 block truncate">إجمالي المبيعات المحققة</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-stone-900 tracking-tight">
                      {totalSales.toLocaleString()}
                    </span>
                    <span className="text-xs font-extrabold text-stone-500">
                      {settings?.currency || "د.ع"}
                    </span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between text-[10px]">
                    <span className="text-stone-400 font-medium">صافي الطلبات</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      نقداً بالكامل
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 2: Orders Count */}
              <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs hover:shadow-md transition flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-bold text-stone-500 block truncate">عدد الطلبات الصافية</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-stone-900 tracking-tight">
                      {nonCancelledOrders.length}
                    </span>
                    <span className="text-xs font-extrabold text-stone-500">طلب نشط</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between text-[10px]">
                    <span className="text-stone-400 font-medium">
                      {cancelledOrders.length} ملغي
                    </span>
                    <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                      {completedOrders.length} مكتمل
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 3: Avg Order Value */}
              <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs hover:shadow-md transition flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Award className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-bold text-stone-500 block truncate">متوسط قيمة الفاتورة</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-amber-600 tracking-tight">
                      {avgOrderValue.toLocaleString()}
                    </span>
                    <span className="text-xs font-extrabold text-stone-500">
                      {settings?.currency || "د.ع"}
                    </span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between text-[10px]">
                    <span className="text-stone-400 font-medium">معدل سلة الزبون</span>
                    <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md">
                      متوسط الطلب
                    </span>
                  </div>
                </div>
              </div>

              {/* Card 4: Service Type */}
              <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs hover:shadow-md transition flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-bold text-stone-500 block truncate">نوع الخدمة والطلب</span>
                  <div className="mt-1 flex items-baseline justify-between text-xs font-black">
                    <span className="text-stone-800">
                      صالة: <span dir="ltr">{dineInPercent}%</span> ({dineInCount})
                    </span>
                    <span className="text-purple-700">
                      سفري: <span dir="ltr">{takeawayPercent}%</span> ({takeawayCount})
                    </span>
                  </div>
                  {/* Visual Progress Bar (Filling Right to Left) */}
                  <div className="mt-2 w-full bg-purple-100 h-2 rounded-full overflow-hidden flex flex-row justify-start" dir="rtl">
                    <div style={{ width: `${dineInPercent}%` }} className="bg-stone-800 h-full transition-all duration-500 shrink-0" />
                    <div style={{ width: `${takeawayPercent}%` }} className="bg-purple-600 h-full transition-all duration-500 shrink-0" />
                  </div>
                  <div className="mt-2 pt-1 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-400 font-bold">
                    <span>صالة: {dineInSales.toLocaleString()} {settings?.currency}</span>
                    <span>سفري: {takeawaySales.toLocaleString()} {settings?.currency}</span>
                  </div>
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
                <div className="h-48 flex items-end justify-between gap-2 pt-6 pb-2 px-1 border-b border-stone-100" dir="rtl">
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
                            className={`w-full rounded-t-xl transition-all duration-700 ${
                              isToday
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
                            <div className="flex items-center gap-1.5 font-black">
                              <span className="text-stone-900">{cat.revenue.toLocaleString()} {settings?.currency}</span>
                              <span dir="ltr" className="text-[10px] text-purple-600 font-extrabold">({share}%)</span>
                            </div>
                          </div>
                          {/* Progress bar starting strictly from right in RTL */}
                          <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden flex flex-row justify-start" dir="rtl">
                            <div
                              style={{ width: `${Math.max(4, share)}%` }}
                              className="bg-gradient-to-l from-purple-500 to-indigo-500 h-full rounded-full transition-all duration-500 shrink-0"
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
                    الأطباق الأكثر طلباً ومبيعاً (الأعلى إقبالاً ⭐)
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
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
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
                    <span className="text-emerald-600 font-black" dir="ltr">
                      {filteredOrders.length > 0
                        ? `${100 - Math.round((cancelledOrders.length / filteredOrders.length) * 100)}%`
                        : "100%"}
                    </span>
                  </div>
                  {/* Progress bar strictly starts from right */}
                  <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden flex flex-row justify-start" dir="rtl">
                    <div
                      style={{
                        width: `${
                          filteredOrders.length > 0
                            ? 100 - Math.round((cancelledOrders.length / filteredOrders.length) * 100)
                            : 100
                        }%`,
                      }}
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500 shrink-0"
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
    </div>

      {/* COMPREHENSIVE ITEM EDIT / ADD MODAL */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl max-h-[92vh] flex flex-col border border-stone-200 overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-stone-100 bg-linear-to-r from-stone-50 via-white to-stone-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#780000]/10 text-[#780000] flex items-center justify-center">
                  <ChefHat className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-stone-900">
                    {isNewItem ? "إضافة طبق جديد للمنيو 🍽️" : `تعديل طبق: ${editingItem.nameAr || "طبق بدون اسم"}`}
                  </h3>
                  <p className="text-[11px] text-stone-500 font-medium">
                    حدد اسم الطبق، القسم، السعر، الأحجام والإضافات الخاصة به
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-400 hover:text-stone-700 flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Content */}
            <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-5 text-xs">
              
              {/* SECTION 1: الأساسيات */}
              <div className="bg-stone-50/80 border border-stone-200/90 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-stone-200/60 text-stone-900 font-black text-xs">
                  <UtensilsCrossed className="w-4 h-4 text-[#780000]" />
                  <span>البيانات الأساسية للطبق</span>
                </div>

                {/* Dish Name */}
                <div>
                  <label className="font-bold text-stone-800 block mb-1.5">
                    اسم الطبق <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingItem.nameAr}
                    onChange={(e) => setEditingItem({ ...editingItem, nameAr: e.target.value })}
                    placeholder="مثال: مشويات مشكل رهيب فاخر"
                    className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl font-bold text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#780000]/20 focus:border-[#780000] placeholder:text-stone-400 shadow-2xs transition"
                  />
                </div>

                {/* Category & Availability */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-bold text-stone-800 block mb-1.5">قسم الطبق في المنيو:</label>
                    <select
                      value={editingItem.categoryId}
                      onChange={(e) => setEditingItem({ ...editingItem, categoryId: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl font-bold text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#780000]/20 focus:border-[#780000] shadow-2xs transition"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nameAr}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-stone-800 block mb-1.5">حالة التوفر للطلب:</label>
                    <div className="grid grid-cols-2 gap-2 bg-stone-200/60 p-1 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setEditingItem({ ...editingItem, isAvailable: true })}
                        className={`py-1.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                          editingItem.isAvailable
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "text-stone-600 hover:text-stone-900"
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>متوفر للطلب</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingItem({ ...editingItem, isAvailable: false })}
                        className={`py-1.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                          !editingItem.isAvailable
                            ? "bg-red-600 text-white shadow-xs"
                            : "text-stone-600 hover:text-stone-900"
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>نفد مؤقتاً</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Dish Description */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-stone-800 block">وصف ومكونات الطبق:</label>
                    <span className="text-[10px] text-stone-400 font-normal">اختياري</span>
                  </div>
                  <textarea
                    value={editingItem.descriptionAr}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, descriptionAr: e.target.value })
                    }
                    rows={2}
                    placeholder="اكتب نبذة شهية عن مكونات الطبق وطريقة تحضيره ومحتوياته..."
                    className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#780000]/20 focus:border-[#780000] placeholder:text-stone-400 shadow-2xs transition leading-relaxed"
                  />
                </div>
              </div>

              {/* SECTION 2: التسعير والصورة والوسوم */}
              <div className="bg-stone-50/80 border border-stone-200/90 rounded-2xl p-4 sm:p-5 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-stone-200/60 text-stone-900 font-black text-xs">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>السعر والصورة الترويجية</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Price */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-bold text-stone-800 block">السعر الأساسي:</label>
                      {editingItem.variants && editingItem.variants.length > 0 && (
                        <span className="text-[10px] text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md font-bold">
                          مرتبط بأول حجم
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        value={editingItem.basePrice}
                        onChange={(e) => {
                          const newPrice = Number(e.target.value) || 0;
                          let updatedVariants = editingItem.variants;
                          if (updatedVariants && updatedVariants.length > 0) {
                            updatedVariants = [...updatedVariants];
                            updatedVariants[0] = { ...updatedVariants[0], price: newPrice };
                          }
                          setEditingItem({
                            ...editingItem,
                            basePrice: newPrice,
                            variants: updatedVariants,
                          });
                        }}
                        className="w-full pl-12 pr-3.5 py-2.5 bg-white border border-stone-300 rounded-xl font-black text-base text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#780000]/20 focus:border-[#780000] shadow-2xs transition"
                      />
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-500 font-bold text-xs pointer-events-none">
                        {settings?.currency || "د.ع"}
                      </span>
                    </div>
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="font-bold text-stone-800 block mb-1.5">صورة الطبق:</label>
                    <div className="flex items-center gap-3">
                      {editingItem.imageUrl ? (
                        <div className="relative group shrink-0">
                          <img
                            src={editingItem.imageUrl}
                            alt="Preview"
                            className="w-16 h-16 rounded-2xl object-cover border-2 border-white ring-1 ring-stone-200 shadow-xs"
                          />
                          <button
                            type="button"
                            onClick={() => setEditingItem({ ...editingItem, imageUrl: "" })}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-[10px] shadow-xs hover:bg-red-700 transition"
                            title="حذف الصورة"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-stone-100 border-2 border-dashed border-stone-300 flex flex-col items-center justify-center text-stone-400 shrink-0">
                          <ImageIcon className="w-6 h-6 stroke-[1.8]" />
                        </div>
                      )}

                      <div className="flex-1 space-y-1">
                        <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-[#780000] hover:bg-[#600000] text-white rounded-xl text-xs font-bold transition shadow-xs">
                          {isUploading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <UploadCloud className="w-4 h-4" />
                          )}
                          <span>
                            {isUploading
                              ? "جاري رفع الصورة..."
                              : editingItem.imageUrl
                              ? "تغيير صورة الطبق 📷"
                              : "رفع صورة من جهازك ☁️"}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={isUploading}
                            onChange={(e) => handleUploadImage(e, "item")}
                            className="hidden"
                          />
                        </label>
                        <p className="text-[10px] text-stone-400 font-medium">
                          يدعم صور JPG و PNG و WebP بجودة عالية
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="pt-2">
                  <label className="font-bold text-stone-800 block mb-2">شارات التميز على الطبق:</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "popular", label: "الأكثر طلباً", emoji: "🔥" },
                      { id: "spicy", label: "حار", emoji: "🌶️" },
                      { id: "vegetarian", label: "نباتي", emoji: "🥗" },
                      { id: "new", label: "جديد", emoji: "✨" },
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
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition flex items-center gap-1.5 ${
                            isChecked
                              ? "bg-stone-900 text-white border-stone-900 shadow-xs"
                              : "bg-white text-stone-700 border-stone-200 hover:border-stone-300 hover:bg-stone-50"
                          }`}
                        >
                          <span>{tag.emoji}</span>
                          <span>{tag.label}</span>
                          {isChecked && <Check className="w-3 h-3 text-emerald-400 stroke-[3]" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* SECTION 3: الأحجام المتعددة */}
              <div className="bg-stone-50/80 border border-stone-200/90 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-stone-200/60">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-amber-600" />
                    <div>
                      <span className="font-black text-stone-900 text-xs">الأحجام المتعددة</span>
                      <span className="text-[10px] text-stone-400 font-normal mr-2">
                        (اختياري - مثل: نصف كيلو، كيلو، نفر، عائلي)
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newVar: ItemVariant = {
                        id: `var-${Date.now()}`,
                        nameAr: "حجم جديد",
                        nameEn: "حجم جديد",
                        price: editingItem.basePrice,
                      };
                      setEditingItem({
                        ...editingItem,
                        variants: [...(editingItem.variants || []), newVar],
                      });
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة حجم</span>
                  </button>
                </div>

                {editingItem.variants && editingItem.variants.length > 0 ? (
                  <div className="space-y-2 pt-1">
                    {editingItem.variants.map((v, vIdx) => (
                      <div
                        key={v.id}
                        className="flex items-center gap-2 bg-white p-2.5 rounded-xl border border-stone-200 shadow-2xs"
                      >
                        <div className="w-6 h-6 rounded-full bg-stone-100 text-stone-600 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {vIdx + 1}
                        </div>
                        <input
                          type="text"
                          value={v.nameAr}
                          onChange={(e) => {
                            const copy = [...(editingItem.variants || [])];
                            copy[vIdx].nameAr = e.target.value;
                            copy[vIdx].nameEn = e.target.value;
                            setEditingItem({ ...editingItem, variants: copy });
                          }}
                          placeholder="اسم الحجم (مثال: نصف كيلو، كبير، عائلي)"
                          className="flex-1 px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-bold text-stone-900 focus:outline-none focus:bg-white focus:border-[#780000]"
                        />
                        <div className="relative w-28 shrink-0">
                          <input
                            type="number"
                            value={v.price}
                            onChange={(e) => {
                              const newPrice = Number(e.target.value) || 0;
                              const copy = [...(editingItem.variants || [])];
                              copy[vIdx].price = newPrice;
                              setEditingItem({
                                ...editingItem,
                                variants: copy,
                                basePrice: vIdx === 0 ? newPrice : editingItem.basePrice,
                              });
                            }}
                            placeholder="السعر"
                            className="w-full pl-8 pr-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-black text-stone-900 focus:outline-none focus:bg-white focus:border-[#780000]"
                          />
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-stone-400 font-bold pointer-events-none">
                            {settings?.currency || "د.ع"}
                          </span>
                        </div>
                        {vIdx === 0 && (
                          <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-2 py-1 rounded-md shrink-0">
                            الأساسي
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            const copy = editingItem.variants?.filter((_, i) => i !== vIdx);
                            setEditingItem({ ...editingItem, variants: copy });
                          }}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition shrink-0"
                          title="حذف الحجم"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-stone-500 bg-white/70 border border-dashed border-stone-200 rounded-xl p-3 text-center">
                    لا توجد أحجام مخصصة، سيتم اعتماد السعر الأساسي للطبق
                  </p>
                )}
              </div>

              {/* SECTION 4: مجموعات الإضافات والخيارات */}
              <div className="bg-stone-50/80 border border-stone-200/90 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-stone-200/60">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <div>
                      <span className="font-black text-stone-900 text-xs">مجموعات الخيارات والإضافات</span>
                      <span className="text-[10px] text-stone-400 font-normal mr-2">
                        (مثل: نوع الصوص، إكسترا جبن، مقبلات)
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newGroup: OptionGroup = {
                        id: `grp-${Date.now()}`,
                        nameAr: "مجموعة خيارات جديدة",
                        nameEn: "مجموعة خيارات جديدة",
                        required: false,
                        options: [
                          { id: `opt-${Date.now()}-1`, nameAr: "خيار 1", nameEn: "خيار 1", price: 0 },
                        ],
                      };
                      setEditingItem({
                        ...editingItem,
                        optionGroups: [...(editingItem.optionGroups || []), newGroup],
                      });
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>إضافة مجموعة إضافات</span>
                  </button>
                </div>

                {editingItem.optionGroups && editingItem.optionGroups.length > 0 ? (
                  <div className="space-y-3 pt-1">
                    {editingItem.optionGroups.map((group, gIdx) => (
                      <div
                        key={group.id}
                        className="bg-white p-3.5 sm:p-4 rounded-xl border border-stone-200 shadow-2xs space-y-3"
                      >
                        {/* Group Header */}
                        <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
                          <input
                            type="text"
                            value={group.nameAr}
                            onChange={(e) => {
                              const copy = [...(editingItem.optionGroups || [])];
                              copy[gIdx].nameAr = e.target.value;
                              copy[gIdx].nameEn = e.target.value;
                              setEditingItem({ ...editingItem, optionGroups: copy });
                            }}
                            placeholder="اسم المجموعة (مثال: اختر الصلصة، إضافات الجبن)"
                            className="flex-1 px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg font-bold text-xs text-stone-900 focus:outline-none focus:bg-white focus:border-[#780000]"
                          />
                          <label className="flex items-center gap-1.5 px-2.5 py-1.5 bg-stone-100 rounded-lg text-xs font-bold text-stone-700 cursor-pointer hover:bg-stone-200 transition shrink-0">
                            <input
                              type="checkbox"
                              checked={group.required}
                              onChange={(e) => {
                                const copy = [...(editingItem.optionGroups || [])];
                                copy[gIdx].required = e.target.checked;
                                setEditingItem({ ...editingItem, optionGroups: copy });
                              }}
                              className="rounded border-stone-300 text-[#780000] focus:ring-[#780000]"
                            />
                            <span>اختيار إلزامي</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const copy = editingItem.optionGroups?.filter((_, i) => i !== gIdx);
                              setEditingItem({ ...editingItem, optionGroups: copy });
                            }}
                            className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition shrink-0"
                            title="حذف المجموعة"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Options Inside Group */}
                        <div className="space-y-2 pr-2 border-r-2 border-stone-200">
                          {group.options.map((opt, oIdx) => (
                            <div key={opt.id} className="flex items-center gap-2">
                              <input
                                type="text"
                                value={opt.nameAr}
                                onChange={(e) => {
                                  const copy = [...(editingItem.optionGroups || [])];
                                  copy[gIdx].options[oIdx].nameAr = e.target.value;
                                  copy[gIdx].options[oIdx].nameEn = e.target.value;
                                  setEditingItem({ ...editingItem, optionGroups: copy });
                                }}
                                placeholder="اسم الإضافة (مثال: جبن شيدر، صوص ثومية)"
                                className="flex-1 px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-stone-800 focus:outline-none focus:bg-white focus:border-[#780000]"
                              />
                              <div className="relative w-28 shrink-0">
                                <input
                                  type="number"
                                  value={opt.price}
                                  onChange={(e) => {
                                    const copy = [...(editingItem.optionGroups || [])];
                                    copy[gIdx].options[oIdx].price = Number(e.target.value) || 0;
                                    setEditingItem({ ...editingItem, optionGroups: copy });
                                  }}
                                  placeholder="0 = مجاني"
                                  className="w-full pl-8 pr-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-bold text-stone-900 focus:outline-none focus:bg-white focus:border-[#780000]"
                                />
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-stone-400 font-bold pointer-events-none">
                                  {settings?.currency || "د.ع"}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const copy = [...(editingItem.optionGroups || [])];
                                  copy[gIdx].options = copy[gIdx].options.filter((_, i) => i !== oIdx);
                                  setEditingItem({ ...editingItem, optionGroups: copy });
                                }}
                                className="p-1 text-stone-400 hover:text-red-500 rounded transition shrink-0"
                                title="إزالة الخيار"
                              >
                                <X className="w-3.5 h-3.5" />
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
                                nameEn: "إضافة جديدة",
                                price: 0,
                              });
                              setEditingItem({ ...editingItem, optionGroups: copy });
                            }}
                            className="text-[11px] text-[#780000] hover:text-[#500000] font-bold flex items-center gap-1 pt-1 transition"
                          >
                            <Plus className="w-3 h-3 stroke-[2.5]" />
                            <span>إضافة خيار آخر في هذه المجموعة</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-stone-500 bg-white/70 border border-dashed border-stone-200 rounded-xl p-3 text-center">
                    لا توجد إضافات مخصصة لهذا الطبق
                  </p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-white border-t border-stone-100 flex items-center justify-between gap-3 shadow-inner">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition"
              >
                إلغاء التعديل
              </button>
              <button
                type="button"
                onClick={handleSaveMenuItem}
                className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#780000] hover:bg-[#600000] text-white shadow-md hover:shadow-lg transition flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>حفظ ونشر الطبق في المنيو</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CATEGORY EDIT / ADD MODAL */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-stone-200">
            <div className="flex justify-between items-center pb-2 border-b border-stone-100">
              <h3 className="text-sm font-black text-stone-900">
                {isNewCategory ? "إضافة قسم جديد للمنيو" : `تعديل قسم: ${editingCategory.nameAr}`}
              </h3>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="w-7 h-7 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-400 hover:text-stone-700 flex items-center justify-center transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-stone-800 block mb-1.5">اسم القسم في المنيو:</label>
                <input
                  type="text"
                  value={editingCategory.nameAr}
                  onChange={(e) =>
                    setEditingCategory({
                      ...editingCategory,
                      nameAr: e.target.value,
                      nameEn: e.target.value,
                    })
                  }
                  placeholder="مثال: مقبلات ساخنة، مشويات، مشروبات"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl font-bold text-xs text-stone-900 focus:outline-none focus:bg-white focus:border-[#780000]"
                />
              </div>

              <div>
                <label className="font-bold text-stone-800 block mb-1.5">ترتيب ظهور القسم:</label>
                <input
                  type="number"
                  value={editingCategory.sortOrder}
                  onChange={(e) =>
                    setEditingCategory({
                      ...editingCategory,
                      sortOrder: Number(e.target.value) || 1,
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl font-bold text-xs text-stone-900 focus:outline-none focus:bg-white focus:border-[#780000]"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-stone-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleSaveCategory}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#780000] hover:bg-[#600000] text-white shadow-xs transition"
              >
                حفظ القسم
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
